import { daysInMonth, toKey, keyToYMD } from "./dates";

/**
 * Holiday Master
 * ---------------
 * Manage statutory and company holidays here. Three layers:
 *
 *  1. `HOLIDAYS` — explicit year-keyed entries (`"YYYY-MM-DD": "Name"`).
 *     Edit or extend this map for specific future years (e.g. movable lunar
 *     festivals like Holi, which change date every year).
 *
 *  2. `RECURRING_HOLIDAYS` — national holidays on fixed calendar dates that
 *     repeat every year.
 *
 *  3. `STATE_HOLIDAYS` — state-wise holidays keyed by state id. Only holidays
 *     of the user's selected working state (`AppState.state`) are active.
 *     Movable festivals that follow the lunar calendar belong in `HOLIDAYS`
 *     per year, not here.
 *
 * Holidays are merged with user-marked holidays at runtime. They always take
 * precedence over WFO selection and are never counted toward the office-day
 * target.
 */
export const HOLIDAYS: Record<string, string> = {
  "2025-08-15": "Independence Day",
  "2025-10-02": "Gandhi Jayanti",
  "2025-12-25": "Christmas",
  "2026-01-26": "Republic Day",
  "2026-03-25": "Holi",
  "2026-04-03": "Good Friday",
  "2026-08-15": "Independence Day",
  "2026-10-02": "Gandhi Jayanti",
  "2026-12-25": "Christmas",
  "2027-01-26": "Republic Day",
  "2027-08-15": "Independence Day",
};

export type HolidayScope = "national" | "state";

export interface RecurringHoliday {
  month: number; // 1-12
  day: number; // 1-31
  name: string;
  scope?: HolidayScope; // defaults to "national"
}

export const RECURRING_HOLIDAYS: RecurringHoliday[] = [
  { month: 1, day: 26, name: "Republic Day" },
  { month: 8, day: 15, name: "Independence Day" },
  { month: 10, day: 2, name: "Gandhi Jayanti" },
  { month: 12, day: 25, name: "Christmas" },
];

export type StateId = string;

export interface HolidayState {
  id: StateId;
  name: string;
}

/** Pickable "working state" regions — controls which state holidays apply. */
export const HOLIDAY_STATES: HolidayState[] = [
  { id: "andhra-pradesh", name: "Andhra Pradesh" },
  { id: "arunachal-pradesh", name: "Arunachal Pradesh" },
  { id: "assam", name: "Assam" },
  { id: "bihar", name: "Bihar" },
  { id: "chhattisgarh", name: "Chhattisgarh" },
  { id: "goa", name: "Goa" },
  { id: "gujarat", name: "Gujarat" },
  { id: "haryana", name: "Haryana" },
  { id: "himachal-pradesh", name: "Himachal Pradesh" },
  { id: "jharkhand", name: "Jharkhand" },
  { id: "karnataka", name: "Karnataka" },
  { id: "kerala", name: "Kerala" },
  { id: "madhya-pradesh", name: "Madhya Pradesh" },
  { id: "maharashtra", name: "Maharashtra" },
  { id: "manipur", name: "Manipur" },
  { id: "meghalaya", name: "Meghalaya" },
  { id: "mizoram", name: "Mizoram" },
  { id: "nagaland", name: "Nagaland" },
  { id: "odisha", name: "Odisha" },
  { id: "punjab", name: "Punjab" },
  { id: "rajasthan", name: "Rajasthan" },
  { id: "sikkim", name: "Sikkim" },
  { id: "tamil-nadu", name: "Tamil Nadu" },
  { id: "telangana", name: "Telangana" },
  { id: "tripura", name: "Tripura" },
  { id: "uttar-pradesh", name: "Uttar Pradesh" },
  { id: "uttarakhand", name: "Uttarakhand" },
  { id: "west-bengal", name: "West Bengal" },
  { id: "andaman-nicobar", name: "Andaman & Nicobar" },
  { id: "chandigarh", name: "Chandigarh" },
  { id: "dadra-nagar-haveli", name: "Dadra & Nagar Haveli and Daman & Diu" },
  { id: "delhi", name: "Delhi" },
  { id: "jammu-kashmir", name: "Jammu & Kashmir" },
  { id: "ladakh", name: "Ladakh" },
  { id: "lakshadweep", name: "Lakshadweep" },
  { id: "puducherry", name: "Puducherry" },
];

