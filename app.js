import { renderAIScreen, renderAIHero, aiHeroView } from './ai-operations.mjs';
import { initI18n, getLocale } from './i18n.mjs';
import { STOPS, START, EXIT, walkable, findPath } from './navigation.mjs';
import { PROJECTS, ADDITIONAL_WORK } from './projects.mjs';
import { estimateStowGuidance } from './stowguidance-impact.mjs';
import { estimateOnboarding, estimateRegionalOnboarding } from './onboarding-impact.mjs';
import { BEAM_SCENES } from './safety-projects.mjs';
import { LINER_SCENES } from './liner-scenes.mjs';
import { STOW_GUIDANCE_SCENES } from './stowguidance-scenes.mjs';
import { PORTAL_SCENES } from './portal-scenes.mjs';
import { AI_DECKS } from './ai-decks.mjs';
import { updateSafetyEstimate, fieldProblem, markChangedOutputs } from './safety-ui.mjs';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const landing = $('#landing'), game = $('#game'), world = $('#world'), outside = $('#outside');
const manager = $('#manager'), sprite = $('#manager-sprite');
const spriteContext = sprite.getContext('2d');
const dialog = $('#project-dialog'), dialogContent = $('#dialog-content');
const ring = $('#destination-ring'), routeLine = $('#route-line');
const nearbyPrompt = $('#nearby-prompt'), locationLabel = $('#location-label');
const managerName = $('.manager-name'), exitButton = $('.warehouse-exit');
const announcement = $('#arrival-message');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const visited = new Set();
const position = { ...START };
const keys = new Set();
let active = false, route = [], pendingStop = null, selectedStop = null;
let nearbyStop = null, arrivalTimer = null, frameRequest = null, previousTime = 0;
let facing = 0, lastSprite = '', dialogReturnFocus = null, flowStep = -1;
let walkingClock = 0;
let outsideActive = false, pendingExit = false, nearbyExit = false, courtController = null, courtLoading = null;
let beamStep = 0, deckKey = null, deckStep = 0;
let linerStep = 0;
let stowguidanceStep = 0;

