"use strict";
/* ===== J war — 게임 모드 (결투 · 로봇 웨이브 · 친구와 대결) ===== */
const M = {active:false,paused:false,type:"",phase:"",freeze:0,t:0,map:"toy",botDmg:1,kills:0,hs:0,onKill(){}};

/* ---------- 오늘의 임무 · 보상 ---------- */
function ensureDay(){ const d=new Date(), key=d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); if(G.day===key&&G.mis&&G.mis.length) return;
  G.day=key; G.dayc={}; G.mis=[]; const ks={}; for(const m of MISSIONS.slice().sort(()=>Math.random()-.5)){ if(ks[m.k]) continue; ks[m.k]=1; G.mis.push({id:m.id,got:0}); if(G.mis.length>=3) break; } save(); }
function bump(k,n){ ensureDay(); if(k==="wave"||k==="streak") G.dayc[k]=Math.max(G.dayc[k]||0,n); else G.dayc[k]=(G.dayc[k]||0)+n; }
function misReady(){ ensureDay(); return G.mis.filter(x=>{ const m=MISSIONS.find(y=>y.id===x.id); return m&&!x.got&&(G.dayc[m.k]||0)>=m.n; }).length; }
function grant(coins,xp,tro){ const lv0=lvOf(G.xp); G.coins+=coins; G.xp+=xp; G.tro=Math.max(0,G.tro+(tro||0)); const lv1=lvOf(G.xp); let bonus=0;
  if(lv1>lv0){ for(let l=lv0+1;l<=lv1;l++) bonus+=40*l; G.coins+=bonus; } save(); return {coins,xp,tro:tro||0,lvUp:lv1>lv0?lv1:0,bonus}; }

/* ---------- 공통 ---------- */
function beginMatch(type,map){ clearActors(); clearFX(); paintClear(); buildMap(map); Object.assign(M,{active:true,paused:false,type,map,t:0,kills:0,hs:0,freeze:0,botDmg:1,phase:"play",pt:0});
  resetInput(); UI.showGame(); }
function stopMatch(){ M.active=false; M.paused=false; M.phase=""; resetInput(); if(document.exitPointerLock) document.exitPointerLock(); }
function onKillCommon(t,by,info){ UI.feed(by?by.name:"",t.name,info.w&&WEAPONS[info.w]?WEAPONS[info.w].ic:"💥",by===P||t===P);
  if(by===P){ if(info.w==="knife") bump("knife",1); if(WKEYS.indexOf(info.w)>=0){ G.wk[info.w]=(G.wk[info.w]||0)+1; if(STAR_AT.indexOf(G.wk[info.w])>=0) toast(WEAPONS[info.w].n+" 숙련도 ★"+stars(info.w)+" 달성!"); } if(P.supT<=0) P.sup=Math.min(100,P.sup+12); M.kills++; G.stat.k++; bump("kills",1); if(info.head){ M.hs++; G.stat.hs++; bump("hs",1); }
    bump("streak",P.streak); const s=P.streak; if(s>=2) UI.streak(s===2?"더블 아웃!":s===3?"트리플 아웃!":s===4?"막을 수 없어!":"전설이다!! ×"+s); } }
function usedNames(){ const u={}; ACT.forEach(a=>u[a.name]=1); return u; }
function botName(){ const u=usedNames(); const f=BOT_NAMES.filter(n=>!u[n]); return pick(f.length?f:BOT_NAMES); }
function tickFreeze(dt){ if(M.freeze<=0) return; const a=Math.ceil(M.freeze); M.freeze-=dt; const b=Math.ceil(M.freeze); if(M.freeze<=0){ UI.banner("시작!","",.8); SFX.go(); } else if(a!==b&&b<=3){ UI.banner(String(b),"",.9); SFX.count(); } }

