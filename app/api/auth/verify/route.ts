import { NextResponse } from "next/server";
import { createSessionCookieHeader } from "@/lib/auth";
import { findUserByPin, toAuthenticatedUser, updateUserLastLogin } from "@/lib/password-store";

export async function POST(request: Request) {
    const body = await request.json().catch(() => ({}));
    const pin = typeof body.pin === "string" ? body.pin : "";

    const user = await findUserByPin(pin);

    if (!user) {
        return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
    }

    const updatedUser = await updateUserLastLogin(user.id);
    const responseUser = toAuthenticatedUser(updatedUser ?? user);
    const setCookie = createSessionCookieHeader(user.id);

    return NextResponse.json(
        { success: true, user: responseUser },
        { status: 200, headers: { "Set-Cookie": setCookie } },
    );
}
