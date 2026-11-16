"use strict";
/* ===== J war — 조작 · 내 캐릭터 · 손에 든 총 ===== */
const I = {mx:0,mz:0,fire:false,zoom:false,jumpQ:false,dashQ:false,keys:{},lookId:-1,moveId:-1,lx:0,ly:0,sx:0,sy:0,btn:{},locked:false,onTarget:false};
function inGame(){ return M.active&&!M.paused&&$("cards").classList.contains("hide")&&$("panel").classList.contains("hide"); }
function lookBy(dx,dy){ if(!P) return; const k=.0046*G.set.sens*(camera.fov<40?.38:1)*(1-.45*(I.near||0)); P.yaw-=dx*k; P.pitch=clamp(P.pitch-dy*k,-1.45,1.45); VM.swx+=dx*.0006; VM.swy+=dy*.0006; }

/* ---------- 터치 ---------- */
function touchAct(act){ if(act==="jump") I.jumpQ=true; else if(act==="dash") I.dashQ=true; else if(act==="reload") reload(); else if(act==="swap") swapWeapon(); else if(act==="zoom") I.zoom=!I.zoom; else if(act==="slide") I.slideQ=true; else if(act==="knife") knife(); else if(act==="nade") throwNade(); else if(act==="super") superGo(); }
addEventListener("touchstart",e=>{ if(!inGame()) return;
  for(const t of e.changedTouches){ const tg=t.target; if(tg.closest&&tg.closest("[data-a]")) continue; const el=tg.closest&&tg.closest("[data-t]");
    if(el){ el.classList.add("dn"); I.btn[t.identifier]=el; const a=el.dataset.t; if(a==="fire") I.fire=true; else touchAct(a);
      if(I.lookId<0&&(a==="fire"||a==="jump"||a==="zoom")){ I.lookId=t.identifier; I.lx=t.clientX; I.ly=t.clientY; } }
    else if(t.clientX<innerWidth*.42&&I.moveId<0){ I.moveId=t.identifier; I.sx=t.clientX; I.sy=t.clientY; const s=$("stick"); s.style.display="block"; s.style.left=I.sx+"px"; s.style.top=I.sy+"px"; s.firstChild.style.transform=""; }
    else if(I.lookId<0){ I.lookId=t.identifier; I.lx=t.clientX; I.ly=t.clientY; } }
  e.preventDefault(); },{passive:false});
addEventListener("touchmove",e=>{ if(!inGame()) return;
  for(const t of e.changedTouches){
    if(t.identifier===I.moveId){ let dx=t.clientX-I.sx, dy=t.clientY-I.sy; const l=Math.hypot(dx,dy), R=52; if(l>R){ dx*=R/l; dy*=R/l; } I.mx=dx/R; I.mz=-dy/R; $("stick").firstChild.style.transform=`translate(${dx}px,${dy}px)`; }
    else if(t.identifier===I.lookId){ lookBy(t.clientX-I.lx,t.clientY-I.ly); I.lx=t.clientX; I.ly=t.clientY; } }
  e.preventDefault(); },{passive:false});
function touchEnd(e){ for(const t of e.changedTouches){ const el=I.btn[t.identifier]; if(el){ el.classList.remove("dn"); if(el.dataset.t==="fire") I.fire=false; delete I.btn[t.identifier]; }
    if(t.identifier===I.moveId){ I.moveId=-1; I.mx=I.mz=0; $("stick").style.display="none"; } if(t.identifier===I.lookId) I.lookId=-1; } }
addEventListener("touchend",touchEnd); addEventListener("touchcancel",touchEnd);
function resetInput(){ I.mx=I.mz=0; I.fire=false; I.zoom=false; I.jumpQ=I.dashQ=I.slideQ=false; I.moveId=I.lookId=-1; I.keys={}; I.btn={}; $("stick").style.display="none"; document.querySelectorAll(".tb.dn").forEach(e=>e.classList.remove("dn")); }