/* ---------- 결투 (봇전) ---------- */
function botWeapons(skill){ const p=["pistol","rifle","rifle"]; if(skill>.22) p.push("shotgun","smg"); if(skill>.4) p.push("sniper"); if(skill>.5) p.push("ice"); if(skill>.62) p.push("rocket"); if(skill>.78) p.push("laser"); return p; }
function startDuel(n){ const map=pick(MAP_KEYS), m=MAPS[map]; beginMatch("duel",map); const skill=clamp(.1+G.tro/700,.1,.95);
  Object.assign(M,{n,sc:[0,0],round:0,need:3,skill,botDmg:lerp(.42,1,skill),onKill:duelKill}); const order=n===1?[1]:n===2?[0,2]:[1,0,2], wp=botWeapons(skill);
  spawnPlayer(m.t0[order[0]][0],m.t0[order[0]][1],0,0); P.home=m.t0[order[0]];
  for(let i=1;i<n;i++){ const s=m.t0[order[i]]; const b=addBot({name:botName(),team:0,col:0x40c4ff,lcol:"#80d8ff",wkey:pick(wp),skill:Math.min(.95,skill+.05),hat:Math.floor(rnd(0,HATS.length))}); b.home=s; }
  for(let i=0;i<n;i++){ const s=m.t0[order[i]]; const b=addBot({name:botName(),team:1,col:0xff5252,lcol:"#ff8a80",wkey:pick(wp),skill,hat:Math.floor(rnd(0,HATS.length))}); b.home=[-s[0],-s[1]]; }
  duelRound(); }
function duelRound(){ M.round++; for(const p of PROJ) fxG.remove(p.m); PROJ.length=0;
  for(const a of ACT){ placeActor(a,a.home[0],a.home[1],a.team===0?0:Math.PI); a.inv=0; }
  M.phase="play"; M.freeze=4.2; M.rt=75; UI.banner("라운드 "+M.round,"먼저 "+M.need+"판 이기면 승리!",1.4); UI.score(M.sc[0],M.sc[1]); }
function teamAlive(t){ let n=0; for(const a of ACT) if(a.team===t&&a.alive) n++; return n; }
function duelKill(t,by,info){ onKillCommon(t,by,info); if(M.phase!=="play") return;
  if(!teamAlive(1)) duelEndRound(0); else if(!teamAlive(0)) duelEndRound(1); else if(t===P) UI.banner("아웃!","동료가 싸우는 중… 응원해요",2.5); }
function duelEndRound(w){ M.phase="roundEnd"; M.sc[w]++; M.pt=2.6; UI.score(M.sc[0],M.sc[1]); if(w===0){ UI.banner("라운드 승리!","",2); jingle([784,1047],.1); } else { UI.banner("라운드 패배","다음 판에 뒤집자!",2); tone(220,.3,"triangle",.2,150); } }
function updateDuel(dt){ if(M.phase==="play"&&M.freeze<=0){ M.rt-=dt; UI.timer(M.rt);
    if(M.rt<=0){ let h0=0,h1=0; for(const a of ACT){ if(!a.alive) continue; if(a.team===0) h0+=a.hp; else h1+=a.hp; } duelEndRound(h0>=h1?0:1); } }
  else if(M.phase==="roundEnd"){ M.pt-=dt; if(M.pt<=0){ if(M.sc[0]>=M.need||M.sc[1]>=M.need) endDuel(M.sc[0]>M.sc[1]); else duelRound(); } } }
function endDuel(win){ stopMatch(); G.stat.games++; bump("games",1); if(win){ G.stat.win++; bump("duelWin",1); }
  const r=grant(win?50+25*M.n:15+5*M.n, (win?40:15)+M.kills*5, win?10+2*M.n:-5); win?SFX.win():SFX.lose();
  UI.result({title:win?"승리!":"패배…",win,sub:M.n+"대"+M.n+" 결투 · "+M.sc[0]+" : "+M.sc[1],lines:[["아웃시킨 적",M.kills],["헤드샷",M.hs]],r,again:"duel:"+M.n}); }

