import { COURT } from './basketball-engine.mjs';
const sprites=[[[120,78,311,419],[139,553,264,418]],[[621,74,309,424],[637,548,281,423]],[[1131,74,312,423],[1148,553,290,418]]];
export function drawBasketball(ctx,game,assets){
  if(!ctx)return;
  ctx.save();ctx.clearRect(0,0,960,640);ctx.fillStyle='#102e38';ctx.fillRect(0,0,960,640);
  ctx.imageSmoothingEnabled=false;
  if(assets.court?.width)ctx.drawImage(assets.court,0,0,960,640);
  // Animate the existing net artwork inside the fixed rim when a valid shot lands.
  if(game.netReaction&&assets.court?.width){
    const reaction=game.netReaction,h=COURT.hoops[reaction.hoop],t=reaction.elapsed/reaction.duration;
    const pulse=Math.sin(t*Math.PI*5)*Math.exp(-t*3),scale=assets.court.width/COURT.width;
    ctx.save();ctx.beginPath();ctx.arc(h.x,h.y,14.5,0,Math.PI*2);ctx.clip();
    // Resample strips of the original net to create a swish with a stationary rim.
    for(let y=-16;y<16;y+=2){
      const bend=pulse*(1-Math.abs(y)/17),shift=bend*8;
      ctx.drawImage(assets.court,(h.x-16)*scale,(h.y+y-shift)*scale,32*scale,2*scale,h.x-16+bend*3,h.y+y,32,2.1);
    }
    ctx.restore();ctx.globalAlpha=Math.max(0,1-t);ctx.font='bold 22px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ceffb4';ctx.fillText('+'+reaction.points,h.x-28,h.y-30-t*30);ctx.globalAlpha=1;
  }
  if(game.moveTarget){
    const target=game.moveTarget;ctx.strokeStyle='#ffe6a4';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(game.player.x,game.player.y);ctx.lineTo(target.x,target.y);ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();ctx.ellipse(target.x,target.y,13,6,0,0,Math.PI*2);ctx.stroke();
  }
  // Floor rings indicate control and the scoring rule, not decorative artwork.
  for(const p of [...game.players].sort((a,b)=>a.y-b.y)){
    const controlled=p.id===game.controlled;
    const eligible=p.id===0||p.id===game.eligibleReceiver;
    ctx.beginPath();ctx.ellipse(p.x,p.y+1,19,7,0,0,Math.PI*2);
    ctx.fillStyle=controlled?'#a5f5be44':'#001c2966';ctx.fill();
    if(controlled||eligible&&p.id!==0){ctx.strokeStyle=controlled?'#fff5bb':'#91ffc5';ctx.lineWidth=controlled?3:2;ctx.stroke();}
    const kind=p.id===0?0:p.team===0?1:2;
    const pose=p.moving&&Math.floor(game.time*9)%2?1:0;
    const [sx,sy,sw,sh]=sprites[kind][pose],h=57,w=sw/sh*h;
    if(assets.players?.width)ctx.drawImage(assets.players,sx,sy,sw,sh,p.x-w/2,p.y-h,w,h);
    ctx.font='bold 12px sans-serif';ctx.textAlign='center';
    const label=p.id===0?'SHUYU':String(p.id<5?p.id+1:p.id-4);
    const tw=ctx.measureText(label).width;ctx.fillStyle='#091620dd';ctx.fillRect(p.x-tw/2-5,p.y-h-18,tw+10,16);
    ctx.fillStyle=p.id===0?'#ffc17d':p.team===0?'#a8f5dc':'#d5b9ff';ctx.fillText(label,p.x,p.y-h-6);
    if(p.id===game.eligibleReceiver&&p.id!==0){ctx.fillStyle='#b5ffd4';ctx.font='bold 15px sans-serif';ctx.fillText('★',p.x+23,p.y-37);}
  }
  let bx,by,z=0;
  if(game.holder){bx=game.holder.x+15;by=game.holder.y-15-Math.abs(Math.sin(game.time*9))*7;}
  else if(game.flight){const f=game.flight,t=Math.min(1,f.t/f.duration);bx=f.from.x+(f.to.x-f.from.x)*t;by=f.from.y+(f.to.y-f.from.y)*t;z=Math.sin(t*Math.PI)*(f.type==='shot'?100:f.type==='pass'?15:22);}
  if(bx!==undefined){
    ctx.fillStyle='#071a2366';ctx.beginPath();ctx.ellipse(bx,by+8,8,3,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffae57';ctx.strokeStyle='#4d2819';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(bx,by-z,7,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(bx-7,by-z);ctx.lineTo(bx+7,by-z);ctx.moveTo(bx,by-z-7);ctx.lineTo(bx,by-z+7);ctx.stroke();
  }
  // An unmistakable, functional aim target follows the actual hoop coordinate.
  if(game.charge!==null){const h=COURT.hoops[1];ctx.strokeStyle='#c6efa7';ctx.lineWidth=2;ctx.setLineDash([4,5]);ctx.beginPath();ctx.arc(h.x,h.y,22,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();
}