/* ---------- 키보드 · 마우스 ---------- */
addEventListener("keydown",e=>{ if(e.target.tagName==="INPUT") return; const k=e.code; I.keys[k]=true; if(!inGame()){ if(k==="Escape"&&M.active&&M.paused) UIA.resume(); return; }
  if(k==="Space"){ I.jumpQ=true; e.preventDefault(); } else if(k==="ShiftLeft"||k==="ShiftRight") I.dashQ=true; else if(k==="KeyR") reload(); else if(k==="KeyC"||k==="ControlLeft") I.slideQ=true; else if(k==="KeyF"||k==="KeyV") knife(); else if(k==="KeyG") throwNade(); else if(k==="KeyE") superGo(); else if(k==="KeyQ"||k==="Digit1"||k==="Digit2") swapWeapon(k==="Digit1"?0:k==="Digit2"?1:-1); else if(k==="Escape"||k==="KeyP") UIA.pause(); });
addEventListener("keyup",e=>{ I.keys[e.code]=false; });
addEventListener("mousemove",e=>{ if(I.locked&&inGame()) lookBy(e.movementX*.5,e.movementY*.5); });
addEventListener("mousedown",e=>{ if(TOUCH||!inGame()) return; if(e.target.closest("[data-a]")) return; if(!I.locked){ const c=$("gl"); c.requestPointerLock&&c.requestPointerLock(); }
  if(e.button===0) I.fire=true; else if(e.button===2) I.zoom=true; });
addEventListener("mouseup",e=>{ if(e.button===0) I.fire=false; else if(e.button===2) I.zoom=false; });
addEventListener("contextmenu",e=>e.preventDefault());
addEventListener("wheel",()=>{ if(inGame()) swapWeapon(); },{passive:true});
document.addEventListener("pointerlockchange",()=>{ const was=I.locked; I.locked=document.pointerLockElement===$("gl"); if(was&&!I.locked&&inGame()&&M.type!=="online") UIA.pause(); });

/* ---------- 내 캐릭터 ---------- */
function spawnPlayer(x,z,yaw,team){ P=newActor({noAv:true,isPlayer:true,id:G.id,name:G.name||"나",team,col:SKINS[G.skin].c,speed:7});
  Object.assign(P,{eq:G.eq.slice(),wi:0,ammo:[0,0],cool:0,relT:0,swT:0,air:0,dashT:0,dashCd:2.4,dashLeft:0,dvx:0,dvz:0,rateMul:1,magMul:1,relMul:1,regenMul:1,headMul:1,regenT:0,rec:0,bob:0,roll:0,dip:0,slideT:0,slideCd:0,crouch:0,sdx:0,sdz:0,knifeCd:0,nadeCd:0,stepT:0,sup:0,supT:0});
  placeActor(P,x,z,yaw); P.ammo=[magOf(0),magOf(1)]; P.wkey=P.eq[0]; buildVM(P.wkey); camera.fov=baseFov(); camera.updateProjectionMatrix(); UI.weapon(); return P; }
function placeActor(a,x,z,yaw){ const s=safeSpot(x,z); a.pos.set(s.x,0,s.z); a.vel.set(0,0,0); a.yaw=yaw||0; a.pitch=0; a.hp=a.maxhp; a.alive=true; a.slowT=0; a.hurtT=0; a.streak=a.streak||0;
  if(a.remote){ a.tx=s.x; a.ty=0; a.tz=s.z; a.tyaw=a.yaw; a.tp=0; } if(a.isBot){ a.ammo=WEAPONS[a.wkey].mag; a.relT=0; a.see=false; a.hasLast=false; a.cool=rnd(.3,.8); }
  if(a===P){ P.ammo=[magOf(0),magOf(1)]; P.relT=0; P.cool=0; P.dashLeft=0; P.dashT=0; I.zoom=false; } }
