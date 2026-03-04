"use client";

import { useMemo, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type CreateRestaurantInput,
  type RestaurantItem,
} from "@/lib/restaurant-store";
import { parseSharedText, sourceLabel } from "@/lib/share-link";
import { formatRelativeDate } from "@/lib/utils";

type Draft = {
  shareText: string;
  name: string;
  address: string;
  notes: string;
};

const EMPTY_ITEMS: RestaurantItem[] = [];

const initialDraft: Draft = {
  shareText: "",
  name: "",
  address: "",
  notes: "",
};

function createRestaurantPayload(draft: Draft): CreateRestaurantInput {
  const parsed = parseSharedText(draft.shareText);
  const source = parsed.url ? parsed.source : "manual";

  return {
    name: draft.name.trim() || parsed.name || "Untitled restaurant",
    source,
    sourceLabel: sourceLabel(source),
    url: parsed.url,
    address: draft.address.trim() || parsed.address || undefined,
    notes: draft.notes.trim() || undefined,
  };
}

async function resolveSharePreview(shareText: string) {
  const response = await fetch("/api/share-preview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ shareText }),
  });

  const data = (await response.json()) as {
    preview?: ReturnType<typeof parseSharedText>;
    error?: string;
  };

  if (!response.ok || !data.preview) {
    throw new Error(data.error ?? "Failed to resolve share link.");
  }

  return data.preview;
}

function getRandomPicks(items: RestaurantItem[], seed: number, count: number) {
  if (items.length === 0) {
    return EMPTY_ITEMS;
  }

  const pool = [...items];
  const picks: RestaurantItem[] = [];
  let localSeed = seed;

  while (pool.length > 0 && picks.length < count) {
    localSeed = (localSeed * 9301 + 49297) % 233280;
    const index = Math.floor((localSeed / 233280) * pool.length);
    picks.push(pool.splice(index, 1)[0]);
  }

  return picks;
}

function getStableSeed(items: RestaurantItem[]) {
  return items.reduce((seed, item, index) => {
    let next = seed + index;

    for (const char of item.id) {
      next = (next * 31 + char.charCodeAt(0)) % 233280;
    }

    return next;
  }, items.length || 1);
}

