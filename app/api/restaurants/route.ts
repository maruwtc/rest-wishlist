import { NextResponse } from "next/server";

import {
  createRestaurant,
  listRestaurants,
  type CreateRestaurantInput,
} from "@/lib/restaurant-store";
import { isRedisConfigured } from "@/lib/redis";

export const dynamic = "force-dynamic";

function storageErrorResponse() {
  return NextResponse.json(
    {
      error:
        "Redis is not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
    },
    { status: 500 },
  );
}

export async function GET() {
  if (!isRedisConfigured()) {
    return storageErrorResponse();
  }

  try {
    const items = await listRestaurants();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load restaurants.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isRedisConfigured()) {
    return storageErrorResponse();
  }

  try {
    const body = (await request.json()) as Partial<CreateRestaurantInput>;
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "Restaurant name is required." },
        { status: 400 },
      );
    }

    const item = await createRestaurant({
      name,
      source: body.source ?? "manual",
      sourceLabel: body.sourceLabel ?? "Manual",
      url: body.url?.trim() || undefined,
      address: body.address?.trim() || undefined,
      notes: body.notes?.trim() || undefined,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create restaurant.",
      },
      { status: 500 },
    );
  }
}
