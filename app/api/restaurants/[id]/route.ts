import { NextResponse } from "next/server";

import {
  deleteRestaurant,
  updateRestaurant,
  type RestaurantStatus,
} from "@/lib/restaurant-store";
import { isRedisConfigured } from "@/lib/redis";

export const dynamic = "force-dynamic";
const VALID_RATINGS = [0, 1, 2, 3, 4, 5] as const;
const VALID_STATUSES: RestaurantStatus[] = ["pending", "visited"];

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

export async function PATCH(
  request: Request,
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
    const body = (await request.json()) as { rating?: number; status?: RestaurantStatus };

    if (!id) {
      return NextResponse.json({ error: "Restaurant id is required." }, { status: 400 });
    }

    const hasRating = typeof body.rating !== "undefined";
    const hasStatus = typeof body.status !== "undefined";

    if (!hasRating && !hasStatus) {
      return NextResponse.json(
        { error: "At least one field (rating or status) is required." },
        { status: 400 },
      );
    }

    let nextRating: (typeof VALID_RATINGS)[number] | undefined;
    if (hasRating) {
      const rating = Number(body.rating);
      if (!VALID_RATINGS.includes(rating as (typeof VALID_RATINGS)[number])) {
        return NextResponse.json(
          { error: "Rating must be an integer from 0 to 5." },
          { status: 400 },
        );
      }
      nextRating = rating as (typeof VALID_RATINGS)[number];
    }

    let nextStatus: RestaurantStatus | undefined;
    if (hasStatus) {
      if (!body.status || !VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: "Status must be either pending or visited." },
          { status: 400 },
        );
      }
      nextStatus = body.status;
    }

    const item = await updateRestaurant(id, {
      rating: nextRating,
      status: nextStatus,
    });

    if (!item) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update restaurant.",
      },
      { status: 500 },
    );
  }
}
