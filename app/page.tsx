import { cookies } from "next/headers";
import { LoginGate } from "@/components/login-gate";
import { RestaurantWishlist } from "@/components/restaurant-wishlist";
import { listRestaurantsSafely } from "@/lib/restaurant-store";
import { AUTH_COOKIE_NAME, getSessionFromCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const session = getSessionFromCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  const { items, storageError } = session
    ? await listRestaurantsSafely()
    : { items: [], storageError: null };

  return (
    <LoginGate initialAuthenticated={Boolean(session)}>
      <RestaurantWishlist initialItems={items} initialError={storageError} />
    </LoginGate>
  );
}
