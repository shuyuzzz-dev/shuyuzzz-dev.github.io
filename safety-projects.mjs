export const BIN_LINERS = {
  title: 'Bin Liners', place: 'Rainbow storage racks', color: 'var(--mint)',
  summary: 'Less digging. A faster, safer pick.',
  lead: 'I changed the bin layout so stowers place items upright, making the next pick easier to find and retrieve.',
  tags: ['Physical process improvement', 'Reported post-project results', 'Approved for eight sites'],
  content: `<button class="outline-button" type="button" data-replay-liners>Replay the before-and-after sequence</button>
  <div class="impact-facts" aria-label="Reported Bin Liners results">
    <div><strong>120 → 30 sec</strong><span>Average time at bin, reported before and after</span></div>
    <div><strong>More than 50%</strong><span>Lower recordable incident rate (RIR) in Rainbow-bin picking, as reported after the project</span></div>
    <div><strong>8 sites</strong><span>Approved for rollout; a regional safety committee owns execution</span></div>
  </div>
  <section class="story-section"><h3>The problem at the bin</h3><p>Rainbow storage uses wide shelf openings in tall racking, accessed by elevating order pickers with full-size cages. These shelf compartments hold medium-size products, including large items weighing 25–50 pounds. Items were being stowed horizontally and stacked on one another. To find the next item, a picker often had to dig through the bin and push, pull, or reposition other products.</p><p>That extra handling increased time at bin (TAB) and exposure to strain. Average TAB was approximately two minutes per pick.</p></section>
  <section class="story-section"><h3>What I changed</h3><p>I led the Bin Liners project to fit <strong>white plastic liners inside the wide rack openings</strong>. The liners narrow the usable compartments and enforce library-style stowing: items stand upright alongside one another, like books on a shelf. The physical layout reinforces the stow standard and makes the next item easier to identify and access.</p></section>
  <section class="story-section"><h3>The reported result</h3><p>Average TAB improved from <strong>120 seconds to 30 seconds</strong>. I also reported a recordable incident rate (RIR) in Rainbow-bin picking more than 50% lower after the project.</p><p>The pilot was then approved for rollout at eight comparable first-generation sites. A regional safety committee owns that rollout; my part was the pilot, the design and the case for it.</p><p class="impact-method">These outcomes are from my project account. The supporting Bin Liners white paper and measurement periods are still to be added. A 75% reduction in time at bin does not imply a 75% improvement in the full pick cycle, which also includes travel and other work.</p></section>
  <section class="impact-calculator liner-calculator" aria-labelledby="liner-impact-title"><h3 id="liner-impact-title">What does 90 seconds per pick recover?</h3><details class="model-run"><summary>Run the model</summary><p class="calculator-intro">A projection for one site and for eight. The inputs are illustrative, not site data; change them to test the idea.</p>
    <p class="impact-formula" id="liner-formula">10,000 units/shift × 20% Rainbow share × 90 seconds ÷ 3,600 = <strong>50 labor-hours per shift</strong>, assuming one unit per bin visit.</p>
    <form id="liner-form"><div class="impact-form">
      <label>Site units processed per shift<input name="unitsPerShift" type="number" min="0" max="1000000" step="1" value="10000" required inputmode="numeric"></label>
      <label>Rainbow share of volume (%)<input name="rainbowPercent" type="number" min="0" max="100" step="1" value="20" required inputmode="numeric"></label>
      <label>Rainbow units per bin visit<input name="unitsPerPick" type="number" min="1" max="1000" step="0.1" value="1" required inputmode="decimal"></label>
      <label>Hourly labor value (USD)<input name="hourlyValue" type="number" min="0" max="500" step="0.01" value="30" required inputmode="decimal"></label>
      <label>Shifts per day<input name="shiftsPerDay" type="number" min="1" max="3" step="1" value="1" required inputmode="numeric"></label>
      <label>Operating days per week<input name="daysPerWeek" type="number" min="1" max="7" step="1" value="7" required inputmode="numeric"></label>
      <label>Operating weeks per year<input name="weeksPerYear" type="number" min="1" max="52" step="1" value="52" required inputmode="numeric"></label>
      <label>Comparable first-generation sites<input name="sites" type="number" min="1" max="10000" step="1" value="8" required inputmode="numeric"></label>
    </div>
    <details class="model-details"><summary>Adjust the time-at-bin comparison</summary><div class="impact-form">
      <label>Before: seconds per bin visit<input name="beforeSeconds" type="number" min="0" max="3600" step="1" value="120" required inputmode="numeric"></label>
      <label>After: seconds per bin visit<input name="afterSeconds" type="number" min="0" max="3600" step="1" value="30" required inputmode="numeric"></label>
    </div></details>
    <p class="impact-error" id="liner-error" role="status" hidden></p><p class="impact-method" id="liner-volume">2,000 Rainbow bin visits per shift × 90 seconds recovered.</p>
    <table class="impact-table"><caption>Illustrative model: picking labor capacity</caption><thead><tr><th scope="col">Period / scope</th><th scope="col">Labor-hours</th><th scope="col">Equivalent value</th></tr></thead><tbody>
      <tr><th scope="row">Per shift / site</th><td id="liner-shift-hours">50 h</td><td id="liner-shift-value">$1,500</td></tr>
      <tr><th scope="row">Daily / site</th><td id="liner-daily-hours">50 h</td><td id="liner-daily-value">$1,500</td></tr>
      <tr><th scope="row">Weekly / site</th><td id="liner-weekly-hours">350 h</td><td id="liner-weekly-value">$10,500</td></tr>
      <tr><th scope="row">Annual / site</th><td id="liner-annual-hours">18,200 h</td><td id="liner-annual-value">$546,000</td></tr>
      <tr class="annual-row"><th scope="row" id="liner-network-label">Annual / 8 sites</th><td id="liner-network-hours">145,600 h</td><td id="liner-network-value">$4,368,000</td></tr>
    </tbody></table><p class="impact-summary" id="liner-summary" aria-live="polite" aria-atomic="true"></p>
    <h4 class="model-subheading">Injury-cost avoidance, shown separately</h4>
    <div class="impact-form">
      <label>Cases avoided / site / year: low<input name="injuriesLow" type="number" min="0" max="1000" step="1" value="3" required inputmode="numeric"></label>
      <label>Cases avoided / site / year: high<input name="injuriesHigh" type="number" min="0" max="1000" step="1" value="5" required inputmode="numeric"></label>
      <label>Estimated total cost per strain injury (USD)<input name="injuryCost" type="number" min="0" max="10000000" step="0.01" value="67248" required inputmode="decimal"></label>
    </div>
    <table class="impact-table safety-cost-table"><caption>Illustrative model: injury-cost avoidance per year</caption><thead><tr><th scope="col">Annual scope</th><th scope="col">Avoided cases</th><th scope="col">Estimated cost avoidance</th></tr></thead><tbody>
      <tr><th scope="row">One site</th><td id="liner-injury-site-cases">3–5</td><td id="liner-injury-site-value">$201,744–$336,240</td></tr>
      <tr><th scope="row" id="liner-injury-network-label">8 sites</th><td id="liner-injury-network-cases">24–40</td><td id="liner-injury-network-value">$1,613,952–$2,689,920</td></tr>
    </tbody></table></form>
    <p class="impact-method model-note">The defaults are illustrative, not site data: one shift a day, seven days a week, 52 weeks a year and $30/hour. Volume means outbound Rainbow picks; batch picks should use their actual units per bin visit. More sites assumes the same volume, bin mix and time improvement at each, for a full year after rollout. The avoided injury cases are a planning scenario, not derived from the reported RIR reduction, and the $67,248 per strain case is the OSHA Safety Pays estimate ($32,023 direct plus $35,225 indirect) reproduced in the A-Level Beams proposal, not an Amazon claims rate. Labor and injury values stay separate because they can overlap, and cases shared with A-Level Beams must be removed before the projects are combined. Installation and maintenance costs are not deducted, and recovered time does not automatically reduce payroll.</p></details>
  </section>`,
};

