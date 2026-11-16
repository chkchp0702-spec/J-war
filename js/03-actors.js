"use strict";
/* ===== J war — 캐릭터 · 피해 · 사격 · 로켓 · 봇 AI ===== */
const ACT = [], PROJ = [], PICK = [];
let P = null, AID = 0;

/* ---------- 캐릭터 모양 (블록 영웅 / 로봇) ---------- */
function makeLabel(txt,col){ const c=document.createElement("canvas"); c.width=256; c.height=64; const x=c.getContext("2d");
  x.font="900 34px 'Malgun Gothic',sans-serif"; x.textAlign="center"; x.textBaseline="middle"; x.lineWidth=7; x.strokeStyle="rgba(0,0,0,.85)"; x.strokeText(txt,128,34); x.fillStyle=col; x.fillText(txt,128,34);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthWrite:false})); s.scale.set(1.9,.475,1); return s; }
function makeAvatar(o){ const g=new THREE.Group(), rb=!!o.robot;
  const body=new THREE.MeshLambertMaterial({color:o.col}), dark=new THREE.MeshLambertMaterial({color:rb?0x37474f:0x263238}), skin=new THREE.MeshLambertMaterial({color:rb?0x90a4ae:0xffd9b3});
  const mk=(w,h,d,m,x,y,z,par)=>{ const me=new THREE.Mesh(UNIT,m); me.scale.set(w,h,d); me.position.set(x,y,z); (par||g).add(me); return me; };
  const piv=(x,y,z)=>{ const p=new THREE.Group(); p.position.set(x,y,z); g.add(p); return p; };
  mk(.62,.6,.34,body,0,.95,0); mk(.64,.12,.36,dark,0,.68,0);
  const headG=piv(0,1.27,0); mk(.46,.46,.46,skin,0,.25,0,headG);
  if(rb){ mk(.34,.09,.03,matB(o.eye||0xff1744),0,.3,-.235,headG); mk(.05,.2,.05,dark,0,.58,0,headG); mk(.1,.1,.1,matB(o.eye||0xff1744),0,.7,0,headG); }
  else { mk(.09,.1,.03,matB(0x1a1a1a),-.11,.3,-.235,headG); mk(.09,.1,.03,matB(0x1a1a1a),.11,.3,-.235,headG); mk(.2,.04,.03,matB(0x7a3b2e),0,.14,-.235,headG); }
  const h=o.hat||0, gold=matB(0xffd600);
  if(h===1){ mk(.5,.14,.5,body,0,.55,0,headG); mk(.5,.05,.25,body,0,.5,-.34,headG); }
  else if(h===2){ mk(.48,.1,.48,gold,0,.53,0,headG); [-.17,0,.17].forEach(x=>mk(.1,.14,.1,gold,x,.63,-.17,headG)); [-.17,.17].forEach(x=>mk(.1,.14,.1,gold,x,.63,.17,headG)); }
  else if(h===3){ [-.17,.17].forEach(x=>{ const c=new THREE.Mesh(new THREE.ConeGeometry(.07,.24,6),matB(0xd50000)); c.position.set(x,.6,0); headG.add(c); }); }
  else if(h===4){ mk(.04,.3,.04,dark,0,.63,0,headG); mk(.11,.11,.11,matB(0x00e5ff),0,.8,0,headG); }
  else if(h===5){ const t=new THREE.Mesh(new THREE.TorusGeometry(.2,.035,6,16),gold); t.rotation.x=Math.PI/2; t.position.y=.68; headG.add(t); }
  else if(h===6){ mk(.6,.05,.6,dark,0,.5,0,headG); mk(.4,.3,.4,dark,0,.67,0,headG); }
  const legL=piv(-.16,.62,0), legR=piv(.16,.62,0); mk(.26,.62,.28,dark,0,-.31,0,legL); mk(.26,.62,.28,dark,0,-.31,0,legR);
  const armL=piv(-.42,1.2,0), armR=piv(.42,1.2,0); mk(.2,.56,.2,body,0,-.24,0,armL); mk(.2,.56,.2,body,0,-.24,0,armR);
  let gun=null; if(!o.melee){ const w=WEAPONS[o.wkey||"rifle"]; gun=mk(.11,w.len*1.1,.15,matB(w.col),0,-.5-w.len*.35,-.02,armR); mk(.08,.1,.2,dark,0,-.42,.1,armR); }
  const sh=new THREE.Mesh(new THREE.CircleGeometry(.5,14),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.28,depthWrite:false})); sh.rotation.x=-Math.PI/2; sh.position.y=.025; g.add(sh);
  const label=makeLabel(o.name||"",o.lcol||"#fff"); label.position.y=2.28; g.add(label);
  const bar=new THREE.Sprite(new THREE.SpriteMaterial({color:0x111111,depthWrite:false})); bar.scale.set(1.04,.13,1); bar.position.y=2.02; g.add(bar);
  const fill=new THREE.Sprite(new THREE.SpriteMaterial({color:o.fcol||0xff5252,depthWrite:false})); fill.scale.set(1,.09,1); fill.position.set(0,2.02,0); fill.renderOrder=2; g.add(fill);
  g.scale.setScalar(o.scale||1); g.rotation.order="YXZ"; g.traverse(m=>{ if(m.isMesh&&m!==sh) m.castShadow=true; }); sh.visible=!renderer.shadowMap.enabled;
  return {g,headG,legL,legR,armL,armR,gun,mats:[body,skin,dark],label,bar,fill}; }

