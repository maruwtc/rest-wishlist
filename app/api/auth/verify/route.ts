import { NextResponse } from "next/server";
import { createSessionCookieHeader } from "@/lib/auth";
import { getRedisClient, isRedisConfigured } from "@/lib/redis";
import { findUserByPin, toAuthenticatedUser, updateUserLastLogin } from "@/lib/password-store";

const AUTH_ATTEMPT_WINDOW_SECONDS = 60 * 5;
const AUTH_MAX_ATTEMPTS = 5;
const AUTH_LOCK_SECONDS = 60 * 15;
const TRUST_PROXY_IP = process.env.TRUST_PROXY_IP === "1";

function getRequestIp(request: Request) {
    if (!TRUST_PROXY_IP) {
        return "unknown";
    }

    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }

    return request.headers.get("x-real-ip") ?? "unknown";
}

async function incrementAuthAttempts(redis: ReturnType<typeof getRedisClient>, key: string) {
    const attempts = await redis.incr(key);
    if (attempts === 1) {
        await redis.expire(key, AUTH_ATTEMPT_WINDOW_SECONDS);
    }
    return attempts;
}

export async function POST(request: Request) {
    if (!isRedisConfigured()) {
        return NextResponse.json(
            { error: "Authentication backend is unavailable." },
            { status: 500 },
        );
    }

    const redis = getRedisClient();
    const ip = getRequestIp(request);
    const lockKey = `maru:auth:lock:${ip}`;
    const attemptsKey = `maru:auth:attempts:${ip}`;

    if (await redis.get(lockKey)) {
        return NextResponse.json(
            { error: "Too many failed attempts. Try again later." },
            { status: 429 },
        );
    }

    const body = await request.json().catch(() => ({}));
    const pin = typeof body.pin === "string" ? body.pin : "";

    const user = await findUserByPin(pin);

    if (!user) {
        const attempts = await incrementAuthAttempts(redis, attemptsKey);
        if (attempts >= AUTH_MAX_ATTEMPTS) {
            await redis.set(lockKey, "1");
            await redis.expire(lockKey, AUTH_LOCK_SECONDS);
            return NextResponse.json(
                { error: "Too many failed attempts. Try again later." },
                { status: 429 },
            );
        }

        return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
    }

    await redis.del(attemptsKey);
    await redis.del(lockKey);

    const updatedUser = await updateUserLastLogin(user.id);
    const responseUser = toAuthenticatedUser(updatedUser ?? user);
    const setCookie = createSessionCookieHeader(user.id);

    return NextResponse.json(
        { success: true, user: responseUser },
        { status: 200, headers: { "Set-Cookie": setCookie } },
    );
}