export const BEAM_SCENES = [
  { title: 'A floor-level pick', position: '0% 0%', next: 'Observe the pick',
    text: 'Shuyu reaches the picker. The bottom pallet rests directly on the floor, below the order-picker platform.',
    alt: 'Pixel illustration of Shuyu beside a picker on an order picker, next to a pallet resting directly on the floor.' },
  { title: 'The extra bend', position: '100% 0%', next: 'See the strain risk',
    text: 'The picker steps off the order picker and bends deeply to reach an item. Product position makes awkward access part of the task.',
    alt: 'The picker has stepped off the order picker and bends deeply to reach a floor-level carton while Shuyu observes.' },
  { title: 'A task that needs to change', position: '0% 100%', next: 'Add the A-level beams',
    text: 'The picker pauses with back discomfort. Shuyu sees an opportunity to change the physical setup and reduce exposure.',
    alt: 'The picker pauses and holds their lower back; Shuyu notices. This is an illustrative scene, not a specific recorded incident.' },
  { title: 'Raise the product. Reduce the bend.', position: '100% 100%', next: 'Explore the project',
    text: 'A-level beams and decking raise the pallet by approximately 11.5 inches. The changed setup reduces low-level access; reach distance and work practices still matter.',
    alt: 'The same pallet is raised a modest distance above the floor on A-level beams; the picker accesses it with less bending.' },
];