// The generated sheet has intentionally inspected per-pose bounds rather than a
// mechanically perfect grid. Crop at draw time and anchor every pose at its feet.
const frames = [
  [163,35,340,354], [463,35,624,348], [746,35,923,354],
  [163,383,331,705], [483,385,602,701], [751,383,922,701],
  [177,734,347,1053], [483,734,605,1051], [740,734,910,1053],
  [163,1081,336,1408], [462,1082,624,1397], [751,1084,923,1408],
];
const spriteImage = new Image();
spriteImage.addEventListener('load', () => { lastSprite = ''; drawSprite(false); });
spriteImage.addEventListener('error', () => {
  announcement.textContent = 'The character image could not load. You can still explore every project from the project index.';
});
// The sprite is only drawn on the floor, so it loads after the landing page has finished.
function loadSprite() {
  if (!spriteImage.src) spriteImage.src = 'assets/manager.webp';
}
function loadSpriteWhenIdle() {
  if ('requestIdleCallback' in window) requestIdleCallback(loadSprite, { timeout: 2000 });
  else setTimeout(loadSprite, 200);
}
if (document.readyState === 'complete') loadSpriteWhenIdle();
else window.addEventListener('load', loadSpriteWhenIdle, { once: true });
function drawSprite(walking) {
  if (!spriteImage.complete || !spriteImage.naturalWidth || !spriteContext) return;
  const step = walking && !reducedMotion.matches ? [0, 1, 2, 1][Math.floor(walkingClock / 130) % 4] : 1;
  const key = `${facing}:${step}`;
  if (key === lastSprite) return;
  lastSprite = key;
  const [x0, y0, x1, y1] = frames[facing * 3 + step];
  const scale = 112 / 327;
  const w = (x1 - x0) * scale, h = (y1 - y0) * scale;
  spriteContext.imageSmoothingEnabled = false;
  spriteContext.clearRect(0, 0, 128, 128);
  spriteContext.drawImage(spriteImage, x0, y0, x1-x0, y1-y0, Math.round((128-w)/2), Math.round(121-h), Math.round(w), Math.round(h));
}
function renderPosition(walking = false) {
  manager.style.left = `${position.x / 10}%`;
  manager.style.top = `${position.y / 667 * 100}%`;
  drawSprite(walking);
  routeLine.setAttribute('points', route.length ? [position, ...route].map(p => `${p.x},${p.y}`).join(' ') : '');
  placeNearbyPrompt();
}
function clearArrival() {
  if (arrivalTimer !== null) window.clearTimeout(arrivalTimer);
  arrivalTimer = null;
}
function stopMotion() {
  clearArrival();
  pendingStop = null;
  pendingExit = false;
  keys.clear();
  route = [];
  ring.hidden = true;
  if (frameRequest !== null) window.cancelAnimationFrame(frameRequest);
  frameRequest = null;
  previousTime = 0;
  renderPosition(false);
}
function updateNearby() {
  const found = Object.entries(STOPS).find(([, p]) => Math.hypot(p.x-position.x, p.y-position.y) < 40);
  nearbyStop = found ? found[0] : null;
  nearbyExit = Math.hypot(EXIT.x-position.x, EXIT.y-position.y) < 45;
  nearbyPrompt.hidden = !(nearbyStop || nearbyExit) || route.length > 0 || !active;
  if (nearbyExit) {
    nearbyPrompt.innerHTML = '<span>Step outside for basketball</span> <kbd>Enter</kbd>';
    locationLabel.textContent = 'Life outside work';
  } else if (nearbyStop) {
    nearbyPrompt.innerHTML = `Explore ${PROJECTS[nearbyStop].title} <kbd>Enter</kbd>`;
    locationLabel.textContent = STOPS[nearbyStop].label;
  } else if (!route.length) {
    locationLabel.textContent = position.y > 480 ? 'At the entrance' : 'On the floor';
  }
  placeNearbyPrompt();
}
// The Enter prompt goes beside Shuyu (below first, then the sides, then above), in the first spot that
// covers no other stop marker and no exit, or else the spot that covers least. Covering the marker the
// prompt opens matters less. It always stays inside the map.
function placeNearbyPrompt() {
  if (nearbyPrompt.hidden) return;
  const map = world.getBoundingClientRect(), gap = 8;
  const box = (el) => { const r = el.getBoundingClientRect(); return [r.left - map.left, r.top - map.top, r.right - map.left, r.bottom - map.top]; };
  const [bodyLeft, bodyTop, bodyRight, bodyBottom] = box(manager), headTop = Math.min(bodyTop, box(managerName)[1]);
  const width = nearbyPrompt.offsetWidth, height = nearbyPrompt.offsetHeight;
  const centered = Math.min(Math.max((bodyLeft + bodyRight - width) / 2, gap), map.width - width - gap);
  const right = bodyRight + gap, left = bodyLeft - gap - width;
  const above = headTop - gap - height, middle = (bodyTop + bodyBottom - height) / 2, below = bodyBottom + gap;
  const own = (el) => el === exitButton ? nearbyExit : el.dataset.stop === nearbyStop;
  const blockers = [...world.querySelectorAll('.stop-pin'), exitButton].map(el => [box(el), own(el) ? 1 : 1000]);
  const covered = ([x, y]) => blockers.reduce((sum, [[l, t, r, b], weight]) => sum + weight * Math.max(0, Math.min(x + width, r) - Math.max(x, l)) * Math.max(0, Math.min(y + height, b) - Math.max(y, t)), 0);
  const inside = ([x, y]) => x >= gap && y >= gap && x + width <= map.width - gap && y + height <= map.height - gap;
  const options = [[centered, below], [right, middle], [left, middle], [centered, above], [right, below], [left, below], [right, above], [left, above]].filter(inside);
  const [x, y] = options.length ? options.reduce((best, next) => covered(next) < covered(best) ? next : best) : [centered, map.height - height - gap];
  nearbyPrompt.style.left = `${Math.round(x)}px`;
  nearbyPrompt.style.top = `${Math.round(y)}px`;
}
function progressMessage() {
  const total = Object.keys(PROJECTS).length;
  return visited.size === total ? 'All five stops explored. Revisit a project or view my résumé.' : `${visited.size} of ${total} projects explored. Continue to another stop when you’re ready.`;
}
function highlightStop(id) {
  selectedStop = id;
  $$('[data-stop]').forEach(el => {
    el.classList.toggle('is-active', el.dataset.stop === id);
    if (el.classList.contains('stop-card')) el.setAttribute('aria-current', el.dataset.stop === id ? 'location' : 'false');
  });
}
function enterWarehouse(focus = true, updateHistory = true) {
  loadSprite();
  if (updateHistory) setProjectUrl(null);
  if (outsideActive) Object.assign(position, START);
  outsideActive = false;
  courtController?.hide();
  outside.hidden = true;
  active = true;
  landing.hidden = true;
  game.hidden = false;
  if (updateHistory && location.hash !== '#warehouse') history.pushState(null, '', '#warehouse');
  if (focus) {
    world.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  renderPosition();
  updateNearby();
}
async function showOutside(updateHistory = true) {
  if (updateHistory) setProjectUrl(null);
  stopMotion();
  active = false;
  outsideActive = true;
  landing.hidden = true;
  game.hidden = true;
  outside.hidden = false;
  if (updateHistory && location.hash !== '#outside') history.pushState(null, '', '#outside');
  window.scrollTo({ top: 0, behavior: 'instant' });
  try {
    courtLoading ||= import('./basketball.mjs').then(module => (courtController = module.mountBasketball()));
    const court = await courtLoading;
    if (outsideActive) court.show();
  } catch {
    $('#court-overlay-title').textContent = 'The court artwork could not load. Try reloading this page.';
  }
}
function walkOutside() {
  if (dialog.open) dialog.close();
  if (!active) enterWarehouse();
  world.focus({ preventScroll: true });
  travelTo(EXIT, null, true);
}
function goHome(updateHistory = true) {
  if (updateHistory) setProjectUrl(null);
  courtController?.hide();
  outsideActive = false;
  outside.hidden = true;
  stopMotion();
  active = false;
  game.hidden = true;
  landing.hidden = false;
  if (updateHistory && location.hash) history.pushState(null, '', location.pathname + location.search);
  $('#enter-button').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function updateProgress() {
  const total = Object.keys(PROJECTS).length;
  $('#progress-text').textContent = `${visited.size} / ${total}`;
  $('#progress-fill').style.width = `${visited.size/total*100}%`;
  $('.progress-track').setAttribute('aria-valuemax', String(total));
  $('.progress-track').setAttribute('aria-valuenow', String(visited.size));
  $$('[data-stop]').forEach(el => {
    const done = visited.has(el.dataset.stop);
    el.classList.toggle('is-visited', done);
    const state = el.querySelector('.stop-state');
    if (state) state.textContent = done ? '✓' : '';
  });
}
function travelTo(target, stopId = null, toExit = false) {
  if (!active) enterWarehouse();
  clearArrival();
  keys.clear();
  pendingStop = stopId;
  pendingExit = toExit;
  highlightStop(stopId);
  route = findPath(position, target);
  const destination = route.at(-1);
  if (!destination) {
    announcement.textContent = 'Choose a point on the warehouse floor or select a project marker.';
    return;
  }
  ring.style.left = `${destination.x/10}%`;
  ring.style.top = `${destination.y/667*100}%`;
  ring.hidden = false;
  nearbyPrompt.hidden = true;
  locationLabel.textContent = stopId ? `To ${STOPS[stopId].label.toLowerCase()}` : 'Walking the floor';
  announcement.textContent = toExit ? 'Walking to the exit. Time for a little basketball.' : stopId ? `Walking to ${PROJECTS[stopId].title}. The project will open when Shuyu arrives.` : 'Click a project marker whenever you want to explore its story.';
  if (reducedMotion.matches) {
    Object.assign(position, destination);
    route = [];
    arrive();
    return;
  }
  startLoop();
}
function arrive() {
  ring.hidden = true;
  route = [];
  updateNearby();
  if (pendingExit) {
    pendingExit = false;
    showOutside();
    return;
  }
  const completed = pendingStop;
  pendingStop = null;
  if (completed) {
    facing = STOPS[completed].facing;
    renderPosition(false);
    announcement.textContent = `At ${STOPS[completed].label.toLowerCase()}. Opening ${PROJECTS[completed].title}.`;
    arrivalTimer = window.setTimeout(() => {
      arrivalTimer = null;
      if (active && !dialog.open) showProject(completed, world);
    }, reducedMotion.matches ? 0 : 180);
  } else {
    renderPosition(false);
    announcement.textContent = nearbyStop ? `You’re near ${PROJECTS[nearbyStop].title}. Press Enter or use the project marker.` : 'Choose a project marker, or keep exploring the floor.';
  }
}
function direction(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) facing = dx < 0 ? 1 : 2;
  else if (dy !== 0) facing = dy < 0 ? 3 : 0;
}
function frame(time) {
  frameRequest = null;
  if (!active || dialog.open || document.hidden) { previousTime = 0; return; }
  const elapsed = previousTime ? Math.min(time - previousTime, 48) : 16;
  previousTime = time;
  const distance = 175 * elapsed / 1000;
  let moving = false;
  const dx = Number(keys.has('arrowright') || keys.has('d')) - Number(keys.has('arrowleft') || keys.has('a'));
  const dy = Number(keys.has('arrowdown') || keys.has('s')) - Number(keys.has('arrowup') || keys.has('w'));
  if (dx || dy) {
    direction(dx, dy);
    const magnitude = Math.hypot(dx, dy);
    const nextX = position.x + dx / magnitude * distance;
    if (walkable(nextX, position.y)) { position.x = nextX; moving = true; }
    const nextY = position.y + dy / magnitude * distance;
    if (walkable(position.x, nextY)) { position.y = nextY; moving = true; }
    updateNearby();
  } else if (route.length) {
    let available = distance;
    while (available > 0 && route.length) {
      const next = route[0], rx = next.x - position.x, ry = next.y - position.y;
      const length = Math.hypot(rx, ry);
      if (length < 0.01) { route.shift(); continue; }
      direction(rx, ry);
      moving = true;
      if (length <= available) {
        Object.assign(position, next);
        available -= length;
        route.shift();
      } else {
        position.x += rx / length * available;
        position.y += ry / length * available;
        available = 0;
      }
    }
    if (!route.length) { arrive(); moving = false; }
  }
  if (moving) walkingClock += elapsed;
  renderPosition(moving);
  if (route.length || keys.size) frameRequest = requestAnimationFrame(frame);
  else previousTime = 0;
}
function startLoop() {
  if (frameRequest === null) frameRequest = requestAnimationFrame(frame);
}
// Each project's notes have their own address, so a project can be linked to directly.
const PROJECT_SLUGS = { liners: 'bin-liners', stowguidance: 'stow-guidance', portal: 'onboarding-portal', beams: 'a-level-beams', ai: 'ai-operations' };
const linkedProject = () => Object.keys(PROJECT_SLUGS).find(id => location.hash === `#${PROJECT_SLUGS[id]}`);
const defaultTitle = document.title;
function setProjectUrl(id) {
  const slug = id && PROJECT_SLUGS[id];
  if (slug && location.hash !== `#${slug}`) history.replaceState(null, '', `#${slug}`);
  else if (!slug && linkedProject()) history.replaceState(null, '', outsideActive ? '#outside' : active ? '#warehouse' : location.pathname + location.search);
  document.title = slug ? `${PROJECTS[id].title} | Shuyu Zheng` : defaultTitle;
}
function openDialog(html, eyebrow = 'Project notes', returnFocus = null) {
  setProjectUrl(null);
  if (outsideActive) courtController?.pause();
  const wasOpen = dialog.open;
  if (!wasOpen) dialogReturnFocus = returnFocus || document.activeElement;
  stopMotion();
  flowStep = -1;
  dialogContent.innerHTML = html;
  dialog.classList.toggle('is-slideshow', Boolean(dialogContent.querySelector('.observation-view')));
  $('#dialog-eyebrow').textContent = eyebrow;
  document.body.classList.add('dialog-open');
  if (!wasOpen) dialog.showModal();
  dialog.scrollTop = 0;
  // Focus lands on the new title, so a screen reader starts at the top of what just opened.
  const title = $('#dialog-title');
  if (title) { title.tabIndex = -1; title.focus({ preventScroll: true }); }
  else $('.close-dialog').focus({ preventScroll: true });
}
function returnToFloor() {
  dialogReturnFocus = world;
  enterWarehouse(false);
  if (dialog.open) dialog.close();
  world.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function showProject(id, returnFocus = null, skipEncounter = false) {
  const project = PROJECTS[id];
  if (!project) return;
  if (id === 'beams' && !skipEncounter) { showBeamObservation(returnFocus); return; }
  if (id === 'liners' && !skipEncounter) { showLinerObservation(returnFocus); return; }
  if (id === 'stowguidance' && !skipEncounter) { showStowGuidanceObservation(returnFocus); return; }
  if (id === 'portal' && !skipEncounter) { showDeck('portal', returnFocus); return; }
  visited.add(id);
  updateProgress();
  highlightStop(id);
  const ids = Object.keys(PROJECTS), nextId = ids[(ids.indexOf(id)+1)%ids.length];
  openDialog(`<article class="dialog-body" style="--project-accent:${project.color}"><h2 id="dialog-title">${project.title}</h2><p class="dialog-lead">${project.lead}</p><div class="project-tags">${project.tags.map(tag=>`<span>${tag}</span>`).join('')}</div>${project.content}<div class="project-end"><button type="button" class="button primary" data-return-floor>Back to the floor</button><button type="button" class="plain-link" data-project="${nextId}">Next: ${PROJECTS[nextId].title}</button></div></article>`, project.place, returnFocus);
  setProjectUrl(id);
  if (id === 'stowguidance') updateImpactEstimate();
  if (id === 'portal') updateOnboardingEstimate();
  if (id === 'liners' || id === 'beams') updateSafetyEstimate(id);
  announcement.textContent = progressMessage();
}
function showBeamObservation(returnFocus = null) {
  beamStep = 0;
  highlightStop('beams');
  openDialog(`<section class="dialog-body beam-observation observation-view" style="--project-accent:var(--safety)"><h2 id="dialog-title">See the task through the picker’s eyes.</h2><div class="observation-progress" id="beam-scene-progress" aria-label="Observation progress">1 / 4</div><div class="slide-viewport"><div class="slide-advance" data-advance-beams><span class="observation-art" id="beam-scene-image" role="img" aria-label=""></span></div></div><div class="observation-details"><p class="slide-tap-hint">Tap the slide or use Next.</p><div class="observation-copy" aria-live="polite" aria-atomic="true"><h3 id="beam-scene-title"></h3><p id="beam-scene-text"></p></div><p class="impact-method">An illustrative scene showing ergonomic risk, not a reconstruction of a specific injury or an installation drawing.</p></div><div class="observation-actions"><button type="button" class="plain-link" id="beam-scene-back">Previous</button><button type="button" class="button primary" id="beam-scene-next">Next slide</button><button type="button" class="plain-link observation-skip" data-read-beams>Go straight to the project</button></div></section>`, 'Floor observation', returnFocus);
  renderBeamObservation();
}
function renderBeamObservation() {
  const scene = BEAM_SCENES[beamStep];
  $('.observation-details').scrollTop = 0;
  $('#beam-scene-image').style.backgroundPosition = scene.position;
  $('#beam-scene-image').setAttribute('aria-label', scene.alt);
  $('#beam-scene-title').textContent = scene.title;
  $('#beam-scene-text').textContent = scene.text;
  $('#beam-scene-progress').textContent = `${beamStep + 1} / ${BEAM_SCENES.length}`;
  $('#beam-scene-next').textContent = beamStep === BEAM_SCENES.length - 1 ? 'Explore the project' : 'Next slide';
  $('#beam-scene-back').disabled = beamStep === 0;
  $('[data-read-beams]').hidden = beamStep === BEAM_SCENES.length - 1;
}
function advanceBeamObservation(direction = 1) {
  if (direction === 1 && beamStep === BEAM_SCENES.length - 1) { showProject('beams', null, true); return; }
  beamStep = Math.max(0, Math.min(BEAM_SCENES.length - 1, beamStep + direction));
  renderBeamObservation();
}
function showLinerObservation(returnFocus = null) {
  linerStep = 0;
  highlightStop('liners');
  openDialog(`<section class="dialog-body liner-observation observation-view" style="--project-accent:var(--mint)"><h2 id="dialog-title">From digging through a pile to picking from a shelf.</h2><div class="liner-scene-heading"><span id="liner-scene-phase"></span><span id="liner-scene-progress" aria-label="Observation progress">1 / 4</span></div><div class="slide-viewport"><div class="slide-advance" data-advance-liners><span class="observation-art liner-stage" id="liner-scene-image" role="img" aria-label=""><span class="liner-scene-layer" id="liner-scene-current" aria-hidden="true"></span><span class="liner-scene-layer liner-scene-outgoing" id="liner-scene-outgoing" aria-hidden="true"></span></span></div></div><div class="observation-details"><p class="slide-tap-hint">Tap the slide or use Next.</p><div class="observation-copy" aria-live="polite" aria-atomic="true"><p class="liner-scene-metric" id="liner-scene-metric"></p><h3 id="liner-scene-title"></h3><p id="liner-scene-text"></p></div><p class="impact-method">Illustrative workflow based on the project account. Pick times are reported averages; the animation is not a timed reenactment.</p></div><div class="observation-actions"><button type="button" class="plain-link" id="liner-scene-back">Previous</button><button type="button" class="button primary" id="liner-scene-next">Next slide</button><button type="button" class="plain-link observation-skip" data-read-liners>Go straight to the project</button></div></section>`, 'Before and after', returnFocus);
  renderLinerObservation(false);
}
function renderLinerObservation(animate = true) {
  const scene = LINER_SCENES[linerStep];
  $('.observation-details').scrollTop = 0;
  const current = $('#liner-scene-current'), outgoing = $('#liner-scene-outgoing');
  outgoing.classList.remove('is-fading');
  if (animate && !reducedMotion.matches) {
    outgoing.style.backgroundPosition = current.style.backgroundPosition;
    void outgoing.offsetWidth;
    outgoing.classList.add('is-fading');
  }
  current.style.backgroundPosition = scene.position;
  $('#liner-scene-image').setAttribute('aria-label', scene.alt);
  $('#liner-scene-title').textContent = scene.title;
  $('#liner-scene-text').textContent = scene.text;
  $('#liner-scene-phase').textContent = scene.phase;
  $('#liner-scene-metric').textContent = scene.metric;
  $('#liner-scene-progress').textContent = `${linerStep + 1} / ${LINER_SCENES.length}`;
  $('#liner-scene-next').textContent = linerStep === LINER_SCENES.length - 1 ? 'Explore the project' : 'Next slide';
  $('#liner-scene-back').disabled = linerStep === 0;
  $('[data-read-liners]').hidden = linerStep === LINER_SCENES.length - 1;
}
function advanceLinerObservation(direction = 1) {
  if (direction === 1 && linerStep === LINER_SCENES.length - 1) { showProject('liners', null, true); return; }
  linerStep = Math.max(0, Math.min(LINER_SCENES.length - 1, linerStep + direction));
  renderLinerObservation();
}
function showStowGuidanceObservation(returnFocus = null) {
  stowguidanceStep = 0;
  highlightStop('stowguidance');
  openDialog(`<section class="dialog-body stowguidance-observation observation-view" style="--project-accent:var(--amber)">
    <h2 id="dialog-title">From scan and wait to mount and go.</h2>
    <div class="liner-scene-heading"><span id="stowguidance-scene-phase"></span><span id="stowguidance-scene-progress" aria-label="Observation progress"></span></div>
    <div class="slide-viewport"><div class="slide-advance" data-advance-stowguidance><span class="observation-art stowguidance-stage" id="stowguidance-scene-image" role="img" aria-label=""><span class="stowguidance-scene-layer" id="stowguidance-scene-current" aria-hidden="true"></span><span class="stowguidance-scene-layer stowguidance-scene-outgoing" id="stowguidance-scene-outgoing" aria-hidden="true"></span></span></div></div>
    <div class="observation-details"><p class="slide-tap-hint">Tap the slide or use Next.</p><div class="observation-copy" aria-live="polite" aria-atomic="true"><p class="stowguidance-scene-metric" id="stowguidance-scene-metric"></p><h3 id="stowguidance-scene-title"></h3><p id="stowguidance-scene-text"></p></div><p class="impact-method">Illustrated from my project account and warehouse photos. The sequence is not timed; the approximate one-minute recovery covers the old scan-and-wait process together.</p></div>
    <div class="observation-actions"><button type="button" class="plain-link" id="stowguidance-scene-back">Previous</button><button type="button" class="button primary" id="stowguidance-scene-next">Next slide</button><button type="button" class="plain-link observation-skip" data-read-stowguidance>Go straight to the project</button></div>
  </section>`, 'Before and after', returnFocus);
  renderStowGuidanceObservation(false);
}
function renderStowGuidanceObservation(animate = true) {
  const scene = STOW_GUIDANCE_SCENES[stowguidanceStep];
  $('.observation-details').scrollTop = 0;
  const current = $('#stowguidance-scene-current'), outgoing = $('#stowguidance-scene-outgoing');
  outgoing.classList.remove('is-fading');
  if (animate && !reducedMotion.matches) {
    outgoing.style.backgroundPosition = current.style.backgroundPosition;
    void outgoing.offsetWidth;
    outgoing.classList.add('is-fading');
  }
  current.style.backgroundPosition = scene.position;
  $('#stowguidance-scene-image').setAttribute('aria-label', scene.alt);
  $('#stowguidance-scene-phase').textContent = scene.phase;
  $('#stowguidance-scene-progress').textContent = `${stowguidanceStep + 1} / ${STOW_GUIDANCE_SCENES.length}`;
  $('#stowguidance-scene-metric').textContent = scene.metric;
  $('#stowguidance-scene-title').textContent = scene.title;
  $('#stowguidance-scene-text').textContent = scene.text;
  $('#stowguidance-scene-back').disabled = stowguidanceStep === 0;
  $('#stowguidance-scene-next').textContent = stowguidanceStep === STOW_GUIDANCE_SCENES.length - 1 ? 'Explore the project' : 'Next slide';
  $('[data-read-stowguidance]').hidden = stowguidanceStep === STOW_GUIDANCE_SCENES.length - 1;
}
function advanceStowGuidanceObservation(direction = 1) {
  if (direction === 1 && stowguidanceStep === STOW_GUIDANCE_SCENES.length - 1) { showProject('stowguidance', null, true); return; }
  stowguidanceStep = Math.max(0, Math.min(STOW_GUIDANCE_SCENES.length - 1, stowguidanceStep + direction));
  renderStowGuidanceObservation();
}
// Screenshot decks: one real image per slide, a title and a short caption. The portal deck
// ends on its project page; AI decks return to the screen that opened them.
const DECKS = {
  portal: {
    project: 'portal', accent: 'var(--blue)', scenes: PORTAL_SCENES,
    eyebrow: 'Portal walkthrough',
    title: 'Learning health, from organization to individual.',
    audience: 'Manager view: individual learning',
    note: 'Screenshots from the working portal, with names pixelated, sensitive values blurred and internal labels made generic; everything obscured is placeholder content. Original interface in English; captions follow your selected language.',
  },
  ...AI_DECKS,
};
function showDeck(key, returnFocus = null) {
  const deck = DECKS[key];
  if (!deck) return;
  deckKey = key;
  deckStep = 0;
  highlightStop(deck.project);
  const ratio = deck.scenes.reduce((sum, scene) => sum + scene.width / scene.height, 0) / deck.scenes.length;
  openDialog(`<section class="dialog-body ${key}-observation observation-view" style="--project-accent:${deck.accent};--slide-ratio:${ratio.toFixed(3)}"${deck.screen ? ` data-return-screen="${deck.screen}"` : ''}><h2 id="dialog-title">${deck.title}</h2><div class="liner-scene-heading"><span id="${key}-scene-audience"></span><span id="${key}-scene-progress" aria-label="Observation progress"></span></div><div class="slide-viewport"><div class="slide-advance" data-advance-${key}><img id="${key}-scene-image" class="portal-screen" alt="" draggable="false"></div></div><div class="observation-details"><p class="slide-tap-hint">Tap the slide or use Next.</p><div class="observation-copy" aria-live="polite" aria-atomic="true"><h3 id="${key}-scene-title"></h3><p id="${key}-scene-text"></p></div><a id="${key}-full-size" class="plain-link" target="_blank" rel="noopener noreferrer">View full-size screenshot ↗</a><p class="impact-method">${deck.note}</p></div><div class="observation-actions"><button type="button" class="plain-link" id="${key}-scene-back">Previous</button><button type="button" class="button primary" id="${key}-scene-next">Next slide</button><button type="button" class="plain-link observation-skip" data-read-${key}>Go straight to the project</button></div></section>`, deck.eyebrow, returnFocus);
  renderDeck();
}
function renderDeck() {
  const deck = DECKS[deckKey], scenes = deck.scenes, scene = scenes[deckStep], part = name => $(`#${deckKey}-${name}`);
  $('.observation-details').scrollTop = 0;
  const picture = part('scene-image');
  picture.src = scene.src;
  picture.alt = scene.alt;
  picture.width = scene.width;
  picture.height = scene.height;
  part('full-size').href = scene.full || scene.src;
  part('scene-audience').textContent = scene.audience || deck.audience || '';
  part('scene-title').textContent = scene.title;
  part('scene-text').textContent = scene.text;
  part('scene-progress').textContent = `${deckStep + 1} / ${scenes.length}`;
  part('scene-back').disabled = deckStep === 0;
  part('scene-next').textContent = deckStep === scenes.length - 1 ? deck.endLabel || 'Explore the project' : 'Next slide';
  $(`[data-read-${deckKey}]`).hidden = deckStep === scenes.length - 1;
  const next = scenes[deckStep + 1];
  if (next) { const preload = new Image(); preload.src = next.src; }
}
function advanceDeck(direction = 1) {
  const scenes = DECKS[deckKey].scenes;
  if (direction === 1 && deckStep === scenes.length - 1) { exitDeck(); return; }
  deckStep = Math.max(0, Math.min(scenes.length - 1, deckStep + direction));
  renderDeck();
}
function exitDeck() {
  const key = deckKey, deck = DECKS[key];
  showProject(deck.project, null, true);
  if (!deck.screen) return;
  selectAIScreen(deck.screen, false);
  // Scroll after the translation observer has run: translated captions can change the hero's height.
  queueMicrotask(() => {
    const workstation = $('.ai-workstation');
    workstation.style.scrollMarginTop = `${($('#project-dialog .dialog-top')?.offsetHeight || 0) + 12}px`;
    workstation.scrollIntoView({ block: 'start', behavior: 'auto' });
    const launcher = $(`#ai-screen-content [data-deck="${key}"]`);
    launcher?.focus({ preventScroll: true });
    launcher?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  });
}
// Close, Escape and a backdrop click inside an AI deck go back to the screen that opened it.
const deckReturns = () => Boolean(dialogContent.querySelector('.observation-view[data-return-screen]'));
function closeDialogOrDeck() {
  if (deckReturns()) exitDeck();
  else dialog.close();
}
function selectAIScreen(id, reveal = true) {
  const trigger = $(`#dialog-content [data-ai-screen="${id}"]`);
  if (!trigger) return;
  $$('#dialog-content [data-ai-screen]').forEach(button => button.setAttribute('aria-pressed', String(button === trigger)));
  $('#ai-screen-content').innerHTML = renderAIScreen(id);
  const hero = $('#ai-hero'), view = aiHeroView(id);
  if (hero && hero.dataset.view !== view) {
    hero.dataset.view = view; hero.innerHTML = renderAIHero(view);
    if (reveal && view !== 'art') {
      hero.style.scrollMarginTop = `${($('#project-dialog .dialog-top')?.offsetHeight || 0) + 12}px`;
      hero.scrollIntoView({ block: 'nearest', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }
  }
}
function showProjectMenu() {
  openDialog(`<div class="dialog-body"><h2 id="dialog-title">Project index.</h2><p class="dialog-lead">Explore the stories directly, or meet them on the warehouse floor.</p><div class="project-index">${Object.entries(PROJECTS).map(([id, p], i)=>`<button type="button" class="index-card" data-project="${id}" style="--stop-color:${p.color}"><span class="stop-index">${i + 1}</span><span><strong>${p.title}</strong><small>${p.summary}</small></span><span class="index-arrow" aria-hidden="true">${visited.has(id)?'✓':''}</span></button>`).join('')}</div><div class="project-end"><button type="button" class="button primary" data-return-floor>Walk the floor</button></div></div>`, 'Project index');
}
function showAbout() {
  openDialog(`<div class="dialog-body"><h2 id="dialog-title">A perspective built<br>from the floor up.</h2><p class="dialog-lead">I’m Shuyu Zheng, an operations and inventory quality leader at Amazon.</p><div class="resume-actions"><a class="outline-button" href="assets/Shuyu_Zheng_Resume.pdf" target="_blank" rel="noopener noreferrer"><span>View résumé (PDF, English)</span> <span aria-hidden="true">↗</span></a><a class="plain-link" href="assets/Shuyu_Zheng_Resume.pdf" download="Shuyu_Zheng_Resume.pdf">Download résumé (PDF, English)</a><p>One page covering operations leadership and program delivery.</p></div><div class="about-path">L4 Area Manager (college hire) → Operations Manager → ICQA Operations Manager</div><p>I’ve worked across inbound operations and Inventory Control and Quality Assurance (ICQA), with experience in receiving, stowing, inventory accuracy, quality mechanisms, and team development.</p><div class="about-grid"><div><span>Based in</span><strong>Bay Area, California</strong></div><div><span>Education</span><strong>San Francisco State University</strong></div></div><section class="story-section"><h3>Start close to the work</h3><p>Understand the actual workflow and where it breaks. Connect the data with what associates and managers experience.</p></section><section class="story-section"><h3>Make the response clear</h3><p>Define the next action, the owner, and the checkpoint. Build standard work around the problem being solved.</p></section><section class="story-section"><h3>Build what helps</h3><p>I use practical tools and AI-assisted development to turn operational needs into usable solutions, including my Onboarding Portal.</p></section><section class="story-section"><h3>Follow through</h3><p>Review adoption and effectiveness. Coach, adjust, and make the improvement part of everyday execution.</p></section><div class="more-work"><button type="button" class="outline-button" data-additional="quality">${ADDITIONAL_WORK.quality.label}</button><button type="button" class="outline-button" data-additional="inventory">${ADDITIONAL_WORK.inventory.label}</button></div><div class="project-end"><button class="button primary" type="button" data-return-floor>Walk the floor</button></div></div>`, 'Background and approach');
}
function showAdditional(id) {
  const item = ADDITIONAL_WORK[id];
  if (!item) return;
  openDialog(`<div class="dialog-body"><h2 id="dialog-title">${item.title}</h2><p class="dialog-lead">${item.lead}</p>${item.content}<div class="project-end"><button type="button" class="button primary" data-return-floor>Back to the floor</button><button type="button" class="plain-link" data-about>About me</button></div></div>`, item.label);
}
function advanceFlow() {
  const button = $('#flow-next');
  if (!button) return;
  flowStep = (flowStep+1)%3;
  $$('[data-flow-step]').forEach((el, i)=>el.classList.toggle('is-lit', i<=flowStep));
  $('#flow-status').textContent = [
    'The stower pulls a cage from its work-in-progress lane through the floor-mounted strut frame.',
    'The fixed scanner reads the barcode while the stower continues moving the cage toward the order picker.',
    'By the time the cage is mounted, the overhead TV displays Stow Guidance’s recommended aisles. The separate tablet scan and wait are removed.',
  ][flowStep];
  button.textContent = flowStep === 2 ? 'Replay ↺' : 'Next step →';
}

function updateImpactEstimate() {
  const form = $('#impact-form');
  if (!form) return;
  const error = $('#impact-error');
  const outputs = ['daily','weekly','annual'];
  try {
    const invalid = fieldProblem(form, 'impact-error');
    if (invalid) throw new RangeError(invalid);
    const scenario = Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,Number(value)]));
    const result = estimateStowGuidance(scenario);
    const hours = new Intl.NumberFormat(getLocale(), {maximumFractionDigits:1});
    const money = new Intl.NumberFormat(getLocale(), {style:'currency',currency:'USD',maximumFractionDigits:0});
    outputs.forEach(period=>{
      $(`#impact-${period}-hours`).textContent = `${hours.format(result[`${period}Hours`])} h`;
      $(`#impact-${period}-value`).textContent = money.format(result[`${period}Value`]);
    });
    $('#impact-summary').textContent = `Illustrative annual capacity: ${hours.format(result.annualHours)} labor-hours, valued at ${money.format(result.annualValue)}.`;
    error.hidden = true;
    error.textContent = '';
  } catch (problem) {
    error.textContent = problem.message;
    error.hidden = false;
    outputs.forEach(period=>{
      $(`#impact-${period}-hours`).textContent = '—';
      $(`#impact-${period}-value`).textContent = '—';
    });
    $('#impact-summary').textContent = 'Update the schedule to calculate the capacity estimate.';
  }
  markChangedOutputs('impact-form');
}
document.addEventListener('input', event=>{ if(event.target.closest('#impact-form')) updateImpactEstimate(); });
document.addEventListener('change', event=>{ if(event.target.closest('#impact-form')) updateImpactEstimate(); });
document.addEventListener('submit', event=>{ if(event.target.id === 'impact-form') { event.preventDefault(); updateImpactEstimate(); } });

function updateOnboardingEstimate() {
  const form = $('#onboarding-form');
  if (!form) return;
  const error = $('#onboarding-error');
  const outputPairs = {
    manager: ['managerCoordinationHours', 'managerCoordinationValue'],
    reviewer: ['reviewerCoordinationHours', 'reviewerCoordinationValue'],
    repeat: ['repeatPersonHours', 'repeatValue'],
    total: ['directHoursPerManager', 'directValuePerManager'],
  };
  const regionalPairs = {
    site: ['siteHours', 'siteValue'],
    annual: ['averageAnnualHours', 'averageAnnualValue'],
    total: ['rolloutHours', 'rolloutValue'],
  };
  try {
    const invalid = fieldProblem(form, 'onboarding-error');
    if (invalid) throw new RangeError(invalid);
    const input = Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,Number(value)]));
    const result = estimateOnboarding(input);
    const regional = estimateRegionalOnboarding(input, input);
    const hours = new Intl.NumberFormat(getLocale(), { maximumFractionDigits:1 });
    const money = new Intl.NumberFormat(getLocale(), { style:'currency',currency:'USD',maximumFractionDigits:0 });
    Object.entries(outputPairs).forEach(([id,[h,v]])=>{
      $(`#onboarding-${id}-hours`).textContent = `${hours.format(result[h])} h`;
      $(`#onboarding-${id}-value`).textContent = money.format(result[v]);
    });
    Object.entries(regionalPairs).forEach(([id,[h,v]])=>{
      $(`#regional-${id}-hours`).textContent = `${hours.format(regional[h])} h`;
      $(`#regional-${id}-value`).textContent = money.format(regional[v]);
    });
    $('#regional-population').textContent = `${hours.format(input.launchSites)} additional sites × ${hours.format(input.managersPerSite)} managers/site = ${hours.format(regional.managersAtLaunchSites)} managers. At ${hours.format(input.participationPercent)}% participation: ${hours.format(regional.participatingManagers)} managers onboarded once over ${input.rolloutYears} years.`;
    $('#regional-total-label').textContent = `${input.rolloutYears}-year rollout total`;
    $('#regional-summary').textContent = `Projected rollout capacity: ${hours.format(regional.rolloutHours)} labor-hours, valued at ${money.format(regional.rolloutValue)} over ${input.rolloutYears} years.`;
    $('#regional-sensitivity').textContent = `If only half the modeled time reduction is achieved at the selected participation level: ${hours.format(regional.halfBenefitHours)} hours, valued at ${money.format(regional.halfBenefitValue)} across the rollout.`;
    $('#onboarding-summary').textContent = `For ${hours.format(input.managersPerYear)} managers/year: ${hours.format(result.directAnnualHours)} labor-hours, valued at ${money.format(result.directAnnualValue)}.`;
    $('#onboarding-readiness').textContent = `Illustrative readiness value: ${money.format(result.readinessValuePerManager)} per manager; ${money.format(result.readinessAnnualValue)} across ${hours.format(input.managersPerYear)} managers. Excluded from the direct total.`;
    error.hidden = true;
    error.textContent = '';
  } catch (problem) {
    error.hidden = false;
    error.textContent = problem.message;
    Object.keys(outputPairs).forEach(id=>{
      $(`#onboarding-${id}-hours`).textContent = '—';
      $(`#onboarding-${id}-value`).textContent = '—';
    });
    Object.keys(regionalPairs).forEach(id=>{
      $(`#regional-${id}-hours`).textContent = '—';
      $(`#regional-${id}-value`).textContent = '—';
    });
    $('#regional-population').textContent = 'Update the inputs to calculate regional participation.';
    $('#regional-summary').textContent = 'Update the inputs to calculate the regional projection.';
    $('#regional-sensitivity').textContent = '';
    $('#onboarding-summary').textContent = 'Update the inputs to calculate the scenario.';
    $('#onboarding-readiness').textContent = 'Update the inputs to calculate the readiness scenario.';
  }
  markChangedOutputs('onboarding-form');
}
document.addEventListener('input', event=>{ if(event.target.closest('#onboarding-form')) updateOnboardingEstimate(); });
document.addEventListener('change', event=>{ if(event.target.closest('#onboarding-form')) updateOnboardingEstimate(); });
document.addEventListener('submit', event=>{ if(event.target.id === 'onboarding-form') { event.preventDefault(); updateOnboardingEstimate(); } });
for (const eventName of ['input', 'change', 'submit']) {
  document.addEventListener(eventName, event => {
    const form = event.target.closest('#liner-form, #beam-form');
    if (!form) return;
    if (eventName === 'submit') event.preventDefault();
    updateSafetyEstimate(form.id === 'liner-form' ? 'liners' : 'beams');
  });
}

