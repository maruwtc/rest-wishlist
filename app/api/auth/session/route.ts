import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
    const session = getSessionFromRequest(request);

    return NextResponse.json({
        authenticated: session !== null,
        userId: session?.userId ?? null,
    });
}
