import { NextResponse } from "next/server";
import { createSessionCookieHeader, getSessionFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
    const session = getSessionFromRequest(request);

    if (!session) {
        return NextResponse.json({
            authenticated: false,
            userId: null,
        });
    }

    const cookieHeader = createSessionCookieHeader(session.userId);

    return NextResponse.json(
        {
            authenticated: true,
            userId: session.userId,
        },
        { status: 200, headers: { "Set-Cookie": cookieHeader } },
    );
}