function newActor(o){ const a=Object.assign({id:"a"+(++AID),name:"",team:0,pos:V3(),vel:V3(),yaw:0,pitch:0,scale:1,hp:100,maxhp:100,alive:true,ground:false,wall:false,
    inv:0,slowT:0,hurtT:0,walk:0,kick:0,isBot:false,remote:false,wkey:"rifle",kills:0,deaths:0,streak:0,dmgMul:1,fAcc:0,fT:0,speed:5.7},o);
  a.r=.38*a.scale; a.h=1.75*a.scale;
  if(!o.noAv){ a.av=makeAvatar({col:a.col||0x2979ff,hat:a.hat,robot:a.robot,eye:a.eye,melee:a.melee,wkey:a.wkey,name:a.name,scale:a.scale,lcol:a.lcol,fcol:a.fcol}); a.av.g.position.copy(a.pos); actG.add(a.av.g); }
  ACT.push(a); return a; }
function removeActor(a){ const i=ACT.indexOf(a); if(i>=0) ACT.splice(i,1); if(a.av){ actG.remove(a.av.g); a.av.mats.forEach(m=>m.dispose()); a.av.label.material.map.dispose(); a.av.label.material.dispose(); a.av.bar.material.dispose(); a.av.fill.material.dispose(); } }
function clearActors(){ while(ACT.length) removeActor(ACT[0]); P=null; for(const p of PROJ) fxG.remove(p.m); PROJ.length=0; for(const p of PICK) fxG.remove(p.m); PICK.length=0; }
function hostile(a,b){ return a!==b && a.team!==b.team; }
function eyeOf(a,out){ return out.set(a.pos.x,a.pos.y+1.52*a.scale,a.pos.z); }
function dirFrom(yaw,pitch,out){ const cp=Math.cos(pitch); return out.set(-Math.sin(yaw)*cp,Math.sin(pitch),-Math.cos(yaw)*cp); }

