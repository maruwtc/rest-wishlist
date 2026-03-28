import { NextResponse } from "next/server";
import { createClearSessionCookieHeader } from "@/lib/auth";

export async function POST() {
    const setCookie = createClearSessionCookieHeader();

    return NextResponse.json(
        { success: true },
        { status: 200, headers: { "Set-Cookie": setCookie } },
    );
}