/* ---------- 로봇 웨이브 ---------- */
const ROBOTS = {
  runner:{name:"돌격 로봇",robot:1,melee:{dmg:9,cd:.8},hp:42,speed:6.1,scale:.9,col:0xff7043,eye:0xffea00,pts:10},
  gunner:{name:"사격 로봇",robot:1,hp:70,speed:4.2,scale:1,col:0x7e57c2,eye:0x00e5ff,pts:20},
  tank:{name:"탱크 로봇",robot:1,melee:{dmg:22,cd:1.2},hp:250,speed:3.5,scale:1.4,col:0x546e7a,eye:0xff1744,pts:40},
  boss:{name:"메가 로봇",robot:1,wkey:"rocket",hp:850,speed:3.6,scale:1.8,col:0xb71c1c,eye:0xffffff,pts:200,skill:.5},
};
function startWave(){ const map=pick(MAP_KEYS), m=MAPS[map]; beginMatch("wave",map); Object.assign(M,{wave:0,score:0,queue:[],spawnT:0,onKill:waveKill});
  spawnPlayer(0,m.S*.55,0,0); UI.score("","",1); nextWave(); }
function nextWave(){ M.wave++; const n=M.wave; bump("wave",n); M.phase="play"; M.queue=[]; M.botDmg=Math.min(1,.5+n*.035);
  const cnt=4+Math.floor(n*1.6); for(let i=0;i<cnt;i++){ const r=Math.random(); M.queue.push(n>=3&&r<.3?"gunner":n>=4&&r<.44?"tank":"runner"); }
  if(n%5===0) M.queue.push("boss"); M.spawnT=1.2; if(P.shieldNext){ P.inv=P.shieldNext; P.shieldNext=0; }
  UI.banner(n%5===0?"⚠️ 보스 웨이브 "+n:"웨이브 "+n,"로봇 "+M.queue.length+"대가 몰려온다!",1.8); SFX.count(); }
function spawnRobot(type){ const m=MAPS[M.map], d=ROBOTS[type], n=M.wave; let pts=m.ffa.filter(s=>Math.hypot(s[0]-P.pos.x,s[1]-P.pos.z)>15); if(!pts.length) pts=m.ffa; const s=pick(pts);
  const o=Object.assign({},d,{team:1,lcol:"#ffab91",skill:d.skill||Math.min(.6,.18+n*.025)}); if(type==="gunner") o.wkey=pick(["pistol","rifle","smg"]);
  o.maxhp=o.hp=Math.round(d.hp*(1+.1*(n-1))); const b=addBot(o); b.rtype=type; placeActor(b,s[0]+rnd(-2,2),s[1]+rnd(-2,2),0); b.hp=b.maxhp; burst(b.pos,0x80d8ff,10,4,.2,.6,-3); }
function waveKill(t,by,info){ onKillCommon(t,by,info); if(t===P){ M.phase="over"; M.pt=1.8; UI.banner("아웃!","웨이브 "+M.wave+" 까지 버텼어요",1.8); return; }
  M.score+=ROBOTS[t.rtype||"runner"].pts*M.wave; if(Math.random()<(t.rtype==="boss"?1:.14)) dropHeart(t.pos); }
function updateWave(dt){ UI.timer(-1,"웨이브 "+M.wave+" · "+M.score+"점");
  if(M.phase==="play"){ let alive=0; for(let i=ACT.length-1;i>=0;i--){ const a=ACT[i]; if(a.team!==1) continue; if(a.alive) alive++; else { a.goneT=(a.goneT||0)+dt; if(a.goneT>1) removeActor(a); } }
    if(M.queue.length){ M.spawnT-=dt; if(M.spawnT<=0&&alive<9){ M.spawnT=rnd(.5,1.1); spawnRobot(M.queue.shift()); } }
    else if(!alive){ M.phase="clear"; M.pt=1.4; P.hp=Math.min(P.maxhp,P.hp+P.maxhp*.3); UI.banner("웨이브 "+M.wave+" 성공!","",1.3); jingle([784,988,1175],.09); } }
  else if(M.phase==="clear"){ M.pt-=dt; if(M.pt<=0){ M.phase="cards"; resetInput(); if(document.exitPointerLock) document.exitPointerLock(); UI.cards(UPGRADES.slice().sort(()=>Math.random()-.5).slice(0,3)); } }
  else if(M.phase==="over"){ M.pt-=dt; if(M.pt<=0) endWave(); } }