function updateAvatar(a,dt){ const v=a.av; if(!v) return; if(!a.alive){ if(a.deadT>0){ a.deadT-=dt; const k=1-a.deadT/.6; v.g.visible=true; v.g.rotation.x=Math.min(1.5,k*2.4); v.g.position.y=a.pos.y-Math.max(0,k-.7)*2.5; v.label.visible=v.bar.visible=v.fill.visible=false; } else v.g.visible=false; return; }
  v.g.visible=!(a.inv>0&&Math.floor(a.inv*10)%2===0); v.label.visible=true; v.g.rotation.x=0; v.g.scale.y=a.scale*(a.hsc||1);
  v.g.position.copy(a.pos); v.g.rotation.y=a.yaw; const sp=Math.hypot(a.vel.x,a.vel.z); a.walk+=dt*sp*2.3; const sw=Math.sin(a.walk)*Math.min(1,sp/4)*.75;
  v.legL.rotation.x=sw; v.legR.rotation.x=-sw; v.headG.rotation.x=a.pitch*.7; if(a.kick>0) a.kick=Math.max(0,a.kick-dt*7);
  if(a.melee){ v.armL.rotation.x=-sw+a.kick*2; v.armR.rotation.x=sw+a.kick*2; } else { v.armR.rotation.x=Math.PI/2+a.pitch+a.kick*.25; v.armL.rotation.x=Math.PI/2+a.pitch-.1; v.armL.rotation.z=-.45; }
  if(a.hurtT>0){ a.hurtT-=dt; const e=a.hurtT>0?.75:0; v.mats.forEach(m=>m.emissive.setScalar(e)); }
  else if(a.slowT>0) v.mats[0].emissive.setRGB(0,.25,.45); else if(v.mats[0].emissive.b>0) v.mats[0].emissive.setScalar(0);
  const show=!!P&&hostile(a,P); v.bar.visible=v.fill.visible=show; if(show) v.fill.scale.x=Math.max(.001,a.hp/a.maxhp); }

/* ---------- 피해 ---------- */
const _fp = V3();
function hitFeedback(t,amt,info){ if(P&&!(P.supT>0)) P.sup=Math.min(100,P.sup+amt*.3); t.fAcc+=amt; t.hurtT=.12; if(info.head) t.fHead=1;
  if(performance.now()-t.fT>110){ t.fT=performance.now(); _fp.set(t.pos.x,t.pos.y+1.9*t.scale,t.pos.z); floatText(_fp,String(Math.round(t.fAcc)),t.fHead?"#ffd740":"#fff",t.fHead?22:17,.7); t.fAcc=0;
    if(t.fHead) SFX.head(); else SFX.hit(); UI.hitmark(t.fHead?"h":""); t.fHead=0; } }
function damage(t,amt,by,info){ info=info||{}; if(!t.alive) return;
  if(t.remote){ if(by===P&&!(t.inv>0)&&M.phase==="play"){ NET.send({t:"hit",to:t.id,d:Math.round(amt*10)/10,h:info.head?1:0,w:info.w||"",s:info.slow||0}); hitFeedback(t,amt,info); } return; }
  if(t.inv>0||M.phase!=="play") return;
  if(t===P&&by&&by.isBot) amt*=M.botDmg||1; else if(M.type==="gun"&&t.isBot&&by&&by.isBot) amt*=.5;
  t.hp-=amt; t.hurtT=.14; t.regenT=4; t.lastBy=by; if(info.slow) t.slowT=Math.max(t.slowT,info.slow);
  if(by&&by!==t&&t.isBot){ const dx=t.pos.x-by.pos.x, dz=t.pos.z-by.pos.z, l=Math.hypot(dx,dz)||1, kb=Math.min(3.5,amt*.05)/t.scale; t.vel.x+=dx/l*kb; t.vel.z+=dz/l*kb; }
  if(by===P) hitFeedback(t,amt,info);
  if(t===P) UI.hurt(by,amt);
  if(t.hp<=0) kill(t,by,info); }
function kill(t,by,info){ t.alive=false; t.hp=0; t.deadT=.6; t.deaths++; t.streak=0; _fp.set(t.pos.x,t.pos.y+1*t.scale,t.pos.z);
  burst(_fp,t.col||0xffffff,16,7,.24,.9,14); burst(_fp,0xffd740,8,5,.14,.7,8);
  if(by&&by!==t){ by.kills++; by.streak++; }
  if(by===P){ SFX.kill(); SFX.thump(); hitStop(.07); FX.shake=Math.max(FX.shake,.28); UI.hitmark("k"); _fp.y+=1.2; floatText(_fp,info&&info.head?"헤드샷 아웃!":"아웃!",info&&info.head?"#ffd740":"#ff8a80",24,1.1); }
  M.onKill(t,by,info||{}); }

