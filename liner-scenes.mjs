export const LINER_SCENES = [
  {
    title: 'A wide bin. A buried item.', phase: 'BEFORE / HORIZONTAL STACKING',
    position: '0% 0%', next: 'Watch the extra handling',
    text: 'Large items lie flat and stack on top of one another in a wide rack opening. From the order picker, the associate has to find the right item inside the pile.',
    alt: 'Wide shelf openings in tall Rainbow racking hold horizontal stacks of large cartons. A picker on an order picker faces a buried item. These are shelf bins, without pallets.',
    metric: '120 sec average time at bin',
  },
  {
    title: 'Move other items just to reach one.', phase: 'BEFORE / REPEATED PUSH AND PULL',
    position: '100% 0%', next: 'Install the white liners',
    text: 'The picker pushes, pulls, and repositions surrounding products before retrieving the target. Each extra movement adds time and physical strain.',
    alt: 'The picker reaches into a wide shelf compartment to move obstructing horizontal cartons while Shuyu observes the repeated handling.',
    metric: 'Extra searching, reaching, and handling',
  },
  {
    title: 'White liners change how the bin is used.', phase: 'AFTER / UPRIGHT, LIBRARY-STYLE STOW',
    position: '0% 100%', next: 'Watch the direct pick',
    text: 'White plastic liners narrow the usable compartments. Stowers place the large items upright alongside one another, like books, so the layout reinforces the stow standard.',
    alt: 'White plastic side liners create narrower compartments within the same red-beam shelf racking. Large brown cartons stand upright like books, with no pallets.',
    metric: 'Narrower compartments. Visible, upright items.',
  },
  {
    title: 'Find it. Retrieve it. Keep moving.', phase: 'AFTER / LESS HANDLING',
    position: '100% 100%', next: 'Explore the project',
    text: 'The picker can identify and retrieve an upright item without first moving the pile around it. The reported average time at bin fell from 120 to 30 seconds, with a 60% lower recordable incident rate in Rainbow-bin picking after the project.',
    alt: 'The picker retrieves one upright carton directly from a white-lined shelf compartment onto the protected order-picker platform, leaving neighboring items in place.',
    metric: '30 sec average time at bin · 90 sec recovered',
  },
];