function pickCard(id){ const u=UPGRADES.find(x=>x.id===id); if(!u||M.phase!=="cards") return; u.f(P); P.ammo=[magOf(0),magOf(1)]; SFX.up(); $("cards").classList.add("hide"); nextWave(); }
function endWave(){ stopMatch(); G.stat.games++; bump("games",1); const best=M.wave>G.best.wave; if(best) G.best.wave=M.wave;
  const r=grant(M.wave*14+M.kills*2,M.wave*12+M.kills*3,0); best?SFX.win():SFX.lose();
  UI.result({title:best?"새 기록!":"게임 끝",win:best,sub:"로봇 웨이브 "+M.wave+" 도달 (최고 "+G.best.wave+")",lines:[["점수",M.score],["부순 로봇",M.kills],["헤드샷",M.hs]],r,again:"wave"}); }

/* ---------- 친구와 대결 (온라인, 모두가 적) ---------- */
function remoteActor(p){ let a=ACT.find(x=>x.id===p.id); if(a) return a;
  a=newActor({id:p.id,name:p.n||"친구",team:p.id,remote:true,col:(SKINS[p.sk]||SKINS[0]).c,hat:p.ht||0,wkey:WEAPONS[p.w]?p.w:"rifle",lcol:"#ff8a80"});
  Object.assign(a,{tx:0,ty:0,tz:0,tyaw:0,tp:0}); a.alive=false; return a; }
function onlineSpawn(){ const m=MAPS[M.map]; let best=m.ffa[0], bd=-1; for(const s of m.ffa){ let d=1e9; for(const a of ACT) if(a.remote&&a.alive) d=Math.min(d,Math.hypot(a.pos.x-s[0],a.pos.z-s[1])); d+=Math.random()*8; if(d>bd){ bd=d; best=s; } }
  placeActor(P,best[0],best[1],Math.atan2(best[0],best[1])); P.inv=2.5; }
function startOnline(cfg){ beginMatch("online",cfg.map); Object.assign(M,{end:cfg.end,mid:cfg.mid,resp:0,onKill:onlineKill,sbT:0});
  spawnPlayer(0,0,0,G.id); P.kills=0; P.deaths=0; onlineSpawn(); for(const id in NET.peers) remoteActor(NET.peers[id]);
  UI.banner("대결 시작!","모두가 적! 제일 많이 아웃시키면 1등",2); SFX.go(); UI.score("","",1); }
function onlineKill(t,by,info){ if(t!==P) return; onKillCommon(t,by,info); NET.send({t:"dead",by:by?by.id:"",w:info.w||"",h:info.head?1:0}); M.resp=3; UI.banner("아웃!",(by?by.name+" 에게 당함 · ":"")+"3초 뒤 다시 등장",2.6); }
function netHit(d,from){ if(M.type!=="online"||!M.active||!P||!P.alive||d.to!==G.id) return; damage(P,+d.d||0,from,{head:!!d.h,w:d.w,slow:+d.s||0}); }
function netDead(d,a){ if(M.type!=="online"||!M.active) return; const by=d.by===G.id?P:ACT.find(x=>x.id===d.by); if(a.alive){ a.alive=false; a.hp=0; a.deadT=.6; _fp.set(a.pos.x,a.pos.y+1,a.pos.z); burst(_fp,a.col,16,7,.24,.9,14); }
  if(by===P){ P.kills++; P.streak++; SFX.kill(); UI.hitmark("k"); _fp.y+=1.2; floatText(_fp,d.h?"헤드샷 아웃!":"아웃!",d.h?"#ffd740":"#ff8a80",24,1.1); }
  onKillCommon(a,by,{w:d.w,head:!!d.h}); }
function scoreRows(){ const rows=[{n:P?P.name:G.name,k:P?P.kills:0,d:P?P.deaths:0,me:1}]; for(const id in NET.peers){ const p=NET.peers[id]; rows.push({n:p.n,k:p.k||0,d:p.dd||0}); } return rows.sort((a,b)=>b.k-a.k||a.d-b.d); }
function updateOnline(dt){ const left=(M.end-Date.now())/1000; UI.timer(left);
  if(!P.alive){ M.resp-=dt; if(M.resp<=0) onlineSpawn(); }
  M.sbT-=dt; if(M.sbT<=0){ M.sbT=.5; UI.board(scoreRows().slice(0,5)); }
  if(left<=0) endOnline(); }
