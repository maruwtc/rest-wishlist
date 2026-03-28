import crypto from "crypto";

export const AUTH_COOKIE_NAME = "maru-session";
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const COOKIE_SIGNATURE_ALGO = "sha256";
const isProduction = process.env.NODE_ENV === "production";

const ENV_AUTH_SECRET =
    process.env.AUTH_SECRET ??
    process.env.AUTH_SESSION_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    process.env.PIN_HASH_SECRET;

const AUTH_INSECURE_DEV_SECRET = "maru-local-dev-secret";

const COOKIE_SECRET = (() => {
    if (ENV_AUTH_SECRET) {
        return ENV_AUTH_SECRET;
    }

    if (isProduction) {
        throw new Error(
            "Missing auth secret in production. Set AUTH_SECRET, AUTH_SESSION_SECRET, NEXTAUTH_SECRET or PIN_HASH_SECRET.",
        );
    }

    return AUTH_INSECURE_DEV_SECRET;
})();

type AuthSession = {
    userId: string;
    expiresAt: number;
};

function timingSafeCompare(a: string, b: string) {
    if (a.length !== b.length) {
        return false;
    }

    return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

function signValue(value: string) {
    return crypto
        .createHmac(COOKIE_SIGNATURE_ALGO, COOKIE_SECRET)
        .update(value)
        .digest("hex");
}

export function getAuthSecret() {
    return COOKIE_SECRET;
}

function parseCookieHeader(cookieHeader: string | null) {
    const cookieMap: Record<string, string> = {};

    if (!cookieHeader) {
        return cookieMap;
    }

    for (const cookie of cookieHeader.split(/;\s*/)) {
        const [name, ...rest] = cookie.split("=");
        if (!name || rest.length === 0) {
            continue;
        }
        cookieMap[name] = rest.join("=");
    }

    return cookieMap;
}

export function createSessionCookieValue(userId: string) {
    const expiresAt = Math.floor(Date.now() / 1000) + AUTH_COOKIE_MAX_AGE;
    const payload = `${userId}:${expiresAt}`;
    const signature = signValue(payload);
    return `${payload}:${signature}`;
}

export function createSessionCookieHeader(userId: string) {
    const cookieValue = createSessionCookieValue(userId);
    const attributes = [
        `${AUTH_COOKIE_NAME}=${encodeURIComponent(cookieValue)}`,
        "Path=/",
        `Max-Age=${AUTH_COOKIE_MAX_AGE}`,
        "HttpOnly",
        "SameSite=Strict",
    ];

    if (isProduction) {
        attributes.push("Secure");
    }

    return attributes.join("; ");
}

function parseSessionCookieValue(cookieValue?: string): AuthSession | null {
    if (!cookieValue) {
        return null;
    }

    const decodedValue = decodeURIComponent(cookieValue);
    const parts = decodedValue.split(":");

    if (parts.length !== 3) {
        return null;
    }

    const [userId, expiresAtString, signature] = parts;
    const expiresAt = Number(expiresAtString);

    if (!userId || !Number.isFinite(expiresAt) || !signature) {
        return null;
    }

    const payload = `${userId}:${expiresAt}`;
    if (!timingSafeCompare(signature, signValue(payload))) {
        return null;
    }

    if (Math.floor(Date.now() / 1000) > expiresAt) {
        return null;
    }

    return { userId, expiresAt };
}

export function getSessionFromCookie(cookieValue?: string) {
    return parseSessionCookieValue(cookieValue);
}

export function getSessionFromRequest(request: Request) {
    const cookieHeader = request.headers.get("cookie");
    const cookies = parseCookieHeader(cookieHeader);
    return parseSessionCookieValue(cookies[AUTH_COOKIE_NAME]);
}

export function isRequestAuthenticated(request: Request) {
    return getSessionFromRequest(request) !== null;
}

export function getSessionFromCookies(cookies: { get(name: string): { value: string } | undefined }) {
    return getSessionFromCookie(cookies.get(AUTH_COOKIE_NAME)?.value);
}

export function createClearSessionCookieHeader() {
    const attributes = [
        `${AUTH_COOKIE_NAME}=deleted`,
        "Path=/",
        "Max-Age=0",
        "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
        "HttpOnly",
        "SameSite=Strict",
    ];

    if (isProduction) {
        attributes.push("Secure");
    }

    return attributes.join("; ");
}