/**
 * State-wise holidays (curated fixed-date master). Add or extend per state —
 * e.g. Karnataka's Kannada Rajyotsava on Nov 1 is only a holiday for
 * employees working in Karnataka. Lunar/movable festivals belong in `HOLIDAYS`
 * per year instead.
 */
export const STATE_HOLIDAYS: Record<StateId, RecurringHoliday[]> = {
  "andhra-pradesh": [
    { month: 1, day: 14, name: "Makar Sankranti" },
    { month: 4, day: 14, name: "Dr. Ambedkar Jayanti" },
    { month: 5, day: 1, name: "May Day" },
    { month: 11, day: 1, name: "Andhra Pradesh Formation Day" },
  ],
  "arunachal-pradesh": [
    { month: 1, day: 15, name: "Si Donyi" },
    { month: 2, day: 20, name: "Arunachal Pradesh Day" },
  ],
  assam: [
    { month: 1, day: 15, name: "Magh Bihu" },
    { month: 4, day: 14, name: "Rongali Bihu" },
    { month: 5, day: 1, name: "May Day" },
    { month: 12, day: 10, name: "Asom Divas" },
  ],
  bihar: [
    { month: 3, day: 22, name: "Bihar Day" },
    { month: 4, day: 14, name: "Dr. Ambedkar Jayanti" },
  ],
  chhattisgarh: [{ month: 11, day: 1, name: "Chhattisgarh Foundation Day" }],
  goa: [{ month: 12, day: 19, name: "Goa Liberation Day" }],
  gujarat: [
    { month: 1, day: 14, name: "Uttarayan" },
    { month: 5, day: 1, name: "Gujarat Day" },
  ],
  haryana: [{ month: 4, day: 14, name: "Dr. Ambedkar Jayanti" }],
  "himachal-pradesh": [{ month: 4, day: 15, name: "Himachal Day" }],
  jharkhand: [{ month: 11, day: 15, name: "Jharkhand Foundation Day" }],
  karnataka: [
    { month: 1, day: 14, name: "Makara Sankranthi" },
    { month: 4, day: 14, name: "Dr. Ambedkar Jayanti" },
    { month: 5, day: 1, name: "May Day" },
    { month: 11, day: 1, name: "Kannada Rajyotsava" },
  ],
  kerala: [
    { month: 1, day: 1, name: "New Year" },
    { month: 5, day: 1, name: "May Day" },
    { month: 11, day: 1, name: "Kerala Piravi" },
  ],
  "madhya-pradesh": [{ month: 11, day: 1, name: "Madhya Pradesh Foundation Day" }],
  maharashtra: [
    { month: 2, day: 19, name: "Shivaji Jayanti" },
    { month: 4, day: 14, name: "Dr. Ambedkar Jayanti" },
    { month: 5, day: 1, name: "Maharashtra Day" },
  ],
  manipur: [
    { month: 1, day: 15, name: "Ningol Chakouba" },
    { month: 4, day: 14, name: "Rongali Bihu" },
  ],
  meghalaya: [{ month: 1, day: 21, name: "Meghalaya Day" }],
  mizoram: [{ month: 2, day: 20, name: "Mizoram Statehood Day" }],
  nagaland: [{ month: 12, day: 1, name: "Nagaland Statehood Day" }],
  odisha: [
    { month: 4, day: 1, name: "Utkala Dibasa" },
    { month: 5, day: 1, name: "May Day" },
  ],
  punjab: [
    { month: 1, day: 13, name: "Lohri" },
    { month: 1, day: 14, name: "Makar Sankranti" },
    { month: 3, day: 23, name: "Shaheedi Diwas" },
    { month: 4, day: 14, name: "Dr. Ambedkar Jayanti" },
  ],
  rajasthan: [{ month: 1, day: 14, name: "Makar Sankranti" }],
  sikkim: [],
  "tamil-nadu": [
    { month: 1, day: 14, name: "Pongal" },
    { month: 1, day: 15, name: "Pongal (second day)" },
    { month: 4, day: 14, name: "Tamil New Year" },
    { month: 5, day: 1, name: "May Day" },
  ],
  telangana: [
    { month: 4, day: 14, name: "Dr. Ambedkar Jayanti" },
    { month: 5, day: 1, name: "May Day" },
    { month: 6, day: 2, name: "Telangana Formation Day" },
  ],
  tripura: [],
  "uttar-pradesh": [{ month: 4, day: 14, name: "Dr. Ambedkar Jayanti" }],
  uttarakhand: [{ month: 4, day: 14, name: "Dr. Ambedkar Jayanti" }],
  "west-bengal": [
    { month: 1, day: 23, name: "Netaji Subhas Chandra Bose Jayanti" },
    { month: 5, day: 1, name: "May Day" },
  ],
  "andaman-nicobar": [],
  chandigarh: [],
  "dadra-nagar-haveli": [],
  delhi: [],
  "jammu-kashmir": [],
  ladakh: [],
  lakshadweep: [],
  puducherry: [{ month: 1, day: 14, name: "Pongal" }],
};