function magOf(i){ return Math.round(WEAPONS[P.eq[i]].mag*P.magMul); }
function reload(){ if(!P||!P.alive||P.relT>0||P.ammo[P.wi]>=magOf(P.wi)) return; P.relT=WEAPONS[P.eq[P.wi]].rel*P.relMul; P.relFull=P.relT; SFX.reload(); I.zoom=false; }
function swapWeapon(to){ if(!P||!P.alive) return; const n=to>=0?to:1-P.wi; if(n===P.wi) return; P.wi=n; P.wkey=P.eq[n]; P.relT=0; P.swT=.28; I.zoom=false; buildVM(P.wkey); SFX.click(); UI.weapon(); }
const _pd = V3(), _po = V3();
function aimCheck(){ I.onTarget=false; if(!P||!P.alive) return; const w=WEAPONS[P.wkey]; dirFrom(P.yaw,P.pitch,_pd); let t=rayWorld(camera.position,_pd,w.range);
  for(const b of ACT){ if(!b.alive||!hostile(P,b)||b.inv>0) continue; const r=rayActor(camera.position,_pd,b,TOUCH?1.25:1); if(r&&r.t<t){ I.onTarget=true; return; } } }
/* 필살기: 게이지가 가득 차면 6초 동안 무한 탄창 · 빠른 연사 · 빠른 발 · 피해 +30% */
function superGo(){ if(!P||!P.alive||P.sup<100||P.supT>0||M.phase!=="play"||M.freeze>0) return; P.sup=0; P.supT=6; P.dmgMul*=1.3; P.relT=0; P.ammo[P.wi]=Math.max(1,P.ammo[P.wi]);
  jingle([523,659,784,1047,1319,1568],.05,"sawtooth",.13); FX.shake=Math.max(FX.shake,.4); UI.banner("⭐ 필살기!","6초 동안 무한 탄창 · 초고속 연사",1.2); }
/* 에너지 검: 앞의 가까운 적을 벰. 등 뒤에서 베면 한 방(백스탭) */
function knife(){ if(!P||!P.alive||P.knifeCd>0||M.freeze>0||M.phase!=="play") return; P.knifeCd=.55; VM.slash=.22; SFX.slash(); dirFrom(P.yaw,P.pitch,_pd); let best=null, bd=3.2;
  for(const b of ACT){ if(!b.alive||!hostile(P,b)||b.inv>0) continue; _ad.set(b.pos.x-P.pos.x,b.pos.y+1*b.scale-(P.pos.y+1.3),b.pos.z-P.pos.z); const d=_ad.length()-b.r; if(d>bd) continue; _ad.normalize(); if(_ad.dot(_pd)<.5) continue; best=b; bd=d; }
  P.vel.x+=_pd.x*5; P.vel.z+=_pd.z*5;
  if(best){ const back=(-Math.sin(best.yaw)*_pd.x-Math.cos(best.yaw)*_pd.z)>.45; FX.shake=Math.max(FX.shake,.3); hitStop(.05);
    if(back){ _ad.set(best.pos.x,best.pos.y+2.3*best.scale,best.pos.z); floatText(_ad,"백스탭!","#40c4ff",24,1); }
    damage(best,back?(best.maxhp>200?170:999):WEAPONS.knife.dmg*P.dmgMul,P,{w:"knife",head:back}); } }
/* 폭탄: 포물선으로 던짐 (7초마다) */
function throwNade(){ if(!P||!P.alive||P.knifeOnly||P.nadeCd>0||M.freeze>0||M.phase!=="play") return; P.nadeCd=7; dirFrom(P.yaw,Math.min(1.3,P.pitch+.2),_pd); _po.copy(camera.position); shoot(P,"grenade",_po,_pd); VM.kick=1;
  if(M.type==="online"){ NET.shT=0; NET.shot("grenade",_po,_pd); } }
