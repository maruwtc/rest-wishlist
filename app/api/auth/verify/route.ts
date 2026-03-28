import { NextResponse } from "next/server";
import { isValidLoginPin } from "@/lib/password-store";

export async function POST(request: Request) {
    const body = await request.json().catch(() => ({}));
    const pin = typeof body.pin === "string" ? body.pin : "";

    if (!(await isValidLoginPin(pin))) {
        return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
    }

    return NextResponse.json({ success: true });
}
