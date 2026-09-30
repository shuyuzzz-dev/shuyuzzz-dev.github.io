// A small, deterministic arcade simulation. Only Shuyu and his direct recipient
// may score; eligibility is checked when the shot leaves the player's hands.
export const COURT = { width: 960, height: 640, left: 58, right: 902, top: 80, bottom: 546, hoops: [{x:86,y:306},{x:874,y:306}] };
export const PERFECT = { min: .9, max: 1.1, maxCharge: 1.5 };
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const formation=[[520,320],[685,145],[735,255],[735,425],[645,520],[590,340],[760,160],[795,270],[790,435],[700,525]];
export class BasketballGame {
  constructor(random=Math.random){this.random=random;this.reset();}
  reset(){
    this.players=formation.map(([x,y],id)=>({id,team:id<5?0:1,x,y,moving:false}));
    this.moveTarget=null;this.netReaction=null;
    this.controlled=0;this.owner=0;this.flight=null;this.eligibleReceiver=null;
    this.score=0;this.shuyuPoints=0;this.assists=0;this.stops=0;
    this.clock=24;this.possessionTime=0;this.running=false;this.paused=false;this.finished=false;
    this.charge=null;this.release=null;this.cooldown=0;this.time=0;this.message='Ready for a little pickup?';this.eventId=0;
  }
  get player(){return this.players[this.controlled];}
  get holder(){return this.owner===null?null:this.players[this.owner];}
  get legalShooter(){return this.owner===0 || (this.owner!==null && this.holder.team===0 && this.eligibleReceiver===this.owner);}
  say(message){this.message=message;this.eventId++;}
  start(){if(this.finished)this.reset();this.running=true;this.paused=false;this.say('Find your spot. Hold, then release.');}
  pause(){this.paused=true;this.charge=null;this.moveTarget=null;}
  resume(){if(this.running&&!this.finished)this.paused=false;}
  canAct(){return this.running&&!this.paused&&!this.finished;}
  guideTo(point){
    if(!this.canAct()||this.charge!==null||this.flight)return false;
    if(this.holder?.team===0)this.controlled=this.owner;
    this.moveTarget={x:clamp(point.x,COURT.left+16,COURT.right-16),y:clamp(point.y,COURT.top+25,COURT.bottom-10),playerId:this.controlled};
    return true;
  }
  beginShot(){
    if(!this.canAct()||this.flight||this.charge!==null)return false;
    if(this.owner!==this.controlled || this.holder?.team!==0){this.say('Get the ball first. Press E to steal when close.');return false;}
    this.moveTarget=null;this.charge=0;return true;
  }
  cancelShot(){this.charge=null;}
  releaseShot(){if(this.charge===null)return false;const duration=this.charge;this.charge=null;return this.shoot(duration);}
  shoot(duration,automatic=false){
    if(!this.canAct()||this.flight||this.owner===null)return false;
    const shooter=this.holder, hoop=COURT.hoops[shooter.team===0?1:0], d=distance(shooter,hoop);
    const legal=shooter.id===0 || (shooter.team===0&&this.eligibleReceiver===shooter.id);
    const perfect=duration>=PERFECT.min&&duration<=PERFECT.max;
    const nearest=Math.min(...this.players.filter(p=>p.team!==shooter.team).map(p=>distance(p,shooter)));
    const timing=Math.max(0,1-Math.abs(duration-1)/.52);
    const chance=perfect?(d<470?1:.48):clamp(timing*(d<200?.88:d<350?.7:.34)-(nearest<42?.17:0),.02,.9);
    const made=legal && this.random()<chance;
    const points=d>235?3:2;
    this.moveTarget=null;
    this.flight={type:'shot',t:0,duration:clamp(.65+d/550,.8,1.65),from:{x:shooter.x,y:shooter.y},to:{...hoop},shooter:shooter.id,legal,made,perfect,points};
    this.release={duration,perfect,legal,remaining:1.6};this.owner=null;this.eligibleReceiver=null;
    this.say(!legal?'No Shuyu, no bucket. House rules.':perfect?'Green release!':duration<.9?'Early release. Aim for green.':'Late release. Aim for green.');
    return true;
  }
  pass(targetId=null){
    if(!this.canAct()||this.flight||this.charge!==null)return false;
    if(this.holder?.team===1)return this.steal();
    if(!this.holder)return false;
    const from=this.holder;
    const options=this.players.filter(p=>p.team===0&&p.id!==from.id);
    const target=targetId===null?options.sort((a,b)=>distance(a,COURT.hoops[1])-distance(b,COURT.hoops[1]))[0]:options.find(p=>p.id===targetId);
    if(!target)return false;
    this.moveTarget=null;
    this.flight={type:'pass',t:0,duration:clamp(distance(from,target)/720,.18,.75),from:{x:from.x,y:from.y},to:{x:target.x,y:target.y},sender:from.id,receiver:target.id};
    this.owner=null;this.eligibleReceiver=null;
    this.say(from.id===0?'Shuyu’s pass. Your teammate can score.':target.id===0?'Back to Shuyu.':'Pass received. Get Shuyu involved to score.');
    return true;
  }
  switchToShuyu(){
    if(!this.canAct())return;
    if(this.holder?.team===0&&this.owner!==0&&!this.flight&&this.charge===null){this.pass(0);return;}
    this.moveTarget=null;this.controlled=0;this.charge=null;this.say('You’re controlling Shuyu.');
  }
  steal(){
    if(!this.canAct()||this.cooldown>0||this.flight||this.holder?.team!==1)return false;
    this.cooldown=.6;
    if(distance(this.player,this.holder)<82){this.takePossession(this.controlled);this.stops++;this.say('Stolen! Turn defense into a bucket.');return true;}
    this.say('Get closer to the ball handler to steal.');return false;
  }
  takePossession(id){this.moveTarget=null;this.owner=id;this.flight=null;this.eligibleReceiver=null;this.charge=null;this.clock=24;this.possessionTime=0;this.cooldown=1.2;if(id<5)this.controlled=id;}
  inbound(team){
    const id=team===0?0:5;
    this.takePossession(id);
    this.players[id].x=team===0?155:815;this.players[id].y=320;
    if(team===1)this.controlled=0;
    this.say(team===0?'Shuyu has the ball. Attack the right basket.':'They have the ball. Chase it down and press E to steal.');
  }
  finishFlight(){
    const f=this.flight;if(!f)return;
    if(f.type==='pass'){
      this.owner=f.receiver;this.controlled=f.receiver;this.eligibleReceiver=f.sender===0?f.receiver:null;this.flight=null;this.cooldown=.8;return;
    }
    if(f.made&&f.legal){
      this.netReaction={hoop:this.players[f.shooter].team===0?1:0,elapsed:0,duration:.95,points:f.points};
      this.score+=f.points;if(f.shooter===0)this.shuyuPoints+=f.points;else this.assists++;
      this.say(f.shooter===0?(f.points===3?'Shuyu for three!':'Shuyu gets the bucket!'):'Bucket! That’s a Shuyu assist.');
      if(this.score>=21){this.flight=null;this.owner=null;this.finished=true;this.running=false;this.say('21! A little teamwork. A lot of Shuyu.');return;}
      this.flight={type:'inbound',t:0,duration:1.25,nextTeam:1,from:f.to,to:{x:f.to.x-20,y:f.to.y+34}};return;
    }
    if(this.players[f.shooter].team===1){
      this.say('Their shot doesn’t count. This is Shuyu’s court.');
      this.flight={type:'inbound',t:0,duration:1.25,nextTeam:0,from:f.to,to:f.to};
    }else{
      this.say(f.legal?'Off the rim. Get back on defense.':'No Shuyu pass, no points. Get him the ball.');
      // Give missed shots a visible bounce before possession changes.
      this.flight={type:'inbound',t:0,duration:1.1,nextTeam:1,from:f.to,to:{x:f.to.x-55,y:f.to.y+45}};
    }
  }
  move(player,target,speed,dt){
    const dx=target.x-player.x,dy=target.y-player.y,d=Math.hypot(dx,dy);
    if(d<3){player.moving=false;return;}
    const step=Math.min(d,speed*dt);player.x+=dx/d*step;player.y+=dy/d*step;player.moving=true;
  }
  step(dt,input={x:0,y:0}){
    dt=clamp(dt,0,.05);
    if(this.paused)return;
    if(this.netReaction){this.netReaction.elapsed+=dt;if(this.netReaction.elapsed>=this.netReaction.duration)this.netReaction=null;}
    if(!this.canAct())return;
    this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);
    if(this.release){this.release.remaining-=dt;if(this.release.remaining<=0)this.release=null;}
    if(this.charge!==null){this.charge+=dt;if(this.charge>=1.65)this.releaseShot();}
    for(const p of this.players)p.moving=false;
    const mag=Math.hypot(input.x||0,input.y||0);
    if(mag)this.moveTarget=null;
    if(mag&&this.charge===null)this.move(this.player,{x:this.player.x+(input.x||0)/mag*100,y:this.player.y+(input.y||0)/mag*100},215,dt);
    if(!mag&&this.moveTarget&&this.charge===null){
      if(this.moveTarget.playerId!==this.controlled)this.moveTarget=null;
      else {this.move(this.player,this.moveTarget,215,dt);if(distance(this.player,this.moveTarget)<3)this.moveTarget=null;}
    }
    if(this.flight){
      const f=this.flight;f.t+=dt;
      if(f.type==='pass'){const receiver=this.players[f.receiver];f.to={x:receiver.x,y:receiver.y};}
      if(f.t>=f.duration){if(f.type==='inbound')this.inbound(f.nextTeam);else this.finishFlight();}
    }else if(this.holder){
      this.clock=Math.max(0,this.clock-dt);this.possessionTime+=dt;
      if(this.clock<=0){this.inbound(this.holder.team===0?1:0);this.say('Shot clock. Change of possession.');}
    }
    const offense=this.holder?.team ?? ((this.flight?.shooter ?? this.flight?.sender ?? 0)<5?0:1);
    const owner=this.holder;
    for(const p of this.players){
      if(p.id===this.controlled)continue;
      if(this.charge!==null&&p.id===this.owner)continue;
      let target,speed=105;
      if(p.id===this.owner&&p.team===1){target={x:175,y:320+Math.sin(this.time*1.2)*70};speed=100;}
      else if(p.team===offense){
        const lane=p.id%5;
        const y=[320,135,245,435,520][lane];
        const advance=offense===0?clamp((owner?.x??550)+140,430,760):clamp((owner?.x??450)-140,190,520);
        target={x:advance+(lane%2? -55:25),y};speed=105;
      }else{
        const mark=this.players[(p.id+5)%10];
        const basket=COURT.hoops[p.team===0?0:1];
        const offset=mark.x<basket.x?48:-48;
        target={x:mark.x+offset,y:mark.y+(p.id%2?12:-12)};speed=p.team===1?86:112;
      }
      if(target)this.move(p,target,speed,dt);
    }
    // Resolve small overlaps without pushing the controlled player off their path.
    for(let i=0;i<10;i++)for(let j=i+1;j<10;j++){
      const a=this.players[i],b=this.players[j],d=distance(a,b);
      if(d<25&&d>.01){const push=(25-d)*.3,dx=(a.x-b.x)/d*push,dy=(a.y-b.y)/d*push;if(a.id!==this.controlled){a.x+=dx;a.y+=dy;}if(b.id!==this.controlled){b.x-=dx;b.y-=dy;}}
    }
    for(const p of this.players){p.x=clamp(p.x,COURT.left+16,COURT.right-16);p.y=clamp(p.y,COURT.top+25,COURT.bottom-10);}
    if(this.holder?.team===1&&!this.flight){
      const h=this.holder;
      if(distance(h,COURT.hoops[0])<155 || this.possessionTime>8)this.shoot(.8+this.random()*.4,true);
    }
    if(this.holder?.team===0&&this.charge===null&&this.cooldown===0&&!this.flight){
      const defender=this.players.find(p=>p.team===1&&distance(p,this.holder)<25);
      if(defender&&this.random()<dt*.7){this.takePossession(defender.id);this.controlled=0;this.say('Turnover. Win it back!');}
    }
  }
}