/* ---------- 사격 ---------- */
const _d = V3(), _e = V3(), _m = V3(), _o2 = V3();
function muzzleOf(a,out){ const s=Math.sin(a.yaw), c=Math.cos(a.yaw);
  if(a===P){ dirFrom(a.yaw,a.pitch,out).multiplyScalar(.55); out.x+=camera.position.x+c*.2; out.y+=camera.position.y-.16; out.z+=camera.position.z-s*.2; }
  else { out.set(a.pos.x+c*.35*a.scale-s*.7*a.scale, a.pos.y+1.22*a.scale, a.pos.z-s*.35*a.scale-c*.7*a.scale); }
  return out; }
function volAt(pos){ if(!P) return 0; return clamp(1-P.pos.distanceTo(pos)/50,0,.85); }
/* o: 눈 위치, dir: 겨눈 방향. opt.sm 퍼짐 배율, opt.visual 보여 주기만(온라인 상대 총알) */
function shoot(a,wkey,o,dir,opt){ opt=opt||{}; const w=WEAPONS[wkey]; a.kick=1; SFX.shoot(wkey,a===P?1:volAt(a.pos)); muzzleOf(a,_m);
  if(w.proj){ spawnProj(a,wkey,_m.clone(),dir.clone(),opt.visual); return; }
  const n=w.pel||1, mag=a===P?(TOUCH?1.5:1.12):1;
  for(let i=0;i<n;i++){ _d.copy(dir); const sp=w.spread*(opt.sm||1); if(sp>0){ _d.x+=rnd(-sp,sp); _d.y+=rnd(-sp,sp)*.8; _d.z+=rnd(-sp,sp); _d.normalize(); }
    let t=rayWorld(o,_d,w.range), hit=null, head=false;
    for(const b of ACT){ if(!b.alive||!hostile(a,b)) continue; const r=rayActor(o,_d,b,mag); if(r&&r.t<t){ t=r.t; hit=b; head=r.head; } }
    _e.copy(o).addScaledVector(_d,t); tracer(_m,_e,w.col,w.beam?.07:(wkey==="sniper"?.09:.035),w.beam?.07:.1); if(M.type==="paint") paintAt(_e.x,_e.z,w.pel?1.4:2.1,a.team);
    if(hit){ if(!opt.visual){ let dmg=w.dmg*(a.dmgMul||1)*(opt.dm||1); if(w.pel) dmg*=clamp(1.3-t/w.range,.35,1); if(head) dmg*=HEAD_MUL*(a.headMul||1); damage(hit,dmg,a,{head,w:wkey,slow:w.slow}); }
      burst(_e,head?0xffd740:0xffffff,3,3,.08,.3); if(w.slow) burst(_e,0x80deea,2,2,.1,.4,2); }
    else if(t<w.range) burst(_e,w.col,2,2.5,.07,.25); } }
function spawnProj(a,wkey,pos,dir,visual){ const w=WEAPONS[wkey]; const m=new THREE.Mesh(UNIT,matB(w.grav?w.col:0xfff176)); if(w.grav) m.scale.set(.26,.26,.26); else m.scale.set(.16,.16,.55); m.position.copy(pos); _e.copy(pos).add(dir); m.lookAt(_e); fxG.add(m);
  PROJ.push({a,wkey,pos,dir,spd:w.proj,life:3.5,m,visual:!!visual,tr:0,grav:w.grav||0}); }