function RestaurantRow({
  item,
  onDelete,
  deleting,
}: {
  item: RestaurantItem;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  return (
    <article className="rounded-[26px] border border-[var(--border)] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-[-0.02em] text-[var(--foreground)]">
              {item.name}
            </h3>
            <Badge>{item.sourceLabel}</Badge>
          </div>
          {item.address ? (
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              {item.address}
            </p>
          ) : null}
          {item.notes ? (
            <p className="text-sm leading-6 text-[var(--foreground)]/78">
              {item.notes}
            </p>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full"
          aria-label={`Delete ${item.name}`}
          onClick={() => onDelete(item.id)}
          disabled={deleting}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 3h6" />
            <path d="M4 7h16" />
            <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
        <span>{formatRelativeDate(item.createdAt)}</span>
        {item.url ? (
          <a
            className="font-medium text-[var(--primary)] hover:text-[var(--primary-strong)]"
            href={item.url}
            target="_blank"
            rel="noreferrer"
          >
            Open source link
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function RestaurantWishlist({
  initialItems,
  initialError,
}: {
  initialItems: RestaurantItem[];
  initialError: string | null;
}) {
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [items, setItems] = useState<RestaurantItem[]>(initialItems);
  const [error, setError] = useState<string | null>(initialError);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsedPreview = useMemo(
    () => parseSharedText(draft.shareText),
    [draft.shareText],
  );
  const isSubmittable = Boolean(
    draft.shareText.trim() || draft.name.trim() || draft.address.trim() || draft.notes.trim(),
  );
  const randomPicks = useMemo(
    () => getRandomPicks(items, getStableSeed(items), Math.min(3, items.length)),
    [items],
  );

  function updateDraft<Key extends keyof Draft>(key: Key, value: Draft[Key]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        setError(null);
        let nextDraft = draft;
        const parsed = parseSharedText(draft.shareText);

        if (parsed.url && (!draft.name.trim() || !draft.address.trim())) {
          try {
            const preview = await resolveSharePreview(draft.shareText);

            nextDraft = {
              ...draft,
              name: draft.name.trim() || preview.name || draft.name,
              address: draft.address.trim() || preview.address || draft.address,
            };

            setDraft(nextDraft);
          } catch {
            // Fall back to local parsing when the short-link lookup fails.
          }
        }

        const payload = createRestaurantPayload(nextDraft);

        const response = await fetch("/api/restaurants", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as {
          item?: RestaurantItem;
          error?: string;
        };

        if (!response.ok || !data.item) {
          throw new Error(data.error ?? "Failed to save restaurant.");
        }

        setItems((current) => [data.item!, ...current]);
        setDraft(initialDraft);
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Failed to save restaurant.",
        );
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        setError(null);
        setDeletingId(id);

        const response = await fetch(`/api/restaurants/${id}`, {
          method: "DELETE",
        });
        const data = (await response.json()) as {
          items?: RestaurantItem[];
          error?: string;
        };

        if (!response.ok || !data.items) {
          throw new Error(data.error ?? "Failed to delete restaurant.");
        }

        setItems(data.items);
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Failed to delete restaurant.",
        );
      } finally {
        setDeletingId(null);
      }
    });
  }

  return (
    <main className="h-[100svh] snap-y snap-mandatory overflow-y-auto overscroll-y-none scroll-smooth">
      <section className="h-[100svh] snap-start snap-always overflow-hidden">
        <div className="safe-page mx-auto flex h-full w-full max-w-7xl items-stretch px-4 py-0 sm:px-6 lg:px-8">
          <div className="relative safe-screen w-full overflow-y-auto rounded-[36px] border border-white/70 bg-[radial-gradient(circle_at_top_left,#ffffff_0%,#eaf2ff_42%,#dce8ff_100%)] px-5 py-6 shadow-[0_30px_80px_rgba(60,64,67,0.12)] overscroll-contain sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,rgba(26,115,232,0.12),transparent_68%)] lg:block" />
            <div className="relative grid min-h-full content-between gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-end">
              <div className="flex flex-col justify-between gap-8">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-5xl md:text-6xl">
                      Restaurant wishlist
                    </h1>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)] flex-row justify-between items-center">
                  <span>Click or scroll</span>
                  <div>
                    <a className="rounded-full bg-white px-4 py-2 font-medium text-[var(--foreground)]" href="#add">
                      Add a restaurant
                    </a>
                    <a className="rounded-full bg-white/70 px-4 py-2 font-medium text-[var(--foreground)]" href="#list">
                      View saved list
                    </a>
                  </div>
                </div>
                <div>
                  {randomPicks.length === 0 ? (
                    <div className="rounded-[22px] bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted-foreground)]">
                      Save a few restaurants first, then this section will surface random picks from Redis.
                    </div>
                  ) : (
                    <div className="flex min-h-56 flex-wrap content-center items-center gap-3 py-3">
                      {randomPicks.map((item, index) => (
                        <div
                          key={item.id}
                          className="float-chip rounded-full border border-white/80 bg-white px-5 py-3 text-base font-semibold text-[var(--foreground)] shadow-[0_16px_32px_rgba(26,115,232,0.12)]"
                          style={{
                            animationDelay: `${index * 0.45}s`,
                          }}
                        >
                          {item.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="add" className="h-[100svh] snap-start snap-always overflow-hidden">
        <div className="safe-page mx-auto flex h-full w-full max-w-7xl items-stretch px-4 py-0 sm:px-6 lg:px-8">
          <Card className="safe-panel flex min-h-0 w-full flex-col overflow-hidden border-white/80 bg-white/92 backdrop-blur">
            <CardHeader className="border-b border-[var(--border)] pb-5">
              <CardTitle>Add a restaurant</CardTitle>
              <CardDescription>
                Paste share text from Google Maps or OpenRice, then store it in Redis.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto pt-6 overscroll-contain">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="share-text">
                    Share text or link
                  </label>
                  <Textarea
                    id="share-text"
                    placeholder={"Example:\nMaru Korean Restaurant\n123 Sample Road\nhttps://maps.app.goo.gl/..."}
                    value={draft.shareText}
                    onChange={(event) => {
                      updateDraft("shareText", event.target.value);
                      setError(null);
                    }}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="name">
                      Name
                    </label>
                    <Input
                      id="name"
                      placeholder={parsedPreview.name || "Restaurant name"}
                      value={draft.name}
                      onChange={(event) => updateDraft("name", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="address">
                      Address
                    </label>
                    <Input
                      id="address"
                      placeholder={parsedPreview.address || "Area or address"}
                      value={draft.address}
                      onChange={(event) => updateDraft("address", event.target.value)}
                    />
                  </div>
                  {/* <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="notes">
                      Notes
                    </label>
                    <Textarea
                      id="notes"
                      className="min-h-24"
                      placeholder="Good for late dinner, date night, omakase, queue is long..."
                      value={draft.notes}
                      onChange={(event) => updateDraft("notes", event.target.value)}
                    />
                  </div> */}
                </div>

                {/* <div className="rounded-[24px] bg-[var(--surface-muted)] p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    Parsed preview
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={cn(parsedPreview.url ? "bg-white text-[var(--primary)]" : "")}>
                      {parsedPreview.sourceLabel}
                    </Badge>
                    {parsedPreview.name ? <Badge className="bg-white">{parsedPreview.name}</Badge> : null}
                    {parsedPreview.address ? <Badge className="bg-white">{parsedPreview.address}</Badge> : null}
                  </div>
                </div> */}

                <Button
                  type="submit"
                  className="w-full justify-center"
                  disabled={!isSubmittable || isPending}
                >
                  {isPending ? "Saving..." : "Add to wishlist"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="list" className="h-[100svh] snap-start snap-always overflow-hidden">
        <div className="safe-page mx-auto flex h-full w-full max-w-7xl items-stretch px-4 py-0 sm:px-6 lg:px-8">
          <Card className="safe-panel flex min-h-0 w-full flex-col overflow-hidden border-white/80 bg-white/92 backdrop-blur">
            <CardHeader className="border-b border-[var(--border)] pb-5">
              <CardTitle>Saved restaurants</CardTitle>
              <CardDescription>
                This list is now backed by Redis and stays inside its own panel.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto pt-6 overscroll-contain">
              {items.length === 0 ? (
                <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-[26px] border border-dashed border-[var(--border-strong)] bg-white/86 p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--primary)]">
                    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 8h16" />
                      <path d="M6 4h12l2 4H4l2-4Z" />
                      <path d="M5 10h14v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-7Z" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                      No saved spots yet
                    </h3>
                    <p className="mx-auto max-w-sm text-sm leading-6 text-[var(--muted-foreground)]">
                      Start by pasting a Google Maps or OpenRice share link. New entries will persist in Redis.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pr-1">
                  {items.map((item) => (
                    <RestaurantRow
                      key={item.id}
                      item={item}
                      onDelete={handleDelete}
                      deleting={deletingId === item.id && isPending}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