function endOnline(){ const rows=scoreRows(), rank=rows.findIndex(r=>r.me)+1, multi=rows.length>1; stopMatch(); NET.finished[M.mid]=1; G.stat.games++; bump("games",1); if(multi) bump("online",1);
  if(M.kills>G.best.kills) G.best.kills=M.kills; const first=multi&&rank===1; if(first) G.stat.win++;
  const r=grant(30+M.kills*12+(first?60:0),20+M.kills*6,0); first?SFX.win():jingle([523,659,784],.1);
  UI.result({title:first?"1등!":rank+"등",win:first,sub:"친구와 대결 · "+MAPS[M.map].n,lines:[["아웃시킨 적",M.kills],["헤드샷",M.hs]],r,rows,again:"lobby"}); }

/* ---------- 🔁 총 바꾸기 (아웃시킬 때마다 총이 바뀜, 마지막은 에너지 검) ---------- */
function setPlayerWeapon(k){ P.eq=[k,k]; P.wi=0; P.wkey=k; P.ammo=[magOf(0),magOf(1)]; P.relT=0; P.swT=.2; I.zoom=false; buildVM(k); UI.weapon(); }
function ffaRespawn(a){ const m=MAPS[M.map]; let best=m.ffa[0], bd=-1; for(const s of m.ffa){ let d=1e9; for(const o of ACT) if(o!==a&&o.alive) d=Math.min(d,Math.hypot(o.pos.x-s[0],o.pos.z-s[1])); d+=Math.random()*6; if(d>bd){ bd=d; best=s; } }
  placeActor(a,best[0],best[1],Math.atan2(best[0],best[1])); a.inv=1.5; }
function startGun(){ const map=pick(MAP_KEYS), m=MAPS[map]; beginMatch("gun",map); const skill=clamp(.1+G.tro/700,.1,.9), cols=[0xff5252,0xffa726,0xab47bc,0x26a69a,0x8d6e63];
  Object.assign(M,{botDmg:lerp(.4,.9,skill),onKill:gunKill,sbT:0,win:false}); spawnPlayer(m.ffa[0][0],m.ffa[0][1],Math.atan2(m.ffa[0][0],m.ffa[0][1]),"me"); P.gi=0; setPlayerWeapon(GG[0]);
  for(let i=1;i<=5;i++){ const b=addBot({name:botName(),team:"b"+i,col:cols[i-1],lcol:"#ff8a80",wkey:GG[0],skill:skill*rnd(.8,1.1),hat:Math.floor(rnd(0,HATS.length))}); b.gi=0; placeActor(b,m.ffa[i][0],m.ffa[i][1],Math.atan2(m.ffa[i][0],m.ffa[i][1])); }
  M.freeze=4.2; UI.score("","",1); UI.banner("🔁 총 바꾸기","아웃시킬 때마다 총이 바뀌어요. 마지막은 에너지 검!",1.6); }
function gunKill(t,by,info){ onKillCommon(t,by,info); t.respT=2.2; if(!by||by===t||M.phase!=="play") return; by.gi++; const N=GG.length;
  if(by===P){ if(P.gi>N){ M.win=true; M.phase="over"; M.pt=1.6; UI.banner("🏆 우승!","",1.6); return; } SFX.up();
    if(P.gi===N){ P.knifeOnly=true; setPlayerWeapon("knife"); UI.banner("마지막 단계!","🗡️ 에너지 검으로 아웃시키면 우승",2.2); }
    else { setPlayerWeapon(GG[P.gi]); UI.banner(WEAPONS[GG[P.gi]].ic+" "+WEAPONS[GG[P.gi]].n,(P.gi+1)+" / "+(N+1)+" 단계",1.1); } }
  else { if(by.gi>N){ M.win=false; M.phase="over"; M.pt=1.6; UI.banner(by.name+" 우승","다음엔 내가 우승!",1.6); return; } by.wkey=GG[Math.min(by.gi,N-1)]; by.ammo=WEAPONS[by.wkey].mag; by.relT=0; by.pref=PREF[by.wkey]||11; } }
