import type { TravelKind, TravelMarker } from "./types";

export const TRAVEL_KIND_META: Record<
  TravelKind,
  { label: string; shortLabel: string }
> = {
  "book-train": { label: "Book train ticket", shortLabel: "Book train" },
  "book-bus": { label: "Book bus ticket", shortLabel: "Book bus" },
  "travel-office": { label: "Travel to office", shortLabel: "Travel to office" },
  "travel-home": { label: "Return home", shortLabel: "Return home" },
};

export function markerLabel(
  kind: TravelKind,
  officeCity: string,
  homeCity: string,
): string {
  switch (kind) {
    case "book-train":
      return officeCity ? `🎫 Book train · ${officeCity}` : "🎫 Book train";
    case "book-bus":
      return officeCity ? `🎫 Book bus · ${officeCity}` : "🎫 Book bus";
    case "travel-office":
      return officeCity ? `🚆 Travel to ${officeCity}` : "🚆 Travel to office";
    case "travel-home":
      return homeCity ? `🏠 Return to ${homeCity}` : "🏠 Return home";
  }
}

export function makeMarker(
  kind: TravelKind,
  officeCity: string,
  homeCity: string,
): TravelMarker {
  return { kind, label: markerLabel(kind, officeCity, homeCity) };
}