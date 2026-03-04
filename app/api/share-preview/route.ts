import { NextResponse } from "next/server";

import { findFirstUrl, parseSharedText, resolveShareLink } from "@/lib/share-link";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { shareText?: string };
    const shareText = body.shareText?.trim() ?? "";

    if (!shareText) {
      return NextResponse.json(
        { error: "Share text is required." },
        { status: 400 },
      );
    }

    const parsed = parseSharedText(shareText);
    const shareUrl = findFirstUrl(shareText);

    if (!shareUrl) {
      return NextResponse.json({ preview: parsed });
    }

    const resolved = await resolveShareLink(shareUrl);

    return NextResponse.json({
      preview: {
        ...parsed,
        url: resolved.url ?? parsed.url,
        source: resolved.source ?? parsed.source,
        sourceLabel: resolved.sourceLabel ?? parsed.sourceLabel,
        name: parsed.name || resolved.name || "",
        address: parsed.address || resolved.address || "",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to resolve share link.",
      },
      { status: 500 },
    );
  }
}
