import { getLocale } from './i18n.mjs';
import { estimateLiners, estimateBeams } from './warehouse-impact.mjs';

const put = (id, text) => { const element = document.getElementById(id); if (element) element.textContent = text; };
const values = form => {
  if (!form.checkValidity()) throw new RangeError('Complete each field using the values allowed.');
  return Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, Number(value)]));
};

export function updateSafetyEstimate(project) {
  const number = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 });
  const money = new Intl.NumberFormat(getLocale(), { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const prefix = project === 'liners' ? 'liner' : 'beam';
  const form = document.getElementById(`${prefix}-form`);
  if (!form) return;
  const error = document.getElementById(`${prefix}-error`);
  try {
    const input = values(form);
    if (project === 'liners') {
      const r = estimateLiners(input);
      for (const period of ['shift', 'daily', 'weekly', 'annual']) {
        put(`liner-${period}-hours`, `${number.format(r[`${period}Hours`])} h`);
        put(`liner-${period}-value`, money.format(r[`${period}Value`]));
      }
      put('liner-network-label', `Annual / ${number.format(input.sites)} sites`);
      put('liner-network-hours', `${number.format(r.networkAnnualHours)} h`);
      put('liner-network-value', money.format(r.networkAnnualValue));
      put('liner-volume', `${number.format(r.rainbowUnits)} Rainbow units ÷ ${number.format(input.unitsPerPick)} units per bin visit = ${number.format(r.picksPerShift)} bin visits per shift × ${number.format(r.secondsSaved)} seconds recovered.`);
      put('liner-formula', `${number.format(input.unitsPerShift)} units/shift × ${number.format(input.rainbowPercent)}% Rainbow share ÷ ${number.format(input.unitsPerPick)} units/visit × ${number.format(r.secondsSaved)} seconds ÷ 3,600 = ${number.format(r.shiftHours)} labor-hours per shift.`);
      put('liner-summary', `At ${input.shiftsPerDay} shift${input.shiftsPerDay === 1 ? '' : 's'}/day, ${input.daysPerWeek} days/week and ${input.weeksPerYear} weeks/year: ${money.format(r.annualValue)} of potential annual labor capacity per site, or ${money.format(r.networkAnnualValue)} across ${number.format(input.sites)} sites.`);
      put('liner-injury-site-cases', `${number.format(input.injuriesLow)}–${number.format(input.injuriesHigh)}`);
      put('liner-injury-site-value', `${money.format(r.injurySiteLow)}–${money.format(r.injurySiteHigh)}`);
      put('liner-injury-network-label', `${number.format(input.sites)} sites`);
      put('liner-injury-network-cases', `${number.format(r.networkCasesLow)}–${number.format(r.networkCasesHigh)}`);
      put('liner-injury-network-value', `${money.format(r.injuryNetworkLow)}–${money.format(r.injuryNetworkHigh)}`);
    } else {
      const r = estimateBeams(input);
      put('beam-site-cases', number.format(input.avoidedCases));
      put('beam-site-value', money.format(r.siteAvoidance));
      put('beam-network-label', `${number.format(input.sites)} sites`);
      put('beam-network-cases', number.format(input.avoidedCases * input.sites));
      put('beam-network-value', money.format(r.networkAvoidance));
      put('beam-summary', `Scenario: ${number.format(input.avoidedCases)} avoided cases per site per year, valued at ${money.format(r.siteAvoidance)} per site and ${money.format(r.networkAvoidance)} across ${number.format(input.sites)} sites. These are projected gross values.`);
      put('beam-net', `After the assumed annual storage opportunity cost: ${money.format(r.siteNetAnnual)} per site, or ${money.format(r.networkNetAnnual)} across ${number.format(input.sites)} equivalent sites, before other operating costs.`);
      put('beam-payback', r.simplePaybackYears === null ? 'No positive simple payback in this scenario: modeled injury-cost avoidance does not exceed the annual storage opportunity cost.' : `Illustrative simple payback: ${number.format(r.simplePaybackYears)} years. This is not a discounted return or a verified project result.`);
      put('beam-investment', `Scaling the site assumptions to ${number.format(input.sites)} buildings implies ${money.format(r.networkCapex)} of initial investment and ${money.format(r.networkCapacityCost)} of annual storage opportunity cost. Actual site estimates will vary.`);
    }
    error.hidden = true;
    error.textContent = '';
  } catch (problem) {
    error.hidden = false;
    error.textContent = problem.message;
    form.querySelectorAll('td[id]').forEach(element => { element.textContent = '—'; });
    put(`${prefix}-summary`, 'Update the inputs to calculate this scenario.');
    if (prefix === 'liner') {
      put('liner-formula', 'Update the inputs to calculate time recovered.');
      put('liner-volume', '');
    } else {
      for (const id of ['beam-net', 'beam-payback', 'beam-investment']) put(id, '');
    }
  }
}
