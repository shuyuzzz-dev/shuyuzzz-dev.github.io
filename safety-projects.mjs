export const BIN_LINERS = {
  number: '01', title: 'Bin Liners', place: 'RAINBOW STORAGE RACKS', color: 'var(--mint)',
  summary: 'Less digging. A faster, safer pick.',
  lead: 'I changed the bin layout so stowers place items upright, making the next pick easier to find and retrieve.',
  tags: ['Physical process improvement', 'Reported post-project results', 'Eight-site projection'],
  content: `<button class="outline-button" type="button" data-replay-liners>Replay the before-and-after sequence ↗</button>
  <div class="impact-facts" aria-label="Reported Bin Liners results">
    <div><strong>120 → 30 sec</strong><span>Average time at bin, reported before and after</span></div>
    <div><strong>75% less TAB</strong><span>90 seconds recovered per pick</span></div>
    <div><strong>60% lower RIR</strong><span>Reported in Rainbow-bin picking after the project</span></div>
  </div>
  <section class="story-section"><h3>The problem at the bin</h3><p>Rainbow storage uses wide shelf openings in tall racking, accessed by elevating order pickers with full-size cages. These shelf compartments hold medium-size products, including large items weighing 25–50 pounds. Items were being stowed horizontally and stacked on one another. To find the next item, a picker often had to dig through the bin and push, pull, or reposition other products.</p><p>That extra handling increased time at bin (TAB) and exposure to strain. Average TAB was approximately two minutes per pick.</p></section>
  <section class="story-section"><h3>What I changed</h3><p>I led the Bin Liners project to fit <strong>white plastic liners inside the wide rack openings</strong>. The liners narrow the usable compartments and enforce library-style stowing: items stand upright alongside one another, like books on a shelf. The physical layout reinforces the stow standard and makes the next item easier to identify and access.</p></section>
  <section class="story-section"><h3>The reported result</h3><p>Average TAB improved from <strong>120 seconds to 30 seconds</strong>. I also reported a <strong>60% reduction in recordable incident rate (RIR)</strong> in Rainbow-bin picking after the project.</p><p class="impact-method">These outcomes are from my project account. The supporting Bin Liners white paper and measurement periods are still to be added. A 75% reduction in time at bin does not imply a 75% improvement in the full pick cycle, which also includes travel and other work.</p></section>
  <section class="impact-calculator liner-calculator" aria-labelledby="liner-impact-title"><p class="eyebrow">SITE AND NETWORK PROJECTION</p><h3 id="liner-impact-title">What does 90 seconds per pick recover?</h3>
    <p class="impact-formula" id="liner-formula">10,000 units/shift × 20% Rainbow share × 90 seconds ÷ 3,600 = <strong>50 labor-hours per shift</strong>, assuming one unit per bin visit.</p>
    <form id="liner-form"><div class="impact-form">
      <label>Site units processed per shift<input name="unitsPerShift" type="number" min="0" max="1000000" step="1" value="10000" required></label>
      <label>Rainbow share of volume (%)<input name="rainbowPercent" type="number" min="0" max="100" step="1" value="20" required></label>
      <label>Rainbow units per bin visit<input name="unitsPerPick" type="number" min="1" max="1000" step="0.1" value="1" required></label>
      <label>Hourly labor value (USD)<input name="hourlyValue" type="number" min="0" max="500" step="0.01" value="30" required></label>
      <label>Shifts per day<input name="shiftsPerDay" type="number" min="1" max="3" step="1" value="1" required></label>
      <label>Operating days per week<input name="daysPerWeek" type="number" min="1" max="7" step="1" value="7" required></label>
      <label>Operating weeks per year<input name="weeksPerYear" type="number" min="1" max="52" step="1" value="52" required></label>
      <label>Comparable first-generation sites<input name="sites" type="number" min="1" max="10000" step="1" value="8" required></label>
    </div>
    <details class="model-details"><summary>Adjust the time-at-bin comparison</summary><div class="impact-form">
      <label>Before: seconds per bin visit<input name="beforeSeconds" type="number" min="0" max="3600" step="1" value="120" required></label>
      <label>After: seconds per bin visit<input name="afterSeconds" type="number" min="0" max="3600" step="1" value="30" required></label>
    </div></details>
    <p class="impact-error" id="liner-error" role="status" hidden></p><p class="impact-method" id="liner-volume">2,000 Rainbow bin visits per shift × 90 seconds recovered.</p>
    <table class="impact-table"><caption class="visually-hidden">Projected picking labor capacity</caption><thead><tr><th scope="col">Period / scope</th><th scope="col">Labor-hours</th><th scope="col">Equivalent value</th></tr></thead><tbody>
      <tr><th scope="row">Per shift / site</th><td id="liner-shift-hours">50 h</td><td id="liner-shift-value">$1,500</td></tr>
      <tr><th scope="row">Daily / site</th><td id="liner-daily-hours">50 h</td><td id="liner-daily-value">$1,500</td></tr>
      <tr><th scope="row">Weekly / site</th><td id="liner-weekly-hours">350 h</td><td id="liner-weekly-value">$10,500</td></tr>
      <tr><th scope="row">Annual / site</th><td id="liner-annual-hours">18,200 h</td><td id="liner-annual-value">$546,000</td></tr>
      <tr class="annual-row"><th scope="row" id="liner-network-label">Annual / 8 sites</th><td id="liner-network-hours">145,600 h</td><td id="liner-network-value">$4,368,000</td></tr>
    </tbody></table><p class="impact-summary" id="liner-summary" aria-live="polite" aria-atomic="true"></p>
    <p class="impact-method">The default is one shift per day, seven days per week, 52 weeks per year, and an illustrative $30/hour. Volume must represent outbound Rainbow picks; batch picks should use their actual units per bin visit. Network scaling assumes equivalent volume, bin mix, and time improvement at each site, with a full year of operation after rollout.</p>
    <h4 class="model-subheading">Injury-cost avoidance, shown separately</h4><p class="impact-method">The 3–5 avoided cases below are a planning scenario supplied for this business case. They are not derived from the reported 60% RIR reduction.</p>
    <div class="impact-form">
      <label>Cases avoided / site / year: low<input name="injuriesLow" type="number" min="0" max="1000" step="1" value="3" required></label>
      <label>Cases avoided / site / year: high<input name="injuriesHigh" type="number" min="0" max="1000" step="1" value="5" required></label>
      <label>Estimated total cost per strain injury (USD)<input name="injuryCost" type="number" min="0" max="10000000" step="0.01" value="67248" required></label>
    </div>
    <table class="impact-table safety-cost-table"><caption class="visually-hidden">Separate projected injury-cost avoidance per year</caption><thead><tr><th scope="col">Annual scope</th><th scope="col">Avoided cases</th><th scope="col">Estimated cost avoidance</th></tr></thead><tbody>
      <tr><th scope="row">One site</th><td id="liner-injury-site-cases">3–5</td><td id="liner-injury-site-value">$201,744–$336,240</td></tr>
      <tr><th scope="row" id="liner-injury-network-label">8 sites</th><td id="liner-injury-network-cases">24–40</td><td id="liner-injury-network-value">$1,613,952–$2,689,920</td></tr>
    </tbody></table></form>
    <p class="impact-method">The $67,248 reference comes from the OSHA Safety Pays estimate reproduced in my A-Level Beams paper: $32,023 direct cost plus $35,225 indirect cost per strain case. It is a historical planning proxy, not an Amazon claims rate. Update it with site-specific evidence.</p>
    <p class="impact-method">Labor capacity and injury-cost avoidance are kept separate because indirect injury costs may overlap with labor losses. Avoided incidents must also be separated from A-Level Beams cases before combining projects. Installation and maintenance costs are not deducted, and recovered time does not automatically reduce payroll.</p>
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
  number: '04', title: 'A-Level Beams', place: 'FLOOR-LEVEL PALLET PICKING', color: 'var(--safety)',
  summary: 'Raise the pallet. Reduce the bend.',
  lead: 'I identified an ergonomic gap in floor-level pallet picking and led the initiative to standardize A-level elevation.',
  tags: ['Safety initiative', 'Site project ownership', 'Eight-site rollout opportunity'],
  content: `<button class="outline-button" type="button" data-replay-beams>Replay the floor observation ↗</button>
    <div class="impact-facts" aria-label="A-Level Beams project scope"><div><strong>11.5 inches</strong><span>Planned elevation above floor level</span></div><div><strong>6,062 bins</strong><span>Pilot-site scope in the white paper</span></div><div><strong>8 sites</strong><span>Comparable-site projection</span></div></div>
    <section class="story-section"><h3>The safety gap I identified</h3><p>At my site, many A-level pallets rested directly on the floor. Accessing low or deep inventory could require an associate to dismount the order picker, stoop, kneel, or reach forward while handling a product. The recurring physical setup was part of the problem.</p><p>I connected that task design with the building’s injury history and led the A-Level Pallet Bin Beam Standardization initiative. The proposal brought together Operations, Workplace Health and Safety, Learning/ICQA, maintenance, and installation partners.</p></section>
    <section class="story-section"><h3>The engineering change</h3><p>The site design adds standardized beams, backstops, and wire decking beneath 6,062 floor-level bins, raising pallets by approximately 11.5 inches. The aim is to reduce repeated low-level access while preserving the pick workflow.</p><p>My work connected the ergonomic need with installation planning, vendor costs, storage-capacity tradeoffs, and a design that could inform other first-generation buildings.</p></section>
    <section class="story-section"><h3>What the evidence supports</h3><p>The paper records <strong>9 of 23 wide-aisle recordable injuries</strong> as associated with A-level locations in <strong>2022–2023</strong>. Following a separate double-stacked-pallet pilot, that share was <strong>1 of 12 in 2024</strong>.</p><p>Those are shares of recorded cases across different periods. They are not an exposure-adjusted injury-rate comparison, and the pilot used stacked pallets rather than the proposed beams.</p><p>The paper also cites a <strong>49–54% modeled reduction in ergonomic exposure</strong>. Its simulation discussion includes reach tools and wire guidance alongside elevation. It does not establish that beams alone reduce actual injuries by that percentage.</p></section>
    <section class="impact-calculator beam-calculator" aria-labelledby="beam-impact-title"><p class="eyebrow">INJURY-COST AVOIDANCE SCENARIOS</p><h3 id="beam-impact-title">Scale the safety case carefully</h3><p class="calculator-intro">The paper uses approximately four strain-related recordable cases per year as its site baseline. Select how many cases could be avoided; exposure reduction is not converted automatically into injury reduction.</p>
      <form id="beam-form"><div class="impact-form">
        <label>Cases avoided per site per year<input name="avoidedCases" type="number" min="0" max="4" step="0.5" value="2" required></label>
        <label>Estimated total cost per strain injury (USD)<input name="injuryCost" type="number" min="0" max="10000000" step="0.01" value="67248" required></label>
        <label>Comparable first-generation sites<input name="sites" type="number" min="1" max="10000" step="1" value="8" required></label>
      </div><p class="impact-error" id="beam-error" role="status" hidden></p>
      <table class="impact-table safety-cost-table"><caption class="visually-hidden">Annual A-Level Beams injury-cost avoidance scenarios</caption><thead><tr><th scope="col">Scope</th><th scope="col">Cases avoided</th><th scope="col">Estimated annual value</th></tr></thead><tbody>
        <tr><th scope="row">One site</th><td id="beam-site-cases">2</td><td id="beam-site-value">$134,496</td></tr>
        <tr class="annual-row"><th scope="row" id="beam-network-label">8 sites</th><td id="beam-network-cases">16</td><td id="beam-network-value">$1,075,968</td></tr>
      </tbody></table><p class="impact-summary" id="beam-summary" aria-live="polite" aria-atomic="true"></p>
      <p class="impact-method">Two avoided cases is an illustrative scenario. The paper’s four-case assumption yields $268,992 per site per year, or $2,151,936 across eight equivalent sites. Preventing all four baseline cases is an upper scenario, not a measured outcome.</p>
      <details class="model-details"><summary>Include the investment and storage tradeoff</summary><p class="impact-method">The paper estimates approximately $0.728 million of site investment and a 2.73% storage-capacity reduction, valued at $188,623.80 per year. These planning figures require updated quotes and capacity validation.</p><div class="impact-form">
        <label>Site investment (USD)<input name="siteCapex" type="number" min="0" max="100000000" step="0.01" value="727283.09" required></label>
        <label>Annual storage opportunity cost / site (USD)<input name="annualCapacityCost" type="number" min="0" max="100000000" step="0.01" value="188623.80" required></label>
      </div><p class="impact-method" id="beam-net"></p><p class="impact-method" id="beam-payback"></p><p class="impact-method" id="beam-investment"></p>
      <p class="impact-method">The paper’s roughly 9.05-year simple payback assumes all four baseline cases are avoided and deducts its storage opportunity cost. At two avoided cases, this limited financial model does not cover that annual opportunity cost. The safety rationale remains separate from this financial sensitivity. No discounted cash flow, validated NPV, or quantified productivity benefit is claimed here.</p></details></form>
      <p class="impact-method">The $67,248 historical proxy includes $32,023 direct and $35,225 indirect costs, as reproduced from OSHA Safety Pays in the paper. It is not the actual cost of every injury. Network figures assume comparable risk and implementation at all selected sites; each building needs its own case history, bin count, costs, and rollout schedule.</p>
      <p class="impact-method">The source is a project white paper, not a final installation or post-installation benefits report. Avoided injuries and network benefits remain projections. Do not combine these cases with Bin Liners injury avoidance until overlapping incidents have been removed.</p>
    </section>`,
};
