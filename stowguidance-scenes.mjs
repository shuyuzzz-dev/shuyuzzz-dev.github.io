// Reading order in the two-column, three-row illustration sheet.
export const STOW_GUIDANCE_SCENES = [
  {
    position: '0% 0%', phase: 'Before: mount the cage',
    title: 'The cage is mounted. The scanning still has to happen.',
    text: 'The stower first mounts the full cage directly behind the order picker (OP), aligned straight with the vehicle. The cage and operator platform share a lifting assembly and move up and down together during stowing. The old process still requires a separate tablet scan.',
    metric: 'One cage changeover',
    alt: 'A stationary stand-up order picker with a loaded mesh cage mounted behind the operator platform; the stower takes out a tablet.',
  },
  {
    position: '100% 0%', phase: 'Before: tablet scan',
    title: 'Aim the tablet at the cage barcode.',
    text: 'The stower uses the tablet camera to read the mounted cage’s barcode. The camera can be difficult to align and scan successfully, so a failed attempt means trying again.',
    metric: 'Manual barcode capture',
    alt: 'The stower aims a handheld tablet at the barcode on the rear-mounted mesh cage.',
  },
  {
    position: '0% 50%', phase: 'Before: wait for Stow Guidance',
    title: 'Wait for the recommended aisles.',
    text: 'After scanning, the stower waits for Stow Guidance to update on the tablet before heading to the recommended aisles. Scanning and waiting together take about one minute per cage even when the scan succeeds on the first try.',
    metric: '≈60 seconds for scanning + waiting',
    alt: 'The order picker and rear-mounted cage remain stationary while the stower waits for the tablet to load the aisle recommendation.',
  },
  {
    position: '100% 50%', phase: 'After: pull through',
    title: 'Make the exit route do the scanning.',
    text: 'I designed the “car wash” arrangement around three parallel lanes. Each lane has its own doorway-shaped strut frame, bolted to the floor and supplied with power from overhead. The stower pulls a cage through the frame on the way to the OP.',
    metric: '3 lanes, one frame per lane',
    alt: 'Three parallel cage lanes each have a floor-mounted doorway frame and overhead TV; a stower pulls a full cage through the middle lane.',
  },
  {
    position: '0% 100%', phase: 'After: automatic scan',
    title: 'The barcode is read while the cage moves.',
    text: 'A fixed-mount barcode scanner reads the cage barcode as it passes through the lane’s frame. Stow Guidance processes the recommendation while the stower continues toward the order picker; the TV above the frame displays the recommended aisles.',
    metric: 'Scanning overlaps with movement',
    alt: 'A fixed scanner reads the barcode on a moving cage while the overhead TV shows an aisle-direction graphic.',
  },
  {
    position: '100% 100%', phase: 'After: mount and go',
    title: 'The direction is ready when the cage is mounted.',
    text: 'By the time the cage is secured behind the order picker, the overhead screen already shows the recommended aisles. The stower can continue without a separate tablet scan and wait. During stowing, the attached cage rises with the operator platform.',
    metric: '≈60 seconds recovered per cage',
    alt: 'The cage is secured behind the order picker on its shared elevating assembly, with the operator ready and the overhead TV showing the direction.',
  },
];
