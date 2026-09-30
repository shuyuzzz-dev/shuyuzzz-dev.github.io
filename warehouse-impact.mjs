// Reported Bin Liners outcomes and explicit projection assumptions.
// The injury cost is the historical total-cost estimate in the supplied paper,
// not a current Amazon claim cost. Keep safety and labor values separate.
export const INJURY_COST_REFERENCE = 67248;
export const LINER_DEFAULTS = Object.freeze({
  unitsPerShift: 10000, rainbowPercent: 20, unitsPerPick: 1,
  beforeSeconds: 120, afterSeconds: 30, shiftsPerDay: 1,
  daysPerWeek: 7, weeksPerYear: 52, hourlyValue: 30, sites: 8,
  injuriesLow: 3, injuriesHigh: 5, injuryCost: INJURY_COST_REFERENCE,
});
export const BEAM_DEFAULTS = Object.freeze({
  avoidedCases: 2, injuryCost: INJURY_COST_REFERENCE, sites: 8,
  siteCapex: 727283.09, annualCapacityCost: 188623.80,
});
function range(value, low, high, label, integer = false) {
  if (!Number.isFinite(value) || value < low || value > high || (integer && !Number.isInteger(value))) {
    throw new RangeError(`${label}: enter ${integer ? 'a whole number' : 'a number'} from ${low} to ${high}.`);
  }
}
export function estimateLiners(input = LINER_DEFAULTS) {
  const {unitsPerShift, rainbowPercent, unitsPerPick, beforeSeconds, afterSeconds,
    shiftsPerDay, daysPerWeek, weeksPerYear, hourlyValue, sites, injuriesLow, injuriesHigh, injuryCost} = input;
  range(unitsPerShift,0,1000000,'Units per shift',true);
  range(rainbowPercent,0,100,'Rainbow share');
  range(unitsPerPick,1,1000,'Units per bin visit');
  range(beforeSeconds,0,3600,'Before time at bin'); range(afterSeconds,0,3600,'After time at bin');
  if (afterSeconds > beforeSeconds) throw new RangeError('After time must be no greater than before time for this savings scenario.');
  range(shiftsPerDay,1,3,'Shifts per day',true); range(daysPerWeek,1,7,'Days per week',true);
  range(weeksPerYear,1,52,'Weeks per year',true); range(hourlyValue,0,500,'Hourly labor value');
  range(sites,1,10000,'Sites',true); range(injuriesLow,0,1000,'Lower avoided-case estimate');
  range(injuriesHigh,0,1000,'Upper avoided-case estimate'); range(injuryCost,0,10000000,'Cost per injury');
  if (injuriesLow > injuriesHigh) throw new RangeError('The lower avoided-case estimate cannot exceed the upper estimate.');
  const secondsSaved = beforeSeconds - afterSeconds;
  const rainbowUnits = unitsPerShift * rainbowPercent / 100;
  const picksPerShift = rainbowUnits / unitsPerPick;
  const shiftHours = picksPerShift * secondsSaved / 3600;
  const dailyHours = shiftHours * shiftsPerDay;
  const weeklyHours = dailyHours * daysPerWeek;
  const annualHours = weeklyHours * weeksPerYear;
  return {
    secondsSaved, rainbowUnits, picksPerShift, shiftHours, dailyHours, weeklyHours, annualHours,
    shiftValue: shiftHours * hourlyValue, dailyValue: dailyHours * hourlyValue,
    weeklyValue: weeklyHours * hourlyValue, annualValue: annualHours * hourlyValue,
    networkAnnualHours: annualHours * sites, networkAnnualValue: annualHours * hourlyValue * sites,
    injurySiteLow: injuriesLow * injuryCost, injurySiteHigh: injuriesHigh * injuryCost,
    injuryNetworkLow: injuriesLow * injuryCost * sites, injuryNetworkHigh: injuriesHigh * injuryCost * sites,
    networkCasesLow: injuriesLow * sites, networkCasesHigh: injuriesHigh * sites,
  };
}
export function estimateBeams(input = BEAM_DEFAULTS) {
  const {avoidedCases, injuryCost, sites, siteCapex, annualCapacityCost} = input;
  range(avoidedCases,0,4,'Avoided cases per site per year');
  range(injuryCost,0,10000000,'Cost per injury'); range(sites,1,10000,'Sites',true);
  range(siteCapex,0,100000000,'Site investment'); range(annualCapacityCost,0,100000000,'Annual storage opportunity cost');
  const siteAvoidance = avoidedCases * injuryCost;
  const siteNetAnnual = siteAvoidance - annualCapacityCost;
  return {
    siteAvoidance, networkAvoidance: siteAvoidance * sites,
    siteNetAnnual, networkNetAnnual: siteNetAnnual * sites,
    networkCapex: siteCapex * sites, networkCapacityCost: annualCapacityCost * sites,
    simplePaybackYears: siteNetAnnual > 0 ? siteCapex / siteNetAnnual : null,
  };
}
