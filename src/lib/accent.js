export const DEFAULT_ACCENT = "#4f46e5";

/** Curated preset swatches shown alongside the free-pick color input. */
export const ACCENT_PRESETS = [
  { name: "Indigo", value: "#4f46e5" },
  { name: "Blue", value: "#2563eb" },
  { name: "Teal", value: "#0d9488" },
  { name: "Emerald", value: "#059669" },
  { name: "Amber", value: "#d97706" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Zinc", value: "#3f3f46" },
];

export function isValidHexColor(value) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}
