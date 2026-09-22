/**
 * Required office (WFO) presence per month: 60% of the effective working
 * days. Per the Capgemini India WFO mandate — "swipe 60% of your working
 * days" — effective days are the month's working weekdays minus holidays
 * minus planned leaves. "12 days" is just the 20-working-day-month case
 * (20 × 60%); a 21- or 22-working-day month requires 13 or 14, and taking
 * 2 leaves in a 20-working-day month drops the target to 11 (18 × 60%).
 * Rounded up, never above the month's effective working days.
 */
export const WFO_PERCENT = 0.6;

export function officeTargetForMonth(workingDays, leaves) {
  if (workingDays <= 0) return 0;
  const leavesClamped = Math.min(workingDays, Math.max(0, leaves));
  const effective = workingDays - leavesClamped;
  if (effective <= 0) return 0;
  return Math.min(effective, Math.ceil(WFO_PERCENT * effective));
}

/** Count WFO days on eligible (working) days vs non-eligible days. */
export function countWfoForMonth(wfoDates, workingKeys, target = null) {
  if (target === null) target = officeTargetForMonth(workingKeys.size, 0);
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
  return best > 0 ? { length: best, from: bestFrom, to: bestTo } : { length: 0 };
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
