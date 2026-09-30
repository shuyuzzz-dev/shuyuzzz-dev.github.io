// All financial/time inputs below are illustrative planning assumptions.
// The six-week program duration is supplied by Shuyu. No measured benefit is implied.
export const ONBOARDING_WEEKS = 6;
export const ONBOARDING_DEFAULTS = Object.freeze({
  managersPerYear: 24,
  managerHourlyCost: 60,
  reviewerHourlyCost: 90,
  managerHoursRecoveredPerWeek: 2,
  reviewerHoursRecoveredPerWeek: 1,
  jointRetrainingHoursAvoided: 4,
  readinessDaysRecovered: 5,
  readinessGapPercent: 25,
});
// Rollout scope supplied by Shuyu. Participation and per-manager benefits
// remain planning assumptions; each manager is counted once in the rollout.
export const REGIONAL_ROLLOUT_DEFAULTS = Object.freeze({
  launchSites: 50,
  managersPerSite: 40,
  rolloutYears: 2,
  participationPercent: 100,
});
export function estimateOnboarding(input = ONBOARDING_DEFAULTS) {
  const {
    managersPerYear: count, managerHourlyCost: managerRate, reviewerHourlyCost: reviewerRate,
    managerHoursRecoveredPerWeek: managerHours, reviewerHoursRecoveredPerWeek: reviewerHours,
    jointRetrainingHoursAvoided: repeatHours, readinessDaysRecovered: days, readinessGapPercent: gap,
  } = input;
  if (![count, managerRate, reviewerRate, managerHours, reviewerHours, repeatHours, days, gap].every(Number.isFinite)) {
    throw new RangeError('Complete every field with a number.');
  }
  if (!Number.isInteger(count) || count < 0 || count > 10000) throw new RangeError('Use a whole number from 0 to 10,000 managers per year.');
  if (managerRate < 0 || managerRate > 500 || reviewerRate < 0 || reviewerRate > 500) throw new RangeError('Hourly cost assumptions must be between $0 and $500.');
  if (managerHours < 0 || managerHours > 40 || reviewerHours < 0 || reviewerHours > 40) throw new RangeError('Weekly time recovered must be between 0 and 40 hours.');
  if (repeatHours < 0 || repeatHours > 240) throw new RangeError('Repeat-training hours avoided must be between 0 and 240.');
  if (days < 0 || days > 60 || gap < 0 || gap > 100) throw new RangeError('Use 0–60 readiness days and a 0–100% capacity gap.');
  if (managerHours * ONBOARDING_WEEKS + repeatHours > ONBOARDING_WEEKS * 40 || reviewerHours * ONBOARDING_WEEKS + repeatHours > ONBOARDING_WEEKS * 40) {
    throw new RangeError('Combined coordination and repeat-training time must fit within the six-week program.');
  }
  const managerCoordinationHours = managerHours * ONBOARDING_WEEKS;
  const reviewerCoordinationHours = reviewerHours * ONBOARDING_WEEKS;
  const repeatPersonHours = repeatHours * 2;
  const managerCoordinationValue = managerCoordinationHours * managerRate;
  const reviewerCoordinationValue = reviewerCoordinationHours * reviewerRate;
  const repeatValue = repeatHours * (managerRate + reviewerRate);
  const directHoursPerManager = managerCoordinationHours + reviewerCoordinationHours + repeatPersonHours;
  const directValuePerManager = managerCoordinationValue + reviewerCoordinationValue + repeatValue;
  // Readiness is modeled only after the scheduled six-week program; it is
  // capacity-equivalent value, kept out of direct time recovery to avoid overlap.
  const readinessEquivalentHoursPerManager = days * 8 * gap / 100;
  const readinessValuePerManager = readinessEquivalentHoursPerManager * managerRate;
  return {
    managerCoordinationHours, reviewerCoordinationHours, repeatPersonHours,
    managerCoordinationValue, reviewerCoordinationValue, repeatValue,
    directHoursPerManager, directValuePerManager,
    directAnnualHours: directHoursPerManager * count,
    directAnnualValue: directValuePerManager * count,
    readinessEquivalentHoursPerManager, readinessValuePerManager,
    readinessAnnualEquivalentHours: readinessEquivalentHoursPerManager * count,
    readinessAnnualValue: readinessValuePerManager * count,
  };
}

export function estimateRegionalOnboarding(onboardingInput = ONBOARDING_DEFAULTS, rollout = REGIONAL_ROLLOUT_DEFAULTS) {
  const benefit = estimateOnboarding(onboardingInput);
  const { launchSites, managersPerSite, rolloutYears, participationPercent } = rollout;
  if (![launchSites, managersPerSite, rolloutYears, participationPercent].every(Number.isFinite)) {
    throw new RangeError('Complete every regional rollout field with a number.');
  }
  if (!Number.isInteger(launchSites) || launchSites < 0 || launchSites > 10000 || !Number.isInteger(managersPerSite) || managersPerSite < 0 || managersPerSite > 10000) {
    throw new RangeError('Use whole numbers from 0 to 10,000 for launch sites and managers per site.');
  }
  if (!Number.isInteger(rolloutYears) || rolloutYears < 1 || rolloutYears > 10) throw new RangeError('Use a rollout period of 1–10 whole years.');
  if (participationPercent < 0 || participationPercent > 100) throw new RangeError('Participation must be between 0% and 100%.');
  const managersAtLaunchSites = launchSites * managersPerSite;
  const participantsPerSite = managersPerSite * participationPercent / 100;
  const participatingManagers = launchSites * participantsPerSite;
  const siteHours = participantsPerSite * benefit.directHoursPerManager;
  const siteValue = participantsPerSite * benefit.directValuePerManager;
  const rolloutHours = participatingManagers * benefit.directHoursPerManager;
  const rolloutValue = participatingManagers * benefit.directValuePerManager;
  return {
    managersAtLaunchSites, participatingManagers, participantsPerSite,
    siteHours, siteValue, rolloutHours, rolloutValue,
    averageAnnualManagers: participatingManagers / rolloutYears,
    averageAnnualHours: rolloutHours / rolloutYears,
    averageAnnualValue: rolloutValue / rolloutYears,
    halfBenefitHours: rolloutHours * 0.5,
    halfBenefitValue: rolloutValue * 0.5,
  };
}