function explode(p,pt){ const w=WEAPONS[p.wkey]; boomFx(pt,w.splash); if(M.type==="paint"&&p.a) paintAt(pt.x,pt.z,w.splash*.8,p.a.team); SFX.boom(P?clamp(1.1-P.pos.distanceTo(pt)/45,0,1):0);
  if(P&&P.alive){ const d=P.pos.distanceTo(pt); if(d<14) FX.shake=Math.max(FX.shake,.6*(1-d/14)); }
  for(const b of ACT.slice()){ if(!b.alive) continue; _o2.set(b.pos.x,b.pos.y+.9*b.scale,b.pos.z); const d=_o2.distanceTo(pt); if(d>=w.splash+b.r) continue; const k=1-clamp(d/w.splash,0,1)*.75;
    if(!b.remote&&(b===p.a||!p.visual)){ _o2.sub(pt).normalize(); const self=b===p.a; b.vel.x+=_o2.x*(self?11:8)*k; b.vel.z+=_o2.z*(self?11:8)*k; b.vel.y+=(self?9.5:5)*k; b.ground=false; }
    if(p.visual) continue;
    if(b===p.a) damage(b,16*k,null,{w:p.wkey,self:1}); else if(hostile(p.a,b)) damage(b,w.dmg*k*(p.a.dmgMul||1),p.a,{w:p.wkey}); } }
function updateProj(dt){ for(let i=PROJ.length-1;i>=0;i--){ const p=PROJ[i]; if(p.grav){ p.dir.multiplyScalar(p.spd); p.dir.y-=p.grav*dt; p.spd=p.dir.length(); p.dir.multiplyScalar(1/p.spd); p.m.rotation.x+=dt*9; } const step=p.spd*dt; let t=rayWorld(p.pos,p.dir,step), hit=t<step;
    for(const b of ACT){ if(!b.alive||!hostile(p.a,b)) continue; const r=rayActor(p.pos,p.dir,b,1.25); if(r&&r.t<=t){ t=r.t; hit=true; } }
    p.life-=dt; if(hit||p.life<=0){ _e.copy(p.pos).addScaledVector(p.dir,Math.max(0,t-.05)); explode(p,_e.clone()); fxG.remove(p.m); PROJ.splice(i,1); continue; }
    p.pos.addScaledVector(p.dir,step); p.m.position.copy(p.pos); p.tr-=dt; if(p.tr<=0){ p.tr=.03; burst(p.pos,0xffa726,1,.6,.16,.3,0); } } }

/* 하트(체력) 줍기 — 로봇 웨이브 */
function dropHeart(pos){ const m=new THREE.Mesh(UNIT,matB(0x69f0ae)); m.scale.set(.5,.5,.5); m.position.set(pos.x,.6,pos.z); fxG.add(m); const c=new THREE.Mesh(UNIT,matB(0xffffff)); c.scale.set(1.2,.35,.35); m.add(c); const c2=c.clone(); c2.scale.set(.35,1.2,.35); m.add(c2); PICK.push({m,t:14}); }
/* 맵에 나타나는 강화 아이템 (먼저 먹는 사람이 임자) */
const POWER = {dmg:{c:0xff5252,ic:"💥",n:"2배 피해 8초"},spd:{c:0xffea00,ic:"⚡",n:"번개 발 8초"},shd:{c:0x40c4ff,ic:"🛡️",n:"방패 +50"}};
function dropPower(){ const type=pick(Object.keys(POWER)), d=POWER[type], S=W.S*.72, s=safeSpot(rnd(-S,S),rnd(-S,S)); const m=new THREE.Mesh(UNIT,matB(d.c)); m.scale.set(.6,.6,.6); m.position.set(s.x,.7,s.z); fxG.add(m);
  const l=makeLabel(d.ic,"#fff"); l.scale.set(4.4,1.1,1); l.position.y=1.6; m.add(l); PICK.push({m,t:25,type}); burst(m.position,d.c,8,3,.15,.6,-2); }
function takePick(p){ const d=POWER[p.type]; if(!d){ P.hp=Math.min(P.maxhp,P.hp+35); SFX.coin(); floatText(p.m.position,"+35 ❤️","#69f0ae",20,.9); return; }
  if(p.type==="dmg") P.pwD=8; else if(p.type==="spd") P.pwS=8; else P.hp=Math.min(P.maxhp+50,P.hp+50); SFX.up(); UI.banner(d.ic+" "+d.n,"",1.1); }
