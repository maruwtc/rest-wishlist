import { getRedisClient, isRedisConfigured } from "@/lib/redis";

const USERS_KEY = "maru:users";

export type LoginUser = {
    id: string;
    name: string;
    passwordHash: string;
    lastLogin: string | null;
    createdAt: string;
};

export type AuthenticatedUser = {
    id: string;
    name: string;
    lastLogin: string | null;
};

function normalizePin(pin: string) {
    return pin.replace(/\D/g, "").slice(0, 8);
}

function timingSafeCompare(a: string, b: string) {
    if (a.length !== b.length) {
        return false;
    }

    let diff = 0;

    for (let i = 0; i < a.length; i += 1) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return diff === 0;
}

async function hashString(value: string) {
    if (typeof crypto?.subtle?.digest === "function") {
        const encoded = new TextEncoder().encode(value);
        const digest = await crypto.subtle.digest("SHA-256", encoded);
        return Array.from(new Uint8Array(digest))
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("");
    }

    const nodeCrypto = await import("crypto");
    return nodeCrypto.createHash("sha256").update(value).digest("hex");
}

function isStoredUsers(value: unknown): value is LoginUser[] {
    return (
        Array.isArray(value) &&
        value.every(
            (item) =>
                typeof item === "object" &&
                item !== null &&
                typeof (item as any).id === "string" &&
                typeof (item as any).name === "string" &&
                typeof (item as any).passwordHash === "string" &&
                typeof (item as any).createdAt === "string" &&
                (typeof (item as any).lastLogin === "string" || (item as any).lastLogin === null),
        )
    );
}

async function loadUsersFromRedis() {
    if (!isRedisConfigured()) {
        return [] as LoginUser[];
    }

    const redis = getRedisClient();
    const stored = await redis.get<unknown>(USERS_KEY);

    if (isStoredUsers(stored)) {
        return stored;
    }

    return [];
}

async function ensureUserRecords() {
    return await loadUsersFromRedis();
}

export async function findUserByPin(pin: string) {
    const normalizedPin = normalizePin(pin);

    if (normalizedPin.length !== 8) {
        return null;
    }

    const hashedPin = await hashString(normalizedPin);
    const users = await ensureUserRecords();

    return users.find((user) => timingSafeCompare(user.passwordHash, hashedPin)) ?? null;
}

export async function updateUserLastLogin(userId: string) {
    const users = await ensureUserRecords();
    const index = users.findIndex((user) => user.id === userId);

    if (index === -1) {
        return null;
    }

    const updatedUser: LoginUser = {
        ...users[index],
        lastLogin: new Date().toISOString(),
    };
    const nextUsers = [...users];
    nextUsers[index] = updatedUser;

    if (isRedisConfigured()) {
        const redis = getRedisClient();
        await redis.set(USERS_KEY, nextUsers);
    }

    return updatedUser;
}

export function toAuthenticatedUser(user: LoginUser): AuthenticatedUser {
    return {
        id: user.id,
        name: user.name,
        lastLogin: user.lastLogin,
    };
}

export async function isValidLoginPin(pin: string) {
    const user = await findUserByPin(pin);
    return user !== null;
}
