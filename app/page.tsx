import { RestaurantWishlist } from "@/components/restaurant-wishlist";
import { listRestaurantsSafely } from "@/lib/restaurant-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { items, storageError } = await listRestaurantsSafely();

  return <RestaurantWishlist initialItems={items} initialError={storageError} />;
}