function updateGun(dt){ if(M.phase==="over"){ M.pt-=dt; if(M.pt<=0) endGun(); return; } const N=GG.length;
  for(const a of ACT){ if(!a.alive){ a.respT-=dt; if(a.respT<=0) ffaRespawn(a); } }
  M.sbT-=dt; if(M.sbT<=0){ M.sbT=.4; UI.board(ACT.map(a=>({n:a.name,k:Math.min(a.gi,N)+1,me:a===P})).sort((x,y)=>y.k-x.k)); UI.timer(-1,"내 총 "+(Math.min(P.gi,N)+1)+" / "+(N+1)); } }
function endGun(){ const win=M.win, st=Math.min(P.gi,GG.length)+1; stopMatch(); G.stat.games++; bump("games",1); if(win) G.stat.win++;
  const r=grant(win?120:30+st*5,(win?50:20)+M.kills*5,win?6:0); win?SFX.win():SFX.lose();
  UI.result({title:win?"우승!":"아쉽다…",win,sub:"총 바꾸기 · "+st+" / "+(GG.length+1)+" 단계",lines:[["아웃시킨 적",M.kills],["헤드샷",M.hs]],r,again:"gun"}); }

/* ---------- 🎨 색칠 대결 (3대3, 바닥을 더 많이 칠한 팀이 승리) ---------- */
const PAINT = {g:null,cnt:[0,0],cv:null,cx:null,tex:null,mesh:null,dirty:false,free:1,col:["#2979ff","#ff9100"]};
function paintClear(){ if(PAINT.mesh){ fxG.remove(PAINT.mesh); PAINT.mesh.geometry.dispose(); PAINT.mesh.material.dispose(); PAINT.tex.dispose(); PAINT.mesh=null; } PAINT.g=null; }
function paintInit(){ const n=W.gn; PAINT.g=new Uint8Array(n*n); PAINT.cnt=[0,0]; PAINT.free=0; for(let i=0;i<n*n;i++) if(!W.grid[i]) PAINT.free++;
  const c=PAINT.cv=document.createElement("canvas"); c.width=c.height=n*4; PAINT.cx=c.getContext("2d"); PAINT.tex=new THREE.CanvasTexture(c);
  PAINT.mesh=new THREE.Mesh(new THREE.PlaneGeometry(2*W.S,2*W.S),new THREE.MeshBasicMaterial({map:PAINT.tex,transparent:true,opacity:.8,depthWrite:false})); PAINT.mesh.rotation.x=-Math.PI/2; PAINT.mesh.position.y=.03; fxG.add(PAINT.mesh); }
function paintAt(x,z,r,team){ if(!PAINT.g||(team!==0&&team!==1)) return; const n=W.gn, g=PAINT.g, cx=x+W.S, cz=z+W.S, x0=Math.max(0,Math.floor(cx-r)), x1=Math.min(n-1,Math.floor(cx+r)), z0=Math.max(0,Math.floor(cz-r)), z1=Math.min(n-1,Math.floor(cz+r));
  for(let Z=z0;Z<=z1;Z++) for(let X=x0;X<=x1;X++){ const dx=X+.5-cx, dz=Z+.5-cz; if(dx*dx+dz*dz>r*r) continue; const k=Z*n+X; if(W.grid[k]) continue; const o=g[k]; if(o===team+1) continue; if(o) PAINT.cnt[o-1]--; g[k]=team+1; PAINT.cnt[team]++; }
  const c=PAINT.cx; c.fillStyle=PAINT.col[team]; c.beginPath(); c.arc(cx*4,cz*4,r*4,0,6.2832); c.fill(); PAINT.dirty=true; }