/* 조준 도움: 조준점 근처의 적 쪽으로 살짝 끌어당기고, 가까워지면 화면이 천천히 돌아감 */
const _ad = V3(), _ae = V3();
function aimAssist(dt){ I.near=0; if(!G.set.assist||!P.alive||M.phase!=="play") return; dirFrom(P.yaw,P.pitch,_pd); let best=null, ba=.2; const range=Math.min(Math.max(WEAPONS[P.wkey].range,14),60), cp=camera.position;
  for(const b of ACT){ if(!b.alive||!hostile(P,b)) continue; _ad.set(b.pos.x-cp.x,b.pos.y+1.15*b.scale-cp.y,b.pos.z-cp.z); const d=_ad.length(); if(d>range||d<.6) continue; _ad.multiplyScalar(1/d);
    const a=Math.acos(clamp(_ad.dot(_pd),-1,1)); if(a<ba&&rayWorld(cp,_ad,d)>=d-.1){ ba=a; best=b; _ae.copy(_ad); } }
  if(!best) return; I.near=1-ba/.2; if(ba<.012) return;
  let dy=Math.atan2(-_ae.x,-_ae.z)-P.yaw; while(dy>Math.PI) dy-=6.2832; while(dy<-Math.PI) dy+=6.2832;
  const r=((I.fire||I.lookId>=0||Math.hypot(I.mx,I.mz)>.2)?1.5:.5)*I.near*dt; P.yaw+=clamp(dy,-r,r); P.pitch+=clamp(Math.asin(clamp(_ae.y,-1,1))-P.pitch,-r,r); }
function playerFire(){ if(P.knifeOnly){ knife(); return; } const k=P.wkey, w=WEAPONS[k]; if(P.cool>0||P.swT>0||P.relT>0) return;
  if(P.ammo[P.wi]<=0){ reload(); return; }
  if(!(P.supT>0)) P.ammo[P.wi]--; P.cool=w.rate*P.rateMul*(P.supT>0?.6:1); dirFrom(P.yaw,P.pitch,_pd); _po.copy(camera.position);
  const mv=Math.hypot(P.vel.x,P.vel.z); let sm=1+(mv>3?.5:0)+(P.ground?0:.6); if(w.zoom) sm=camera.fov<40?1:w.hip/w.spread;
  shoot(P,k,_po,_pd,{sm,dm:1+.02*stars(k)}); VM.kick=1; VM.flash=.05; FX.shake=Math.max(FX.shake,k==="sniper"||k==="shotgun"||k==="rocket"?.26:.06); P.rec=Math.min(.09,P.rec+(k==="sniper"||k==="shotgun"||k==="rocket"?.05:.012));
  if(M.type==="online") NET.shot(k,_po,_pd); if(P.ammo[P.wi]<=0) reload(); }
