// Inputs reported by Shuyu; schedule and hourly compensation are scenarios.
export const STOW_GUIDANCE_INPUTS = Object.freeze({
  stowersPerShift: 20,
  cagesPerStowerHour: 3,
  minutesRecoveredPerCage: 1,
  weeksPerYear: 52,
});
export const DEFAULT_SCENARIO = Object.freeze({ activeHoursPerShift: 10, shiftsPerDay: 2, daysPerWeek: 7, hourlyValue: 30 });
export function estimateStowGuidance(scenario = DEFAULT_SCENARIO) {
  const { activeHoursPerShift: hours, shiftsPerDay: shifts, daysPerWeek: days, hourlyValue: rate } = scenario;
  if (![hours, shifts, days, rate].every(Number.isFinite)) throw new RangeError('Enter a number in each field.');
  if (hours < 0 || hours > 24 || !Number.isInteger(shifts) || shifts < 1 || shifts > 3 || hours * shifts > 24) {
    throw new RangeError('Active hours across all shifts must total no more than 24 per day.');
  }
  if (!Number.isInteger(days) || days < 1 || days > 7) throw new RangeError('Choose between 1 and 7 operating days per week.');
  if (rate < 0 || rate > 200) throw new RangeError('Enter an hourly value between $0 and $200.');
  const { stowersPerShift, cagesPerStowerHour, minutesRecoveredPerCage, weeksPerYear } = STOW_GUIDANCE_INPUTS;
  const perOperatingHour = stowersPerShift * cagesPerStowerHour * minutesRecoveredPerCage / 60;
  const dailyHours = perOperatingHour * hours * shifts;
  const weeklyHours = dailyHours * days;
  const annualHours = weeklyHours * weeksPerYear;
  return { perOperatingHour, dailyHours, weeklyHours, annualHours, dailyValue: dailyHours * rate, weeklyValue: weeklyHours * rate, annualValue: annualHours * rate };
}
