import { getRedisClient, isRedisConfigured } from "@/lib/redis";

const RESTAURANTS_KEY = "maru:restaurants";

export type RestaurantSource = "google-maps" | "openrice" | "manual";
export type RestaurantStatus = "pending" | "visited";

export type RestaurantItem = {
  id: string;
  name: string;
  source: RestaurantSource;
  sourceLabel: string;
  status: RestaurantStatus;
  rating: 0 | 1 | 2 | 3 | 4 | 5;
  url?: string;
  address?: string;
  notes?: string;
  createdAt: string;
};

export type CreateRestaurantInput = {
  name: string;
  source: RestaurantSource;
  sourceLabel: string;
  status: RestaurantStatus;
  rating: 0 | 1 | 2 | 3 | 4 | 5;
  url?: string;
  address?: string;
  notes?: string;
};

export type UpdateRestaurantInput = {
  status?: RestaurantStatus;
  rating?: 0 | 1 | 2 | 3 | 4 | 5;
};

function normalizeRestaurantItem(rawItem: unknown): RestaurantItem | null {
  if (!rawItem || typeof rawItem !== "object") {
    return null;
  }

  const item = rawItem as Partial<RestaurantItem>;
  if (!item.id || !item.name || !item.source || !item.sourceLabel || !item.createdAt) {
    return null;
  }

  const normalizedStatus: RestaurantStatus = item.status === "visited" ? "visited" : "pending";

  return {
    id: item.id,
    name: item.name,
    source: item.source,
    sourceLabel: item.sourceLabel,
    status: normalizedStatus,
    rating:
      typeof item.rating === "number" && item.rating >= 0 && item.rating <= 5
        ? (item.rating as 0 | 1 | 2 | 3 | 4 | 5)
        : normalizedStatus === "visited"
          ? 3
          : 0,
    url: item.url,
    address: item.address,
    notes: item.notes,
    createdAt: item.createdAt,
  };
}

export async function listRestaurants() {
  const redis = getRedisClient();
  const items = await redis.get<unknown>(RESTAURANTS_KEY);

  if (!Array.isArray(items)) {
    return [] as RestaurantItem[];
  }

  return items
    .map(normalizeRestaurantItem)
    .filter((item): item is RestaurantItem => item !== null);
}

export async function listRestaurantsSafely() {
  if (!isRedisConfigured()) {
    return {
      items: [] as RestaurantItem[],
      storageError:
        "Redis is not configured. Add the Vercel Redis env vars before using the wishlist.",
    };
  }

  try {
    return {
      items: await listRestaurants(),
      storageError: null,
    };
  } catch (error) {
    return {
      items: [] as RestaurantItem[],
      storageError:
        error instanceof Error ? error.message : "Failed to load restaurants from Redis.",
    };
  }
}

export async function createRestaurant(input: CreateRestaurantInput) {
  const items = await listRestaurants();

  const item: RestaurantItem = {
    id: crypto.randomUUID(),
    name: input.name,
    source: input.source,
    sourceLabel: input.sourceLabel,
    status: input.status,
    rating: input.rating,
    url: input.url,
    address: input.address,
    notes: input.notes,
    createdAt: new Date().toISOString(),
  };

  const nextItems = [item, ...items];
  const redis = getRedisClient();
  await redis.set(RESTAURANTS_KEY, nextItems);

  return item;
}

export async function deleteRestaurant(id: string) {
  const items = await listRestaurants();
  const nextItems = items.filter((item) => item.id !== id);
  const redis = getRedisClient();
  await redis.set(RESTAURANTS_KEY, nextItems);

  return nextItems;
}

export async function updateRestaurant(id: string, input: UpdateRestaurantInput) {
  const items = await listRestaurants();
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const current = items[index];
  const nextItem: RestaurantItem = {
    ...current,
    status: input.status ?? current.status,
    rating: input.rating ?? current.rating,
  };
  const nextItems = [...items];
  nextItems[index] = nextItem;

  const redis = getRedisClient();
  await redis.set(RESTAURANTS_KEY, nextItems);

  return nextItem;
}
