import { LoginGate } from "@/components/login-gate";
import { RestaurantWishlist } from "@/components/restaurant-wishlist";
import { listRestaurantsSafely } from "@/lib/restaurant-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { items, storageError } = await listRestaurantsSafely();

  return (
    <LoginGate>
      <RestaurantWishlist initialItems={items} initialError={storageError} />
    </LoginGate>
  );
}
