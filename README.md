# Maru Restaurant Wishlist

Maru is a private, mobile-first restaurant wishlist built with Next.js.  
It helps you capture places from share links (Google Maps or OpenRice), organize them in one list, and quickly decide where to eat next with random picks.

The app is designed for fast personal use:
- daily PIN gate before entering the app
- one-screen flow to add, browse, and manage entries
- Redis-backed persistence for deployment on Vercel

## What It Does

- Adds restaurants from pasted share text or URLs
- Auto-detects source (`Google Maps`, `OpenRice`, or `Manual`)
- Attempts to resolve Google Maps short links for better name/address preview
- Stores notes, status (`pending` / `visited`), and 0-5 star rating
- Supports updating status/rating and deleting items
- Shows random recommendations from your saved list

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui components
- Upstash Redis (`@upstash/redis`) for data storage

## Data Storage

Create a Vercel Redis database and provide one of these environment variable pairs:

```bash
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

or

```bash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Restaurants are stored as an array under Redis key `maru:restaurants`.

## Local Development

Install dependencies and run the dev server:

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Scripts

- `pnpm dev` - start local development server
- `pnpm build` - build for production
- `pnpm start` - run production server
- `pnpm lint` - run ESLint