function updatePlayer(dt){ if(!P) return; if(P.inv>0) P.inv-=dt; if(P.slowT>0) P.slowT-=dt; if(P.dashLeft>0) P.dashLeft-=dt; if(P.knifeCd>0) P.knifeCd-=dt; if(P.nadeCd>0) P.nadeCd-=dt; if(P.slideCd>0) P.slideCd-=dt; if(P.supT>0){ P.supT-=dt; if(P.supT<=0) P.dmgMul/=1.3; }
  const w=WEAPONS[P.wkey], frozen=M.freeze>0||M.phase!=="play";
  if(P.alive){
    let mx=I.mx, mz=I.mz; const K=I.keys; if(K.KeyW||K.ArrowUp) mz+=1; if(K.KeyS||K.ArrowDown) mz-=1; if(K.KeyD||K.ArrowRight) mx+=1; if(K.KeyA||K.ArrowLeft) mx-=1;
    const l=Math.hypot(mx,mz); if(l>1){ mx/=l; mz/=l; } if(frozen){ mx=mz=0; I.jumpQ=I.dashQ=I.slideQ=false; }
    const s=Math.sin(P.yaw), c=Math.cos(P.yaw), zoomed=camera.fov<40, sp=P.speed*(P.slowT>0?.55:1)*(zoomed?.55:1)*paintMul(P)*(P.supT>0?1.25:1);
    const wx=(c*mx-s*mz)*sp, wz=(-s*mx-c*mz)*sp, hs=Math.hypot(P.vel.x,P.vel.z);
    if(I.slideQ){ I.slideQ=false; if(P.ground&&P.slideT<=0&&P.slideCd<=0&&hs>2.5){ P.slideT=.75; P.sdx=P.vel.x/hs; P.sdz=P.vel.z/hs; SFX.dash(); bump("slide",1); } }
    if(P.slideT>0){ P.slideT-=dt; const v=sp*(.95+.8*Math.max(0,P.slideT)/.75); P.vel.x=P.sdx*v; P.vel.z=P.sdz*v; if(P.slideT<=0) P.slideCd=.45; if(Math.random()<.5) burst(P.pos,0xffffff,1,2,.1,.3,1); }
    else { const k=1-Math.exp(-(P.ground?13:(hs>sp*1.05?.8:3.2))*dt); P.vel.x+=(wx-P.vel.x)*k; P.vel.z+=(wz-P.vel.z)*k; }
    if(I.jumpQ){ I.jumpQ=false; if(P.ground){ P.vel.y=8.6; P.air=0; if(P.slideT>0){ P.slideT=0; P.slideCd=.3; const b=Math.max(1,Math.min(1.2,13.5/Math.max(hs,1))); P.vel.x*=b; P.vel.z*=b; } SFX.jump(); } else if(P.air<1){ P.air=1; P.vel.y=8.3; SFX.jump2(); burst(P.pos,0xffffff,6,3,.12,.35,2); } }
    if(I.dashQ){ I.dashQ=false; if(P.dashLeft<=0){ let dx=wx, dz=wz; const dl=Math.hypot(dx,dz); if(dl<.5){ dx=-s; dz=-c; } else { dx/=dl; dz/=dl; } P.dvx=dx*21; P.dvz=dz*21; P.dashT=.17; P.dashLeft=P.dashCd; SFX.dash(); bump("dash",1); } }
    if(P.dashT>0){ P.dashT-=dt; P.vel.x=P.dvx; P.vel.z=P.dvz; if(P.vel.y<0) P.vel.y*=.5; }
    const vy0=P.vel.y, g0=P.ground; moveActor(P,dt); if(P.ground){ P.air=0; if(!g0&&vy0<-7) P.dip=Math.min(.25,-vy0*.013); } padCheck(P);
    P.regenT-=dt; if(P.regenT<=0&&P.hp<P.maxhp) P.hp=Math.min(P.maxhp,P.hp+7*P.regenMul*dt);
    P.cool-=dt; if(P.swT>0) P.swT-=dt; if(P.relT>0){ P.relT-=dt; if(P.relT<=0){ P.ammo[P.wi]=magOf(P.wi); SFX.reloaded(); } }
    aimAssist(dt); aimCheck(); const auto=G.set.auto&&I.onTarget&&(!w.zoom||zoomed);
    if((I.fire||auto)&&!frozen) playerFire();
    P.bob+=dt*Math.hypot(P.vel.x,P.vel.z)*(P.ground?1.7:0);
    if(P.ground&&P.slideT<=0){ P.stepT-=dt*Math.hypot(P.vel.x,P.vel.z); if(P.stepT<=0){ P.stepT=2.7; SFX.step(); } }
  } else { P.vel.set(0,0,0); I.zoom=false; }
  if(P.rec>0) P.rec=Math.max(0,P.rec-dt*.35);
  const tf=(w.zoom&&I.zoom&&P.alive)?w.zoom:baseFov()+(P.dashT>0?10:0); if(Math.abs(camera.fov-tf)>.1){ camera.fov+=(tf-camera.fov)*(1-Math.exp(-16*dt)); camera.updateProjectionMatrix(); }
  P.dip*=Math.exp(-9*dt); { const st=P.vel.x*Math.cos(P.yaw)-P.vel.z*Math.sin(P.yaw); P.roll+=(-st*.0055-P.roll)*(1-Math.exp(-8*dt)); }
  P.crouch+=((P.slideT>0&&P.alive?1:0)-P.crouch)*(1-Math.exp(-14*dt));
  camera.position.set(P.pos.x,P.pos.y+(P.alive?1.52:.5)+Math.sin(P.bob*2)*.03-P.dip-P.crouch*.62,P.pos.z); const sh=FX.shake;
  camera.rotation.set(P.pitch+P.rec+(sh?rnd(-sh,sh)*.05:0),P.yaw+(sh?rnd(-sh,sh)*.05:0),P.alive?P.roll+P.crouch*.07:0); }

