export type ParsedShareData = {
  name: string;
  address: string;
  url?: string;
  source: "google-maps" | "openrice" | "manual";
  sourceLabel: string;
};

type ExtractedLocationDetails = {
  name?: string;
  address?: string;
};

export function detectSource(url?: string): ParsedShareData["source"] {
  if (!url) {
    return "manual";
  }

  try {
    const host = new URL(url).hostname.toLowerCase();

    if (host.includes("google.") || host.includes("maps.app.goo.gl")) {
      return "google-maps";
    }

    if (host.includes("openrice")) {
      return "openrice";
    }
  } catch {
    return "manual";
  }

  return "manual";
}

export function sourceLabel(source: ParsedShareData["source"]) {
  switch (source) {
    case "google-maps":
      return "Google Maps";
    case "openrice":
      return "OpenRice";
    default:
      return "Manual";
  }
}

export function findFirstUrl(value: string) {
  return value.match(/https?:\/\/\S+/i)?.[0];
}

export function inferNameFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const queryCandidate =
      parsed.searchParams.get("q") ??
      parsed.searchParams.get("query") ??
      parsed.searchParams.get("name");

    if (queryCandidate) {
      return queryCandidate.split(",")[0]?.trim() ?? "";
    }

    const pathCandidate = decodeURIComponent(
      parsed.pathname.split("/").filter(Boolean).pop() ?? "",
    )
      .replace(/\+/g, " ")
      .replace(/-/g, " ")
      .trim();

    return pathCandidate || "";
  } catch {
    return "";
  }
}

export function parseSharedText(value: string): ParsedShareData {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const url = findFirstUrl(value);
  const source = detectSource(url);
  const firstNonUrlLine = lines.find((line) => !line.includes("http")) ?? "";
  const secondaryLine = lines.find(
    (line) => !line.includes("http") && line !== firstNonUrlLine,
  );

  return {
    name: firstNonUrlLine || (url ? inferNameFromUrl(url) : ""),
    address: secondaryLine ?? "",
    url,
    source,
    sourceLabel: sourceLabel(source),
  };
}

function normalizeCandidate(value?: string) {
  if (!value) {
    return undefined;
  }

  const normalized = decodeURIComponent(value)
    .replace(/\+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || undefined;
}

function cleanGoogleTitle(title: string) {
  return title
    .replace(/\s*-\s*Google Maps\s*$/i, "")
    .replace(/\s*-\s*Google Search\s*$/i, "")
    .trim();
}

export function extractLocationDetailsFromUrl(rawUrl: string): ExtractedLocationDetails {
  try {
    const url = new URL(rawUrl);
    const segments = url.pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => normalizeCandidate(segment))
      .filter((segment): segment is string => Boolean(segment));

    const queryValue =
      normalizeCandidate(url.searchParams.get("q") ?? undefined) ??
      normalizeCandidate(url.searchParams.get("query") ?? undefined) ??
      normalizeCandidate(url.searchParams.get("destination") ?? undefined) ??
      normalizeCandidate(url.searchParams.get("destination_place_id") ?? undefined);

    const placeIndex = segments.findIndex((segment) => segment.toLowerCase() === "place");
    const placeName =
      placeIndex >= 0 ? normalizeCandidate(segments[placeIndex + 1]) : undefined;

    const dirIndex = segments.findIndex((segment) => segment.toLowerCase() === "dir");
    const destinationSegment =
      dirIndex >= 0 ? normalizeCandidate(segments[segments.length - 1]) : undefined;

    const location = placeName ?? queryValue ?? destinationSegment;

    if (!location) {
      return {};
    }

    const parts = location
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      return {
        name: parts[0],
        address: parts.slice(1).join(", "),
      };
    }

    return { name: location };
  } catch {
    return {};
  }
}

export async function resolveShareLink(shareUrl: string) {
  const source = detectSource(shareUrl);

  if (source !== "google-maps") {
    return {
      url: shareUrl,
      source,
      sourceLabel: sourceLabel(source),
    };
  }

  const response = await fetch(shareUrl, {
    method: "GET",
    redirect: "follow",
    headers: {
      "user-agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  const finalUrl = response.url || shareUrl;
  const details = extractLocationDetailsFromUrl(finalUrl);

  const contentType = response.headers.get("content-type") ?? "";
  let titleName: string | undefined;

  if (contentType.includes("text/html")) {
    const body = await response.text();
    const titleMatch = body.match(/<title>([^<]+)<\/title>/i);
    const rawTitle = titleMatch?.[1]?.trim();

    if (rawTitle) {
      const cleanedTitle = cleanGoogleTitle(rawTitle);

      if (cleanedTitle && !/^google maps$/i.test(cleanedTitle)) {
        titleName = cleanedTitle;
      }
    }
  }

  return {
    url: finalUrl,
    source: detectSource(finalUrl),
    sourceLabel: sourceLabel(detectSource(finalUrl)),
    name: details.name ?? titleName,
    address: details.address,
  };
}