function updatePicks(dt){ for(let i=PICK.length-1;i>=0;i--){ const p=PICK[i]; p.t-=dt; p.m.rotation.y+=dt*3; p.m.position.y=.6+Math.sin(p.t*4)*.12;
    const got=P&&P.alive&&Math.hypot(P.pos.x-p.m.position.x,P.pos.z-p.m.position.z)<1.3&&P.pos.y<1.6;
    if(got) takePick(p);
    if(got||p.t<=0){ fxG.remove(p.m); PICK.splice(i,1); } } }

/* ---------- 봇 AI ---------- */
const PREF = {shotgun:5,smg:9,sniper:24,rocket:14,laser:12};
function addBot(o){ const a=newActor(Object.assign({isBot:true,skill:.4},o)); const w=WEAPONS[a.wkey];
  Object.assign(a,{think:rnd(0,.2),see:false,target:null,seeT:0,field:null,fieldT:0,strafe:pick([-1,1]),strafeT:rnd(.8,2),cool:rnd(.3,.8),ammo:w.mag,relT:0,pref:PREF[a.wkey]||11,jumpT:rnd(2,6),burst:Math.round(rnd(3,8)),mcd:0,last:V3(),hasLast:false});
  return a; }
const _bd = V3(), _be = V3(), _bt = V3(), _mv = {x:0,z:0};
function botPickTarget(b){ let best=null, bd=1e9; for(const a of ACT){ if(!a.alive||!hostile(b,a)) continue; const d=b.pos.distanceTo(a.pos)*(a===b.target?.8:1); if(d<bd){ bd=d; best=a; } } return best; }
function updateBot(b,dt){ if(!b.alive) return; const frozen=M.freeze>0||M.phase!=="play";
  if(b.slowT>0) b.slowT-=dt; if(b.inv>0) b.inv-=dt;
  b.think-=dt; if(b.think<=0){ b.think=.14+Math.random()*.08; b.target=botPickTarget(b); const t=b.target; let see=false;
    if(t){ eyeOf(b,_be); _bt.set(t.pos.x,t.pos.y+1.3*t.scale*(t.hsc||1),t.pos.z).sub(_be); const d=_bt.length(); _bt.multiplyScalar(1/d); see=d<(b.sight||60)&&rayWorld(_be,_bt,d)>=d-.05; }
    if(see){ if(!b.see) b.seeT=0; b.last.copy(t.pos); b.hasLast=true; } b.see=see; }
  const t=b.target; let wx=0, wz=0, sp=b.speed*(b.slowT>0?.5:1);
  if(t&&!frozen){ const dx=t.pos.x-b.pos.x, dz=t.pos.z-b.pos.z, dist=Math.hypot(dx,dz)||.01; b.seeT+=dt;
    b.fieldT-=dt; if(b.fieldT<=0){ b.fieldT=.45+Math.random()*.2; const gp=(b.see||b.melee||!b.hasLast)?t.pos:b.last; b.field=flowField(gp.x,gp.z,b.field); }
    const path=b.field&&flowDir(b.field,b.pos.x,b.pos.z,_mv);
    if(b.melee){ if(dist>1.2*b.scale+.4){ if(b.see&&dist<4){ wx=dx/dist; wz=dz/dist; } else if(path){ wx=_mv.x; wz=_mv.z; } }
      b.mcd-=dt; if(dist<1.25*b.scale+.75&&Math.abs(t.pos.y-b.pos.y)<2.2*b.scale&&b.mcd<=0){ b.mcd=b.melee.cd; b.kick=1; damage(t,b.melee.dmg,b,{w:"melee"}); } }
    else if(b.see){ b.strafeT-=dt; if(b.strafeT<=0||b.wall){ b.strafe=-b.strafe; b.strafeT=rnd(.7,2.2); }
      const px=-dz/dist*b.strafe, pz=dx/dist*b.strafe; let f=0; if(dist>b.pref+3) f=1; else if(dist<b.pref-3) f=-.8;
      wx=px*.75+dx/dist*f; wz=pz*.75+dz/dist*f; if(f>0&&path){ wx=px*.5+_mv.x; wz=pz*.5+_mv.z; }
      b.jumpT-=dt; if(b.jumpT<=0&&b.ground){ b.jumpT=rnd(2.5,7); if(b.skill>.3) b.vel.y=8.4; } }
    else if(path){ wx=_mv.x; wz=_mv.z; }
    const l=Math.hypot(wx,wz); if(l>1){ wx/=l; wz/=l; }
    /* 조준 */
    const ty=t.pos.y+(b.aimHead?1.58:1.02)*t.scale*(t.hsc||1)-(b.pos.y+1.52*b.scale); const wantYaw=Math.atan2(-dx,-dz), wantPitch=Math.atan2(ty,dist);
    let dy=wantYaw-b.yaw; while(dy>Math.PI) dy-=6.2832; while(dy<-Math.PI) dy+=6.2832; const turn=lerp(4,11,b.skill)*dt; b.yaw+=clamp(dy,-turn,turn); b.pitch+=clamp(wantPitch-b.pitch,-turn,turn);
    /* 사격 */
    if(!b.melee){ const w=WEAPONS[b.wkey]; b.cool-=dt;
      if(b.relT>0){ b.relT-=dt; if(b.relT<=0) b.ammo=w.mag; }
      else if(b.see&&b.seeT>lerp(.95,.28,b.skill)&&b.cool<=0&&Math.abs(dy)<.35&&dist<w.range){
        eyeOf(b,_be); _bt.set(t.pos.x,t.pos.y+(b.aimHead?1.58:1.02)*t.scale*(t.hsc||1),t.pos.z); _bd.copy(_bt).sub(_be).normalize();
        const tv=Math.hypot(t.vel.x,t.vel.z), err=lerp(.12,.022,b.skill)*(1+tv*.07)*(b.seeT<1.2?1.5:1); _bd.x+=rnd(-err,err); _bd.y+=rnd(-err,err)*.7; _bd.z+=rnd(-err,err); _bd.normalize();
        shoot(b,b.wkey,_be,_bd); b.ammo--; b.cool=w.rate*1.2; b.aimHead=Math.random()<b.skill*.3;
        if(--b.burst<=0){ b.burst=Math.round(rnd(3,9)); b.cool+=rnd(.25,.7)*(1.3-b.skill); }
        if(b.ammo<=0) b.relT=w.rel*1.15; } } }
  const k=1-Math.exp(-(b.ground?9:2)*dt); b.vel.x+=(wx*sp-b.vel.x)*k; b.vel.z+=(wz*sp-b.vel.z)*k;
  moveActor(b,dt); padCheck(b);
  if(!frozen&&Math.hypot(wx,wz)>.5&&Math.hypot(b.vel.x,b.vel.z)<.6){ b.stuck=(b.stuck||0)+dt; if(b.stuck>.7){ b.stuck=0; b.strafe=-b.strafe; b.fieldT=0; if(b.ground) b.vel.y=8.4; } } else b.stuck=0; }
function padCheck(a){ if(!a.ground||a.pos.y>.2) return false; for(const p of W.pads){ const dx=a.pos.x-p.x, dz=a.pos.z-p.z; if(dx*dx+dz*dz<1.15){ a.vel.y=p.p; a.ground=false; a.jumps=1; if(a===P||volAt(a.pos)>.4) SFX.pad(); return true; } } return false; }

/* 온라인 상대: 받은 위치로 부드럽게 따라감 */
function updateRemote(a,dt){ if(a.inv>0) a.inv-=dt; const k=1-Math.exp(-14*dt), ox=a.pos.x, oz=a.pos.z; a.pos.x+=(a.tx-a.pos.x)*k; a.pos.y+=(a.ty-a.pos.y)*k; a.pos.z+=(a.tz-a.pos.z)*k;
  a.vel.x=(a.pos.x-ox)/Math.max(dt,.001); a.vel.z=(a.pos.z-oz)/Math.max(dt,.001); let dy=a.tyaw-a.yaw; while(dy>Math.PI) dy-=6.2832; while(dy<-Math.PI) dy+=6.2832; a.yaw+=dy*k; a.pitch+=(a.tp-a.pitch)*k; }
