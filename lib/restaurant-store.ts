import { getRedisClient, isRedisConfigured } from "@/lib/redis";

const RESTAURANTS_KEY = "maru:restaurants";

export type RestaurantSource = "google-maps" | "openrice" | "manual";

export type RestaurantItem = {
  id: string;
  name: string;
  source: RestaurantSource;
  sourceLabel: string;
  url?: string;
  address?: string;
  notes?: string;
  createdAt: string;
};

export type CreateRestaurantInput = {
  name: string;
  source: RestaurantSource;
  sourceLabel: string;
  url?: string;
  address?: string;
  notes?: string;
};

export async function listRestaurants() {
  const redis = getRedisClient();
  const items = await redis.get<RestaurantItem[]>(RESTAURANTS_KEY);

  if (!Array.isArray(items)) {
    return [] as RestaurantItem[];
  }

  return items;
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