export function isKnownState(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(STATE_HOLIDAYS, id);
}

export function stateHolidaysFor(state: StateId): RecurringHoliday[] {
  return STATE_HOLIDAYS[state] ?? [];
}

/** User-marked holidays: date key -> label. Used as an override layer. */
export type ManualHolidays = Record<string, string>;

export function isManualHoliday(key: string, manual: ManualHolidays): boolean {
  return Object.prototype.hasOwnProperty.call(manual, key);
}

/** Resolved holiday with its origin scope (manual / national / state). */
export interface HolidayDetails {
  name: string;
  scope: HolidayScope;
}

/**
 * Resolve the details of a date from manual, national master, then the
 * selected working state's holidays.
 */
export function getHolidayDetails(
  key: string,
  manual: ManualHolidays = {},
  state?: StateId | null,
): HolidayDetails | null {
  if (isManualHoliday(key, manual)) return { name: manual[key], scope: "national" };
  if (Object.prototype.hasOwnProperty.call(HOLIDAYS, key)) {
    return { name: HOLIDAYS[key], scope: "national" };
  }
  const p = keyToYMD(key);
  if (!p) return null;
  const md = { month: p.month + 1, day: p.day };
  const rec = RECURRING_HOLIDAYS.find(
    (r) => r.month === md.month && r.day === md.day,
  );
  if (rec) return { name: rec.name, scope: rec.scope ?? "national" };
  if (state) {
    const st = stateHolidaysFor(state).find(
      (r) => r.month === md.month && r.day === md.day,
    );
    if (st) return { name: st.name, scope: "state" };
  }
  return null;
}

/** Resolve the holiday name for a key from manual, master, then state lists. */
export function getHolidayName(
  key: string,
  manual: ManualHolidays = {},
  state?: StateId | null,
): string | null {
  return getHolidayDetails(key, manual, state)?.name ?? null;
}

/**
 * All holidays for a month as `{ "YYYY-MM-DD": "Name" }`, including national
 * statutory entries, the selected state's holidays, and user-marked overrides.
 */
export function getMonthHolidays(
  year: number,
  month: number,
  manual: ManualHolidays = {},
  state?: StateId | null,
): Record<string, string> {
  const result: Record<string, string> = {};
  const total = daysInMonth(year, month);
  for (let day = 1; day <= total; day++) {
    const key = toKey(year, month, day);
    const details = getHolidayDetails(key, manual, state);
    if (details) result[key] = details.name;
  }
  return result;
}

/** Origin scope for each holiday in a month ("national" vs "state"). */
export function getMonthHolidayScopes(
  year: number,
  month: number,
  manual: ManualHolidays = {},
  state?: StateId | null,
): Record<string, HolidayScope> {
  const result: Record<string, HolidayScope> = {};
  const total = daysInMonth(year, month);
  for (let day = 1; day <= total; day++) {
    const key = toKey(year, month, day);
    const details = getHolidayDetails(key, manual, state);
    if (details) result[key] = details.scope;
  }
  return result;
}

/**
 * Combined holiday lookup for a range of months (used by the optimizer so the
 * window spans current and adjacent months).
 */
export function getHolidaysForMonths(
  months: { year: number; month: number }[],
  manual: ManualHolidays = {},
  state?: StateId | null,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const { year, month } of months) {
    Object.assign(result, getMonthHolidays(year, month, manual, state));
  }
  return result;
}

/** Join two manual-holiday sources (e.g. seed + saved), saved winning on clash. */
export function mergeManualHolidays(...sources: ManualHolidays[]): ManualHolidays {
  const result: ManualHolidays = {};
  for (const source of sources) {
    for (const [key, name] of Object.entries(source)) {
      if (name) result[key] = name;
      else delete result[key];
    }
  }
  return result;
}