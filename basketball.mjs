import { BasketballGame, COURT, PERFECT } from './basketball-engine.mjs';
import { drawBasketball } from './basketball-renderer.mjs';
import { getLocale } from './i18n.mjs';
import { translate } from './i18n-core.mjs';

export function mountBasketball() {
  const root=document.querySelector('#outside');
  const $=s=>root.querySelector(s);
  const canvas=$('#basketball-canvas'),ctx=canvas.getContext('2d');
  const game=new BasketballGame(),assets={};
  const keys=new Set(),directions=new Map();
  let visible=false,loaded=false,failed=false,raf=null,previous=0,lastHUD=0,lastEvent=-1;
  let pointerShot=null,keyboardShot=false,overlayState='',lastStatus='';
  const t=text=>translate(text,getLocale());
  const write=(selector,value)=>{const el=$(selector),text=String(value);if(el.textContent!==text)el.textContent=text;};
  const image=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});
  const ready=Promise.all([image('assets/basketball-court.png'),image('assets/basketball-players.png')]).then(([court,players])=>{
    assets.court=court;assets.players=players;loaded=true;if(visible){draw();hud(true);}
  }).catch(()=>{failed=true;if(visible)hud(true);});
  function draw(){if(ctx&&loaded)drawBasketball(ctx,game,assets);}
  function clearInput(){keys.clear();directions.clear();pointerShot=null;keyboardShot=false;game.cancelShot();game.moveTarget=null;root.querySelectorAll('[data-court-direction]').forEach(el=>el.classList.remove('is-held'));}
  function pause(){if(!visible)return;clearInput();if(game.running||game.finished)game.pause();if(raf!==null)cancelAnimationFrame(raf);raf=null;previous=0;hud(true);draw();}
  function focus(){canvas.focus({preventScroll:true});}
  function hud(force=false){
    root.classList.toggle('court-focused',game.running||game.finished);
    const nextOverlay=!loaded?(failed?'error':'loading'):game.finished?(game.netReaction&&!game.paused?'playing':'finished'):!game.running?'start':game.paused?'paused':'playing';
    if(force||nextOverlay!==overlayState){
      overlayState=nextOverlay;
      $('#court-overlay').hidden=overlayState==='playing';
      const title={error:'The court artwork could not load. Try reloading this page.',loading:'Loading the court…',start:'Grab a ball. Join the run.',paused:'Game paused',finished:'21! A little teamwork. A lot of Shuyu.'}[overlayState];
      write('#court-overlay-title',t(title||'Grab a ball. Join the run.'));
      write('#court-start',t(game.finished?'Play again':game.running?'Resume game':'Start pickup'));
      $('#court-start').disabled=!loaded;
      $('#court-pause').disabled=!game.running||game.finished;
      write('#court-pause',t(game.paused?'Resume game':'Pause'));
    }
    write('#court-score',game.score);write('#court-shuyu-points',game.shuyuPoints);write('#court-assists',game.assists);write('#court-clock',Math.ceil(game.clock));
    const status=game.flight?'Ball in flight':game.holder?.team===1?'Get back on defense':game.owner===0?'Shuyu can score':game.legalShooter?'Assist unlocked':'Needs Shuyu’s pass';
    if(force||status!==lastStatus){write('#court-possession',t(status));lastStatus=status;}
    if(force||lastEvent!==game.eventId){write('#court-message',t(game.message));lastEvent=game.eventId;}
    const duration=game.charge??game.release?.duration??0;
    $('#shot-meter').setAttribute('aria-valuenow',String(Math.round(Math.min(duration,PERFECT.maxCharge)*1000)));
    $('#shot-meter').setAttribute('aria-valuetext',t(game.charge!==null?'Release in green · about 1 second':game.release?.perfect?'Green release!':'Hold to shoot'));
    $('#court-shoot').disabled=!game.canAct()||game.owner!==game.controlled||game.holder?.team!==0;
    $('#court-pass').disabled=!game.canAct()||!!game.flight;
    $('#court-shuyu').disabled=!game.canAct();
  }
  function frame(now){
    raf=null;if(!visible)return;
    const dt=previous?Math.min((now-previous)/1000,.05):0;previous=now;
    const held=new Set([...keys,...directions.values()]);
    game.step(dt,{x:Number(held.has('arrowright')||held.has('d'))-Number(held.has('arrowleft')||held.has('a')),y:Number(held.has('arrowdown')||held.has('s'))-Number(held.has('arrowup')||held.has('w'))});
    draw();
    const duration=game.charge??game.release?.duration??0;
    $('#shot-meter-fill').style.width=`${Math.min(duration/PERFECT.maxCharge,1)*100}%`;
    $('#shot-meter').classList.toggle('is-green',duration>=PERFECT.min&&duration<=PERFECT.max);
    $('#court-timing').classList.toggle('is-charging',game.charge!==null);
    if(now-lastHUD>100||lastEvent!==game.eventId||game.finished&&!game.netReaction){hud();lastHUD=now;}
    if(visible&&(game.canAct()||game.netReaction&&!game.paused))raf=requestAnimationFrame(frame);
  }
  function run(){if(visible&&raf===null){previous=0;raf=requestAnimationFrame(frame);}}
  function start(){if(!loaded)return;clearInput();game.finished?game.start():game.paused?game.resume():game.start();focus();hud(true);run();}
  function point(event){const r=canvas.getBoundingClientRect();return{x:(event.clientX-r.left)/r.width*COURT.width,y:(event.clientY-r.top)/r.height*COURT.height};}
  function shotDown(event){
    if(event.button!==0||pointerShot!==null||keyboardShot||!game.canAct())return;
    event.preventDefault();focus();
    if(game.beginShot()){pointerShot=event.pointerId;event.currentTarget.setPointerCapture?.(event.pointerId);hud(true);}
  }
  function shotUp(event){if(event.pointerId!==pointerShot)return;event.preventDefault();pointerShot=null;game.releaseShot();hud(true);}
  function shotCancel(event){if(event.pointerId===pointerShot){pointerShot=null;game.cancelShot();hud(true);}}
  for(const el of [$('#court-shoot')]){
    el.addEventListener('pointerdown',shotDown);el.addEventListener('pointerup',shotUp);el.addEventListener('pointercancel',shotCancel);el.addEventListener('lostpointercapture',shotCancel);
    el.addEventListener('contextmenu',event=>event.preventDefault());
  }
  // Court taps set a destination. The dedicated shoot button owns shot gestures.
  canvas.addEventListener('pointerdown',event=>{
    if(event.button!==0||!game.canAct())return;
    event.preventDefault();focus();game.guideTo(point(event));hud(true);
  });
  canvas.addEventListener('contextmenu',event=>event.preventDefault());
  const movement=new Set(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d']);
  document.addEventListener('keydown',event=>{
    if(!visible||document.querySelector('#project-dialog').open||event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.target.closest('select,input,textarea,a')||(!root.contains(event.target)&&event.target!==document.body))return;
    const key=event.key.toLowerCase();
    if(key==='escape'||key==='p'){event.preventDefault();if(!event.repeat){game.paused?start():pause();}return;}
    // Native buttons keep their Enter/Space behavior; the canvas is the keyboard play surface.
    if(event.target.closest('button')&&key===' '&&event.target.id!=='court-shoot')return;
    if(!game.canAct())return;
    if(movement.has(key)){event.preventDefault();keys.add(key);}
    else if(key===' '){event.preventDefault();if(!event.repeat&&pointerShot===null&&game.beginShot())keyboardShot=true;}
    else if(key==='e'&&!event.repeat){event.preventDefault();game.pass();}
    else if(key==='q'&&!event.repeat){event.preventDefault();game.switchToShuyu();}
    hud();
  });
  document.addEventListener('keyup',event=>{keys.delete(event.key.toLowerCase());if(event.key===' '&&keyboardShot){event.preventDefault();keyboardShot=false;game.releaseShot();hud(true);}});
  root.querySelectorAll('[data-court-direction]').forEach(button=>{
    button.addEventListener('pointerdown',event=>{if(event.button!==0||!game.canAct())return;event.preventDefault();directions.set(event.pointerId,button.dataset.courtDirection);button.classList.add('is-held');button.setPointerCapture?.(event.pointerId);});
    const clear=event=>{directions.delete(event.pointerId);button.classList.remove('is-held');};
    for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,clear);
    // Keyboard users use arrow keys on the focused court, avoiding simulated clicks.
  });
  $('#court-start').addEventListener('click',start);
  $('#court-pause').addEventListener('click',()=>{game.paused?start():pause();});
  $('#court-restart').addEventListener('click',()=>{clearInput();game.reset();if(loaded)game.start();focus();hud(true);run();});
  $('#court-pass').addEventListener('click',()=>{game.pass();focus();hud(true);});
  $('#court-shuyu').addEventListener('click',()=>{game.switchToShuyu();focus();hud(true);});
  window.addEventListener('blur',pause);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.addEventListener('portfolio-language-change',()=>{if(visible)hud(true);});
  return {
    ready,
    show(){visible=true;clearInput();hud(true);draw();run();focus();},
    hide(){visible=false;clearInput();if(game.running||game.finished)game.pause();if(raf!==null)cancelAnimationFrame(raf);raf=null;previous=0;},
    pause,
    focus
  };
}
