import { getRedisClient, isRedisConfigured } from "@/lib/redis";

const PASSWORDS_KEY = "maru:passwords";

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

async function loadStoredHashes() {
    if (!isRedisConfigured()) {
        return [];
    }

    const redis = getRedisClient();
    const stored = await redis.get<unknown>(PASSWORDS_KEY);

    if (Array.isArray(stored) && stored.every((item) => typeof item === "string" && item.length === 64)) {
        return stored as string[];
    }

    return [];
}

export async function isValidLoginPin(pin: string) {
    const normalizedPin = normalizePin(pin);

    if (normalizedPin.length !== 8) {
        return false;
    }

    const hashedPin = await hashString(normalizedPin);
    const allowedHashes = await loadStoredHashes();

    return allowedHashes.some((allowedHash) =>
        timingSafeCompare(allowedHash, hashedPin),
    );
}