function paintMul(a){ if(M.type!=="paint"||!PAINT.g) return 1; const n=W.gn, v=PAINT.g[clamp(Math.floor(a.pos.z+W.S),0,n-1)*n+clamp(Math.floor(a.pos.x+W.S),0,n-1)]; return v===a.team+1?1.15:v?.85:1; }
function startPaint(){ const map=pick(MAP_KEYS), m=MAPS[map]; beginMatch("paint",map); paintInit(); const skill=clamp(.1+G.tro/700,.1,.9), wp=botWeapons(skill), order=[1,0,2];
  Object.assign(M,{botDmg:lerp(.42,.95,skill),onKill:paintKill,rt:90,wt:0,win:false}); spawnPlayer(m.t0[1][0],m.t0[1][1],0,0); P.home=m.t0[1];
  for(let i=1;i<3;i++){ const s=m.t0[order[i]], b=addBot({name:botName(),team:0,col:0x2979ff,lcol:"#80d8ff",wkey:pick(wp),skill,hat:Math.floor(rnd(0,HATS.length))}); b.home=s; placeActor(b,s[0],s[1],0); }
  for(let i=0;i<3;i++){ const s=m.t0[order[i]], b=addBot({name:botName(),team:1,col:0xff9100,lcol:"#ffcc80",fcol:0xff9100,wkey:pick(wp),skill,hat:Math.floor(rnd(0,HATS.length))}); b.home=[-s[0],-s[1]]; placeActor(b,b.home[0],b.home[1],Math.PI); }
  M.freeze=4.2; UI.score("0%","0%"); UI.timer(M.rt); UI.banner("🎨 색칠 대결","바닥을 파란색으로 더 많이 칠하면 승리!",1.8); }
function paintKill(t,by,info){ onKillCommon(t,by,info); t.respT=3; if(by&&by!==t) paintAt(t.pos.x,t.pos.z,5,by.team); if(t===P) UI.banner("아웃!","3초 뒤 다시 등장",2.4); }
function updatePaint(dt){ if(M.phase==="over"){ M.pt-=dt; if(M.pt<=0) endPaint(); return; }
  for(const a of ACT){ if(!a.alive){ a.respT-=dt; if(a.respT<=0){ placeActor(a,a.home[0],a.home[1],a.team===0?0:Math.PI); a.inv=1.5; } } }
  if(M.freeze>0) return; M.rt-=dt; UI.timer(M.rt); M.wt-=dt;
  if(M.wt<=0){ M.wt=.15; for(const a of ACT) if(a.alive&&a.pos.y<.3) paintAt(a.pos.x,a.pos.z,1.6,a.team); const f=PAINT.free||1; UI.score(Math.round(PAINT.cnt[0]/f*100)+"%",Math.round(PAINT.cnt[1]/f*100)+"%"); if(PAINT.dirty){ PAINT.tex.needsUpdate=true; PAINT.dirty=false; } }
  if(M.rt<=0){ M.win=PAINT.cnt[0]>=PAINT.cnt[1]; M.phase="over"; M.pt=2; UI.banner(M.win?"우리 팀 승리!":"상대 팀 승리","",2); } }
function endPaint(){ const win=M.win, f=PAINT.free||1, a=Math.round(PAINT.cnt[0]/f*100), b=Math.round(PAINT.cnt[1]/f*100); stopMatch(); G.stat.games++; bump("games",1); if(win) G.stat.win++;
  const r=grant(win?90:30,(win?40:15)+M.kills*4,win?6:-3); win?SFX.win():SFX.lose();
  UI.result({title:win?"승리!":"패배…",win,sub:"색칠 대결 · 우리 "+a+"% : 상대 "+b+"%",lines:[["아웃시킨 적",M.kills],["헤드샷",M.hs]],r,again:"paint"}); }

/* ---------- 매 프레임 ---------- */
function updateGame(dt){ M.t+=dt; tickFreeze(dt); updatePlayer(dt);
  for(let i=0;i<ACT.length;i++){ const a=ACT[i]; if(a.isBot) updateBot(a,dt); else if(a.remote) updateRemote(a,dt); updateAvatar(a,dt); }
  updateProj(dt); updatePicks(dt);
  if(M.type==="duel") updateDuel(dt); else if(M.type==="wave") updateWave(dt); else if(M.type==="online") updateOnline(dt); else if(M.type==="gun") updateGun(dt); else if(M.type==="paint") updatePaint(dt); }