/* ---------- 손에 든 총 (화면 오른쪽 아래) ---------- */
const VM = {g:new THREE.Group(),kick:0,flash:0,swx:0,swy:0,fl:null};
function buildVM(key){ const g=VM.g; while(g.children.length) g.remove(g.children[0]); if(!g.parent) vmScene.add(g);
  const w=WEAPONS[key], L=w.len, main=new THREE.MeshLambertMaterial({color:stars(key)>=5?0xffd700:w.col}), dark=new THREE.MeshLambertMaterial({color:0x263238}), light=new THREE.MeshLambertMaterial({color:0xeceff1});
  const mk=(sx,sy,sz,m,x,y,z)=>{ const me=new THREE.Mesh(UNIT,m); me.scale.set(sx,sy,sz); me.position.set(x,y,z); g.add(me); return me; };
  const fat=key==="rocket"?.15:key==="shotgun"?.1:key==="minigun"?.13:.08;
  mk(fat,fat*1.15,L,main,0,0,-L/2); mk(.06,.15,.075,dark,0,-.11,-.07); mk(.09,.1,.09,new THREE.MeshLambertMaterial({color:0xffd9b3}),0,-.16,-.06);
  if(key==="rocket"){ mk(.11,.11,.1,dark,0,0,-L-.03); mk(.2,.2,.08,light,0,0,-.02); }
  else if(key==="minigun"){ [[-.035,.03],[.035,.03],[0,-.035]].forEach(p=>mk(.035,.035,.3,dark,p[0],p[1],-L-.13)); mk(.15,.15,.05,dark,0,0,-L+.02); }
  else if(key==="laser"){ mk(.03,.03,.25,matB(0xff80ab),0,0,-L-.1); mk(.1,.03,L*.6,light,0,.06,-L*.5); }
  else if(key==="ice"){ mk(.05,.05,.2,matB(0xe0f7fa),0,0,-L-.08); mk(.04,.12,.04,matB(0xb2ebf2),0,.09,-L*.6); mk(.04,.09,.04,matB(0xb2ebf2),0,.08,-L*.3); }
  else { mk(.04,.04,L*.4,dark,0,.005,-L-L*.15); if(key!=="pistol") mk(.05,.12,.06,dark,0,-.1,-L*.55); }
  if(key==="sniper"){ mk(.06,.06,.26,dark,0,.085,-L*.45); mk(.07,.07,.03,matB(0x40c4ff),0,.085,-L*.45-.14); }
  else mk(.02,.035,.02,light,0,fat*.6+.015,-L+.04);
  VM.fl=new THREE.Mesh(new THREE.OctahedronGeometry(.09),new THREE.MeshBasicMaterial({color:0xfff59d,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false})); VM.fl.position.set(0,0,-L-(key==="pistol"?.16:.3)); VM.fl.visible=false; g.add(VM.fl); VM.len=L; g.scale.setScalar(.6); }
function updateVM(dt){ const g=VM.g; if(!P){ g.visible=false; return; } g.visible=P.alive&&camera.fov>40&&M.active;
  if(VM.kick>0) VM.kick=Math.max(0,VM.kick-dt*9); VM.swx*=Math.exp(-10*dt); VM.swy*=Math.exp(-10*dt);
  const b=Math.sin(P.bob)*.012, b2=Math.abs(Math.cos(P.bob))*.012; let rx=VM.kick*.13, y=-.165-b2, z=-.36+VM.kick*.06;
  if(P.swT>0) y-=P.swT*1.2; if(P.relT>0){ const k=Math.sin(Math.PI*(1-P.relT/P.relFull)); y-=k*.16; rx-=k*.9; }
  g.position.set(.2+b-clamp(VM.swx,-.05,.05),y+clamp(VM.swy,-.04,.04),z); g.rotation.set(rx,.04-clamp(VM.swx,-.05,.05),0); if(VM.slash>0){ VM.slash-=dt; const k=Math.max(0,VM.slash)/.22; g.rotation.z=-k*1.5; g.rotation.y+=k*.9; g.position.x-=k*.22; g.position.z-=k*.12; }
  if(VM.fl){ VM.flash-=dt; VM.fl.visible=VM.flash>0&&!WEAPONS[P.wkey].proj; if(VM.fl.visible){ VM.fl.rotation.z=Math.random()*6; VM.fl.scale.setScalar(rnd(.8,1.5)); } } }
