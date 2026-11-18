/**
 * Required office (WFO) presence per month: 60% of the effective working
 * days, per the Capgemini India WFO mandate — "swipe 60% of your working
 * days". Effective days are the month's working weekdays minus holidays
 * minus marked leave days (both already excluded from `workingDays` by the
 * caller). Rounded down (e.g. 11.4 effective days needs only 11), never
 * above the month's effective working days, and never above the mandate's
 * monthly cap of 12 days regardless of how many effective working days the
 * month has.
 */
export const WFO_PERCENT = 0.6;
export const MAX_OFFICE_DAYS_PER_MONTH = 12;

export function officeTargetForMonth(workingDays) {
  if (workingDays <= 0) return 0;
  return Math.min(
    workingDays,
    Math.floor(WFO_PERCENT * workingDays),
    MAX_OFFICE_DAYS_PER_MONTH,
  );
}

/** Count WFO days on eligible (working) days vs non-eligible days. */
export function countWfoForMonth(wfoDates, workingKeys, target = null) {
  if (target === null) target = officeTargetForMonth(workingKeys.size);
  let used = 0;
  let invalid = 0;
  for (const key of wfoDates) {
    if (workingKeys.has(key)) used++;
    else invalid++;
  }
  return { used, invalid, target };
}

/**
 * Longest run of consecutive home days. Returns its length and, when it
 * exists, the inclusive start/end date keys.
 */
export function longestWfhRun(days) {
  let best = 0;
  let bestFrom = "";
  let bestTo = "";
  let run = 0;
  let start = "";
  for (const d of days) {
    if (d.isHome) {
      if (run === 0) start = d.key;
      run++;
      if (run > best) {
        best = run;
        bestFrom = start;
        bestTo = d.key;
      }
    } else {
      run = 0;
    }
  }
  return best > 0
    ? { length: best, from: bestFrom, to: bestTo }
    : { length: 0 };
}

/** All maximal continuous WFH blocks, longest first. */
export function findWfhPeriods(days) {
  const periods = [];
  let run = 0;
  let start = "";
  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    if (d.isHome) {
      if (run === 0) start = d.key;
      run++;
      const last = i === days.length - 1;
      const next = last ? false : !days[i + 1].isHome;
      if (last || next) {
        periods.push({ from: start, to: d.key, length: run });
        run = 0;
      }
    }
  }
  return periods.sort((a, b) => b.length - a.length);
}

/** Convert an ordered list of day keys into ranked days given the WFO set. */
export function rankKeys(keys, wfoSet) {
  return keys.map((key) => ({ key, isHome: !wfoSet.has(key) }));
}