export const A_LEVEL_BEAMS = {
  title: 'A-Level Beams', place: 'Floor-level pallet picking', color: 'var(--safety)',
  summary: 'Raise the pallet. Reduce the bend.',
  lead: 'I co-authored a proposal to lift floor-level pallets onto standard beams, and I priced the storage it would cost into the case.',
  tags: ['Safety proposal', 'Co-authored business case', 'Conditional approval'],
  content: `<button class="outline-button" type="button" data-replay-beams>Replay the floor observation</button>
    <div class="impact-facts" aria-label="A-Level Beams proposal at a glance"><div><strong>11.5 inches</strong><span>Planned lift for the bottom pallet</span></div><div><strong>≈$190K a year</strong><span>Storage cost I priced into the case</span></div><div><strong>Conditional approval</strong><span>Co-authored proposal, not yet installed</span></div></div>
    <section class="story-section"><h3>The safety gap</h3><p>The A-level is the bottom storage level of a pallet rack, and many A-level pallets rested directly on the floor. Reaching low or deep inventory could mean stepping off the order picker, then stooping, kneeling or reaching forward with a product in hand. The physical setup made awkward access part of the task.</p><p>With a colleague, I wrote the A-Level Pallet Bin Beam Standardization proposal. It brought together Operations, Workplace Health and Safety, Learning, ICQA, maintenance and installation partners.</p></section>
    <section class="story-section"><h3>The engineering change</h3><p>The design adds standard beams, backstops and wire decking under the floor-level positions, lifting each pallet about 11.5 inches. The pick workflow stays the same; the bend gets smaller.</p><p>The work connected the ergonomic need with installation planning, vendor quotes and a design other first-generation buildings could reuse.</p></section>
    <section class="story-section"><h3>The cost I put in the case</h3><p>Lifting the bottom pallet takes height out of every rack it touches, so the building stores less. I valued that lost space as an annual cost, about $190,000 a year for one site, and set it against the safety benefit instead of showing the gross figure alone.</p><p>That made the case weaker on paper and easier to trust. It reached conditional approval as a safety investment, not on payback alone. The beams are not installed yet, so there are no post-installation results.</p></section>
    <section class="story-section"><h3>What the evidence supports</h3><p>The proposal draws on the site’s injury history and on an ergonomic model. The model also credited reach tools and wire guidance, so it does not show what beams alone would change. Site injury data stays internal, so the calculator below starts from inputs you choose.</p></section>
    <section class="impact-calculator beam-calculator" aria-labelledby="beam-impact-title"><h3 id="beam-impact-title">Scale the safety case carefully</h3><details class="model-run"><summary>Run the model</summary><p class="calculator-intro">Choose how many strain cases a site might avoid each year. The inputs are illustrative, not site data, and lower exposure is not converted automatically into fewer injuries.</p>
      <form id="beam-form"><div class="impact-form">
        <label>Cases avoided per site per year<input name="avoidedCases" type="number" min="0" max="1000" step="0.5" value="2" required inputmode="decimal"></label>
        <label>Estimated total cost per strain injury (USD)<input name="injuryCost" type="number" min="0" max="10000000" step="0.01" value="67248" required inputmode="decimal"></label>
        <label>Comparable first-generation sites<input name="sites" type="number" min="1" max="10000" step="1" value="8" required inputmode="numeric"></label>
      </div><p class="impact-error" id="beam-error" role="status" hidden></p>
      <table class="impact-table safety-cost-table"><caption>Illustrative model: injury-cost avoidance per year</caption><thead><tr><th scope="col">Scope</th><th scope="col">Cases avoided</th><th scope="col">Estimated annual value</th></tr></thead><tbody>
        <tr><th scope="row">One site</th><td id="beam-site-cases">2</td><td id="beam-site-value">$134,496</td></tr>
        <tr class="annual-row"><th scope="row" id="beam-network-label">8 sites</th><td id="beam-network-cases">16</td><td id="beam-network-value">$1,075,968</td></tr>
      </tbody></table><p class="impact-summary" id="beam-summary" aria-live="polite" aria-atomic="true"></p>
      <details class="model-details"><summary>Include the investment and storage tradeoff</summary><p class="impact-method">The proposal estimates about $0.73 million of investment and about $190,000 a year of lost storage for one site. These planning figures need updated quotes and a capacity check.</p><div class="impact-form">
        <label>Site investment (USD)<input name="siteCapex" type="number" min="0" max="100000000" step="0.01" value="730000" required inputmode="decimal"></label>
        <label>Annual storage opportunity cost / site (USD)<input name="annualCapacityCost" type="number" min="0" max="100000000" step="0.01" value="190000" required inputmode="decimal"></label>
      </div><p class="impact-method" id="beam-net"></p><p class="impact-method" id="beam-payback"></p><p class="impact-method" id="beam-investment"></p>
      </details></form>
      <p class="impact-method model-note">Two avoided cases is an illustrative scenario, not a measured outcome, and the source is a project proposal, not a post-installation benefits report. The $67,248 per strain case is the OSHA Safety Pays estimate ($32,023 direct plus $35,225 indirect) reproduced in the proposal, not the actual cost of every injury. More sites assumes comparable risk and implementation at each; every building needs its own case history, bin count, costs and rollout schedule. The safety rationale stands apart from the financial view: no discounted cash flow, validated NPV or quantified productivity benefit is claimed. Do not combine these cases with Bin Liners injury avoidance until overlapping incidents have been removed.</p></details>
    </section>`,
};
