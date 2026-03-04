"use client";

import { useMemo, useState } from "react";

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
import { ThemeToggle } from "@/components/theme-toggle";
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

function createRandomSeed() {
  return Math.floor(Math.random() * 233280) || 1;
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
    <article className="rounded-[26px] border border-slate-300 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/15 dark:bg-slate-900/70 dark:shadow-[0_12px_40px_rgba(2,6,23,0.28)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
              {item.name}
            </h3>
            <Badge>{item.sourceLabel}</Badge>
          </div>
          {item.address ? (
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              {item.address}
            </p>
          ) : null}
          {item.notes ? (
            <p className="text-sm leading-6 text-slate-700 dark:text-slate-200/85">
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
          {deleting ? (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 animate-spin"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 3a9 9 0 1 0 9 9" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 3h6" />
              <path d="M4 7h16" />
              <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          )}
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span>{formatRelativeDate(item.createdAt)}</span>
        {item.url ? (
          <a
            className="font-medium text-sky-700 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
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
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [shuffleSeed, setShuffleSeed] = useState(createRandomSeed);

  const parsedPreview = useMemo(
    () => parseSharedText(draft.shareText),
    [draft.shareText],
  );
  const isSubmittable = Boolean(
    draft.shareText.trim() || draft.name.trim() || draft.address.trim() || draft.notes.trim(),
  );
  const randomPicks = useMemo(
    () => getRandomPicks(items, shuffleSeed, Math.min(3, items.length)),
    [items, shuffleSeed],
  );

  function updateDraft<Key extends keyof Draft>(key: Key, value: Draft[Key]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void (async () => {
      try {
        setIsAdding(true);
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
        setShuffleSeed(createRandomSeed());
        setDraft(initialDraft);
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Failed to save restaurant.",
        );
      } finally {
        setIsAdding(false);
      }
    })();
  }

  function handleDelete(id: string) {
    void (async () => {
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
        setShuffleSeed(createRandomSeed());
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Failed to delete restaurant.",
        );
      } finally {
        setDeletingId(null);
      }
    })();
  }

  return (
    <main className="h-[100svh] snap-y snap-mandatory overflow-y-auto overscroll-y-none scroll-smooth">
      <section className="h-[100svh] snap-start snap-always overflow-hidden">
        <div className="safe-page mx-auto flex h-full w-full max-w-7xl items-stretch px-4 py-0 sm:px-6 lg:px-8">
          <div className="relative safe-screen w-full overflow-y-auto rounded-[36px] border border-slate-300/90 bg-white/60 px-5 py-6 overscroll-contain backdrop-blur sm:px-8 sm:py-8 lg:px-10 lg:py-10 dark:border-white/15 dark:bg-slate-950/45">
            <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block" />
            <div className="relative grid min-h-full content-between gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] flex-col items-center justify-between lg:items-start">
              <div className="flex flex-col items-center gap-10 justify-between lg:items-start">
                <div className="flex space-y-4 justify-center lg:justify-start">
                  <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl md:text-6xl lg:text-7xl dark:text-white">
                    Restaurant wishlist
                  </h1>
                </div>

                <div className="flex flex-col flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>Click or scroll</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <a className="rounded-full border border-slate-300 bg-white px-4 py-2 font-medium text-slate-950 dark:border-white/15 dark:bg-white/8 dark:text-white" href="#add">
                      Add a restaurant
                    </a>
                    <a className="rounded-full border border-slate-300 bg-slate-100/90 px-4 py-2 font-medium text-slate-950 dark:border-white/15 dark:bg-white/6 dark:text-white" href="#list">
                      View saved list
                    </a>
                  </div>
                </div>

                <div className="">
                  {randomPicks.length === 0 ? (
                    <div className="rounded-[22px] border border-slate-300 bg-slate-100/80 p-4 text-sm text-slate-600 dark:border-white/15 dark:bg-white/6 dark:text-slate-300">
                      Save a few restaurants first, then this section will surface random picks.
                    </div>
                  ) : (
                    <div className="flex min-h-56 flex-wrap content-center items-center gap-3 py-3">
                      {randomPicks.map((item, index) => (
                        <div
                          key={item.id}
                          className="float-chip rounded-full border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-950 shadow-[0_16px_32px_rgba(26,115,232,0.12)] dark:border-white/15 dark:bg-slate-900/80 dark:text-white dark:shadow-[0_16px_32px_rgba(2,132,199,0.14)]"
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
              <div className="flex items-center justify-center">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="add" className="h-[100svh] snap-start snap-always overflow-hidden">
        <div className="safe-page mx-auto flex h-full w-full max-w-7xl items-stretch px-4 py-0 sm:px-6 lg:px-8">
          <Card className="safe-panel flex min-h-0 w-full flex-col overflow-hidden bg-white/60 backdrop-blur dark:bg-slate-950/45">
            <CardHeader className="border-b border-slate-300 pb-5 dark:border-white/15">
              <CardTitle>Add a restaurant</CardTitle>
              <CardDescription>
                Paste share text from OpenRice or Google Maps.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto pt-6 overscroll-contain">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {error ? (
                  <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-100">
                    {error}
                  </div>
                ) : null}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-950 dark:text-white" htmlFor="share-text">
                    Share text or link
                  </label>
                  <Textarea
                    id="share-text"
                    placeholder={"War Rooms by Top Blade\n網址: https://s.openrice.com/QrbS0228C00~uj_kIAA\n..."}
                    value={draft.shareText}
                    onChange={(event) => {
                      updateDraft("shareText", event.target.value);
                      setError(null);
                    }}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-slate-950 dark:text-white" htmlFor="name">
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
                    <label className="text-sm font-medium text-slate-950 dark:text-white" htmlFor="address">
                      Address
                    </label>
                    <Input
                      id="address"
                      placeholder={parsedPreview.address || "Area or address"}
                      value={draft.address}
                      onChange={(event) => updateDraft("address", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-slate-950 dark:text-white" htmlFor="notes">
                      Notes
                    </label>
                    <Textarea
                      id="notes"
                      className="min-h-18"
                      placeholder="Good for late dinner, date night, omakase, queue is long..."
                      value={draft.notes}
                      onChange={(event) => updateDraft("notes", event.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full justify-center mt-6"
                  disabled={!isSubmittable || isAdding}
                >
                  {isAdding ? "Saving..." : "Add to wishlist"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="list" className="h-[100svh] snap-start snap-always overflow-hidden">
        <div className="safe-page mx-auto flex h-full w-full max-w-7xl items-stretch px-4 py-0 sm:px-6 lg:px-8">
          <Card className="safe-panel flex min-h-0 w-full flex-col overflow-hidden bg-white/60 backdrop-blur dark:bg-slate-950/45">
            <CardHeader className="border-b border-slate-300 pb-5 dark:border-white/15">
              <CardTitle>Saved restaurants</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto pt-6 overscroll-contain">
              {items.length === 0 ? (
                <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-[26px] border border-dashed border-slate-300 bg-slate-100/70 p-8 text-center dark:border-white/15 dark:bg-white/6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-sky-700 dark:bg-white/10 dark:text-sky-300">
                    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 8h16" />
                      <path d="M6 4h12l2 4H4l2-4Z" />
                      <path d="M5 10h14v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-7Z" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                      No saved spots yet
                    </h3>
                    <p className="mx-auto max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
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
                      deleting={deletingId === item.id}
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