$('#enter-button').addEventListener('click', () => enterWarehouse());
document.addEventListener('click', (event) => {
  const trigger = event.target.closest('button, .slide-advance');
  if (!trigger) return;
  if (trigger.hasAttribute('data-home')) { if (dialog.open) dialog.close(); goHome(); }
  else if (trigger.hasAttribute('data-walk-outside')) walkOutside();
  else if (trigger.hasAttribute('data-return-warehouse')) enterWarehouse();
  else if (trigger.hasAttribute('data-about')) showAbout();
  else if (trigger.dataset.aiScreen) selectAIScreen(trigger.dataset.aiScreen);
  else if (trigger.hasAttribute('data-project-menu')) showProjectMenu();
  else if (trigger.hasAttribute('data-read-beams')) showProject('beams', null, true);
  else if (trigger.hasAttribute('data-replay-beams')) showBeamObservation();
  else if (trigger.id === 'beam-scene-next' || trigger.hasAttribute('data-advance-beams')) advanceBeamObservation();
  else if (trigger.id === 'beam-scene-back') advanceBeamObservation(-1);
  else if (trigger.hasAttribute('data-read-liners')) showProject('liners', null, true);
  else if (trigger.hasAttribute('data-replay-liners')) showLinerObservation();
  else if (trigger.id === 'liner-scene-next' || trigger.hasAttribute('data-advance-liners')) advanceLinerObservation();
  else if (trigger.id === 'liner-scene-back') advanceLinerObservation(-1);
  else if (trigger.hasAttribute('data-read-stowguidance')) showProject('stowguidance', null, true);
  else if (trigger.hasAttribute('data-replay-stowguidance')) showStowGuidanceObservation();
  else if (trigger.id === 'stowguidance-scene-next' || trigger.hasAttribute('data-advance-stowguidance')) advanceStowGuidanceObservation();
  else if (trigger.id === 'stowguidance-scene-back') advanceStowGuidanceObservation(-1);
  else if (trigger.hasAttribute('data-replay-portal')) showDeck('portal');
  else if (trigger.dataset.deck) showDeck(trigger.dataset.deck);
  else if (deckKey && trigger.hasAttribute(`data-read-${deckKey}`)) exitDeck();
  else if (deckKey && (trigger.id === `${deckKey}-scene-next` || trigger.hasAttribute(`data-advance-${deckKey}`))) advanceDeck();
  else if (deckKey && trigger.id === `${deckKey}-scene-back`) advanceDeck(-1);
  else if (trigger.dataset.project) showProject(trigger.dataset.project);
  else if (trigger.dataset.additional) showAdditional(trigger.dataset.additional);
  else if (trigger.hasAttribute('data-return-floor')) returnToFloor();
  else if (trigger.dataset.stop && STOPS[trigger.dataset.stop]) {
    world.focus({ preventScroll: true });
    travelTo(STOPS[trigger.dataset.stop], trigger.dataset.stop);
  } else if (trigger.id === 'flow-next') advanceFlow();
});
const objectZones = {
  liners: [35, 48, 365, 297],
  stowguidance: [390, 100, 675, 302],
  portal: [705, 82, 875, 255],
  beams: [115, 317, 335, 525],
  ai: [625, 305, 865, 500],
};
function objectAt(target) {
  return Object.entries(objectZones).find(([, [left,top,right,bottom]]) => target.x>=left && target.x<=right && target.y>=top && target.y<=bottom)?.[0];
}
function worldPoint(event) {
  const rect = world.getBoundingClientRect();
  return { x: (event.clientX-rect.left)/rect.width*1000, y: (event.clientY-rect.top)/rect.height*667 };
}
world.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'mouse') world.style.cursor = objectAt(worldPoint(event)) ? 'pointer' : 'crosshair';
});
world.addEventListener('click', (event) => {
  if (event.target.closest('button')) return;
  const target = worldPoint(event);
  if (target.x >= 440 && target.x <= 560 && target.y >= 555) { walkOutside(); return; }
  const object = objectAt(target);
  const clickedStop = Object.entries(STOPS).find(([, p])=>Math.hypot(p.x-target.x,p.y-target.y)<42);
  world.focus({ preventScroll: true });
  travelTo(object ? STOPS[object] : clickedStop ? clickedStop[1] : target, object || (clickedStop ? clickedStop[0] : null));
});
// A click on the landing preview, away from its markers, enters the floor like Walk the floor.
$('.preview-art').addEventListener('click', (event) => { if (!event.target.closest('button')) enterWarehouse(); });
nearbyPrompt.addEventListener('click', () => { if (nearbyExit) showOutside(); else if (nearbyStop) showProject(nearbyStop, world); });
// Re-place the prompt when the map resizes or a translation changes the prompt's width.
const promptPlacement = new ResizeObserver(() => placeNearbyPrompt());
promptPlacement.observe(world);
promptPlacement.observe(nearbyPrompt);
const movementKeys = new Set(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d']);
world.addEventListener('keydown', (event) => {
  if (event.target !== world || dialog.open || event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key.toLowerCase();
  if (movementKeys.has(key)) {
    event.preventDefault();
    clearArrival();
    pendingStop = null;
    pendingExit = false;
    route = [];
    ring.hidden = true;
    highlightStop(null);
    keys.add(key);
    startLoop();
  } else if (event.key === 'Enter' && nearbyExit) {
    event.preventDefault();
    showOutside();
  } else if (event.key === 'Enter' && nearbyStop) {
    event.preventDefault();
    showProject(nearbyStop, world);
  } else if (event.key === 'Escape') {
    stopMotion();
    updateNearby();
    announcement.textContent = 'Walk stopped. Choose another destination when ready.';
  }
});
document.addEventListener('keyup', (event) => { keys.delete(event.key.toLowerCase()); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !active && !outsideActive && !dialog.open && event.target === document.body) enterWarehouse();
});
world.addEventListener('blur', () => { keys.clear(); });
window.addEventListener('blur', () => { keys.clear(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { keys.clear(); previousTime = 0; }
  else if (route.length && active && !dialog.open) startLoop();
});
$('.close-dialog').addEventListener('click', closeDialogOrDeck);
document.addEventListener('keydown', (event) => {
  if (!dialog.open || (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target.closest('input, select, textarea')) return;
  const control = dialogContent.querySelector(`.observation-actions [id$="-scene-${event.key === 'ArrowRight' ? 'next' : 'back'}"]`);
  if (!control || control.disabled) return;
  event.preventDefault();
  control.click();
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !dialog.open) return;
  if (event.repeat) { event.preventDefault(); return; }
  if (!deckReturns()) return;
  event.preventDefault();
  exitDeck();
});
dialog.addEventListener('cancel', (event) => { if (deckReturns()) { event.preventDefault(); exitDeck(); } });
dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) closeDialogOrDeck();
});
dialog.addEventListener('close', () => {
  setProjectUrl(null);
  document.body.classList.remove('dialog-open');
  updateNearby();
  if (active) announcement.textContent = progressMessage();
  if (dialogReturnFocus && dialogReturnFocus.isConnected && !dialogReturnFocus.closest('[hidden]')) dialogReturnFocus.focus({preventScroll:true});
  else if (outsideActive) courtController?.focus();
  else (active?world:$('#enter-button')).focus({preventScroll:true});
});
window.addEventListener('popstate', () => {
  if (linkedProject()) { showProject(linkedProject(), null, true); return; }
  if (dialog.open) dialog.close();
  if (location.hash === '#outside') showOutside(false);
  else if (location.hash === '#warehouse') enterWarehouse(true, false);
  else goHome(false);
});
if (location.hash === '#outside') showOutside(false);
else if (location.hash === '#warehouse') enterWarehouse(false, false);
else if (['#background', '#approach'].includes(location.hash)) showAbout();
else if (location.hash === '#work') showProjectMenu();
else if (linkedProject()) showProject(linkedProject(), null, true);
renderPosition();

window.addEventListener('portfolio-language-change', () => {
  updateImpactEstimate();
  updateOnboardingEstimate();
  updateSafetyEstimate('liners');
  updateSafetyEstimate('beams');
});
initI18n();
