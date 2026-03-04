import { NextResponse } from "next/server";

import { deleteRestaurant } from "@/lib/restaurant-store";
import { isRedisConfigured } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isRedisConfigured()) {
    return NextResponse.json(
      {
        error:
          "Redis is not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
      },
      { status: 500 },
    );
  }

  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Restaurant id is required." }, { status: 400 });
    }

    const items = await deleteRestaurant(id);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete restaurant.",
      },
      { status: 500 },
    );
  }
}
