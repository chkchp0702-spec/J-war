"use strict";
/* ===== J war — 게임 모드 (결투 · 총 바꾸기 · 친구와 대결) ===== */
const M = {active:false,paused:false,type:"",phase:"",freeze:0,t:0,map:"toy",botDmg:1,kills:0,hs:0,onKill(){}};

/* ---------- 오늘의 임무 · 보상 ---------- */
function ensureDay(){ const d=new Date(), key=d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); if(G.day===key&&G.mis&&G.mis.length) return;
  G.day=key; G.dayc={}; G.mis=[]; const ks={}; for(const m of MISSIONS.slice().sort(()=>Math.random()-.5)){ if(ks[m.k]) continue; ks[m.k]=1; G.mis.push({id:m.id,got:0}); if(G.mis.length>=3) break; } save(); }
function bump(k,n){ ensureDay(); if(k==="streak") G.dayc[k]=Math.max(G.dayc[k]||0,n); else G.dayc[k]=(G.dayc[k]||0)+n; }
function misReady(){ ensureDay(); return G.mis.filter(x=>{ const m=MISSIONS.find(y=>y.id===x.id); return m&&!x.got&&(G.dayc[m.k]||0)>=m.n; }).length; }
/* 난이도: 쉬움·보통·어려움 + 등급이 오를수록 봇이 똑똑해짐 */
function botSkill(){ return clamp([.18,.42,.68][G.set.diff]+tierIdx(G.rw)*.045,.12,.95); }
/* 보상: 열쇠 + 경험치 (레벨이 오르면 열쇠 덤) */
function grant(keys,xp){ const lv0=lvOf(G.xp); G.xp+=xp; const lv1=lvOf(G.xp), bonus=lv1>lv0?KEY_LV*(lv1-lv0):0; G.keys+=keys+bonus; save(); return {keys,xp,lvUp:lv1>lv0?lv1:0,bonus}; }

/* ---------- 공통 ---------- */
function beginMatch(type,map){ clearActors(); clearFX(); buildMap(map); Object.assign(M,{active:true,paused:false,type,map,t:0,kills:0,hs:0,freeze:0,botDmg:1,phase:"play",pt:0,pwT:9});
  resetInput(); UI.mp(0,0); UI.showGame(); }
function stopMatch(){ M.active=false; M.paused=false; M.phase=""; resetInput(); if(document.exitPointerLock) document.exitPointerLock(); }
function onKillCommon(t,by,info){ { const fc=x=>x===P?"y":(P&&x.team===P.team?"l":"r"); UI.feed(by?by.name:"",t.name,info.w&&WEAPONS[info.w]?WEAPONS[info.w].ic:"💥",by===P||t===P,by?fc(by):"",fc(t)); }
  if(by===P){ if(info.w==="knife") bump("knife",1); if(WKEYS.indexOf(info.w)>=0){ G.wk[info.w]=(G.wk[info.w]||0)+1; if(STAR_AT.indexOf(G.wk[info.w])>=0) toast(WEAPONS[info.w].n+" 숙련도 ★"+stars(info.w)+" 달성!"); } if(P.supT<=0) P.sup=Math.min(100,P.sup+12); M.kills++; G.stat.k++; bump("kills",1); if(info.head){ M.hs++; G.stat.hs++; bump("hs",1); }
    bump("streak",P.streak); const s=P.streak; if(s>=2) UI.streak(s===2?"더블 아웃!":s===3?"트리플 아웃!":s===4?"막을 수 없어!":"전설이다!! ×"+s); } }
function usedNames(){ const u={}; ACT.forEach(a=>u[a.name]=1); return u; }
function botName(){ const u=usedNames(); const f=BOT_NAMES.filter(n=>!u[n]); return pick(f.length?f:BOT_NAMES); }
function tickFreeze(dt){ if(M.freeze<=0) return; const a=Math.ceil(M.freeze); M.freeze-=dt; const b=Math.ceil(M.freeze); if(M.freeze<=0){ UI.banner("시작!","",.8); SFX.go(); } else if(a!==b&&b<=3){ UI.banner(String(b),"",.9); SFX.count(); } }

/* ---------- 결투 (봇전): 1대1 ~ 5대5, 9전 5선승 ---------- */
function botWeapons(skill){ const p=["pistol","rifle","rifle"]; if(skill>.22) p.push("shotgun"); if(skill>.35) p.push("burst"); if(skill>.45) p.push("sniper"); if(skill>.5) p.push("launcher"); if(skill>.65) p.push("minigun"); if(skill>.8) p.push("rainbow"); return p; }
function teamSpots(m,n){ const z=m.t0[1][1], gap=n>3?3.4:n>1?5:0, out=[]; for(let i=0;i<n;i++) out.push([(i-(n-1)/2)*gap,z-(i%2)*1.4]); return out; }
function startDuel(n){ n=clamp(n|0,1,5); const map=pick(MAP_KEYS), m=MAPS[map]; beginMatch("duel",map); const skill=botSkill(), sp=teamSpots(m,n), mine=Math.floor((n-1)/2), wp=botWeapons(skill);
  Object.assign(M,{n,sc:[0,0],round:0,need:5,skill,botDmg:lerp(.7,1.25,skill),onKill:duelKill});
  spawnPlayer(sp[mine][0],sp[mine][1],0,0); P.home=sp[mine];
  for(let i=0;i<n;i++){ if(i===mine) continue; const b=addBot({name:botName(),team:0,col:0x40c4ff,lcol:"#80d8ff",wkey:pick(wp),skill:Math.min(.95,skill+.05)}); b.home=sp[i]; }
  for(let i=0;i<n;i++){ const b=addBot({name:botName(),team:1,col:0xff5252,lcol:"#ff8a80",wkey:pick(wp),skill}); b.home=[-sp[i][0],-sp[i][1]]; }
  duelRound(); }
function duelRound(){ M.round++; for(const p of PROJ) fxG.remove(p.m); PROJ.length=0;
  for(const a of ACT){ placeActor(a,a.home[0],a.home[1],a.team===0?0:Math.PI); a.inv=0; }
  const a=M.sc[0], b=M.sc[1], mp=M.need-1; M.phase="play"; M.freeze=4.2; M.rt=75; UI.score(a,b); UI.mp(a===mp,b===mp);
  if(a===mp||b===mp){ jingle([659,659,988],.12,"square",.16);
    if(a===mp&&b===mp) UI.banner("🔥 매치 포인트!","마지막 한 판! 이기는 팀이 승리",1.6); else if(a===mp) UI.banner("🔥 매치 포인트!","한 판만 더 이기면 승리!",1.6); else UI.banner("⚠️ 상대 매치 포인트","이번 판을 꼭 막아야 해요!",1.6); }
  else UI.banner("라운드 "+M.round,"9전 5선승 · 먼저 "+M.need+"판 이기면 승리!",1.4); }
function teamAlive(t){ let n=0; for(const a of ACT) if(a.team===t&&a.alive) n++; return n; }
function duelKill(t,by,info){ onKillCommon(t,by,info); if(M.phase!=="play") return;
  if(!teamAlive(1)) duelEndRound(0); else if(!teamAlive(0)) duelEndRound(1); else if(t===P) UI.banner("아웃!","동료가 싸우는 중… 응원해요",2.5); }
function duelEndRound(w){ M.phase="roundEnd"; M.sc[w]++; M.pt=2.8; UI.score(M.sc[0],M.sc[1]); const last=M.sc[w]>=M.need; if(last) UI.mp(0,0);
  for(const a of ACT) if(a.isBot&&a.alive&&a.team===w) startDance(a,pick(DANCES).id,last?3:2);   /* 이긴 팀 봇은 춤을 춤 */
  if(w===0){ UI.banner(last?"🏆 결투 승리!":"라운드 승리!",M.sc[0]+" : "+M.sc[1],2.2); jingle([784,1047],.1); } else { UI.banner(last?"결투 패배":"라운드 패배",last?M.sc[0]+" : "+M.sc[1]:"다음 판에 뒤집자!",2.2); tone(220,.3,"triangle",.2,150); } }
function updateDuel(dt){ if(M.phase==="play"&&M.freeze<=0){ M.rt-=dt; UI.timer(M.rt);
    if(M.rt<=0){ let h0=0,h1=0; for(const a of ACT){ if(!a.alive) continue; if(a.team===0) h0+=a.hp; else h1+=a.hp; } duelEndRound(h0>=h1?0:1); } }
  else if(M.phase==="roundEnd"){ M.pt-=dt; if(M.pt<=0){ if(M.sc[0]>=M.need||M.sc[1]>=M.need) endDuel(M.sc[0]>M.sc[1]); else duelRound(); } } }
function endDuel(win){ stopMatch(); G.stat.games++; bump("games",1); const R=G.rec, t0=tierIdx(G.rw), m=R.m[M.n]||(R.m[M.n]=[0,0]);
  if(win){ G.stat.win++; bump("duelWin",1); G.rw++; R.w++; R.cur++; R.best=Math.max(R.best,R.cur); m[0]++; } else { R.l++; R.cur=0; m[1]++; }
  const up=tierIdx(G.rw)>t0, tier=tierOf(G.rw); G.hist.unshift({d:Date.now(),n:M.n,a:M.sc[0],b:M.sc[1],w:win?1:0,k:M.kills,h:M.hs}); if(G.hist.length>20) G.hist.length=20;
  const r=grant((win?KEY_WIN[G.set.diff]:KEY_LOSE)+(up?KEY_TIER:0),(win?40:15)+M.kills*5); win?SFX.win():SFX.lose();
  UI.result({title:win?"승리!":"패배…",win,sub:M.n+"대"+M.n+" 결투 · "+M.sc[0]+" : "+M.sc[1],lines:[["아웃시킨 적",M.kills],["헤드샷",M.hs],["연승",R.cur]],r,again:"duel:"+M.n,up:up?tier:null,rank:1}); }

/* ---------- 친구와 대결 (온라인, 모두가 적) ---------- */
function remoteActor(p){ let a=ACT.find(x=>x.id===p.id); if(a) return a;
  a=newActor({id:p.id,name:p.n||"친구",team:p.id,remote:true,col:0xff5252,hat:0,wkey:WEAPONS[p.w]?p.w:"rifle",lcol:"#ff8a80"});
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
function netEmote(d,a){ if(M.type!=="online"||!M.active||!a.alive) return; const x=DANCES.find(y=>y.id===d.d); if(x) startDance(a,x.id,d.g); }
function scoreRows(){ const rows=[{n:P?P.name:G.name,k:P?P.kills:0,d:P?P.deaths:0,me:1}]; for(const id in NET.peers){ const p=NET.peers[id]; rows.push({n:p.n,k:p.k||0,d:p.dd||0}); } return rows.sort((a,b)=>b.k-a.k||a.d-b.d); }
function updateOnline(dt){ const left=(M.end-Date.now())/1000; UI.timer(left);
  if(!P.alive){ M.resp-=dt; if(M.resp<=0) onlineSpawn(); }
  M.sbT-=dt; if(M.sbT<=0){ M.sbT=.5; UI.board(scoreRows().slice(0,5)); }
  if(left<=0) endOnline(); }
function endOnline(){ const rows=scoreRows(), rank=rows.findIndex(r=>r.me)+1, multi=rows.length>1; stopMatch(); NET.finished[M.mid]=1; G.stat.games++; bump("games",1); if(multi) bump("online",1);
  if(M.kills>G.best.kills) G.best.kills=M.kills; const first=multi&&rank===1; if(first) G.stat.win++;
  const r=grant(multi?(first?4:2):0,20+M.kills*6); first?SFX.win():jingle([523,659,784],.1);
  UI.result({title:first?"1등!":rank+"등",win:first,sub:"친구와 대결 · "+MAPS[M.map].n,lines:[["아웃시킨 적",M.kills],["헤드샷",M.hs]],r,rows,again:"lobby"}); }

/* ---------- 🔁 총 바꾸기 (아웃시킬 때마다 총이 바뀜, 마지막은 에너지 검) ---------- */
function setPlayerWeapon(k){ P.eq=[k,k]; P.wi=0; P.wkey=k; P.ammo=[magOf(0),magOf(1)]; P.relT=0; P.swT=.2; P.bq=0; I.zoom=false; buildVM(k); UI.weapon(); }
function ffaRespawn(a){ const m=MAPS[M.map]; let best=m.ffa[0], bd=-1; for(const s of m.ffa){ let d=1e9; for(const o of ACT) if(o!==a&&o.alive) d=Math.min(d,Math.hypot(o.pos.x-s[0],o.pos.z-s[1])); d+=Math.random()*6; if(d>bd){ bd=d; best=s; } }
  placeActor(a,best[0],best[1],Math.atan2(best[0],best[1])); a.inv=1.5; }
function startGun(){ const map=pick(MAP_KEYS), m=MAPS[map]; beginMatch("gun",map); const skill=botSkill(), cols=[0xff5252,0xffa726,0xab47bc,0x26a69a,0x8d6e63];
  Object.assign(M,{botDmg:lerp(.6,1.15,skill),onKill:gunKill,sbT:0,win:false}); spawnPlayer(m.ffa[0][0],m.ffa[0][1],Math.atan2(m.ffa[0][0],m.ffa[0][1]),"me"); P.gi=0; setPlayerWeapon(GG[0]);
  for(let i=1;i<=5;i++){ const b=addBot({name:botName(),team:"b"+i,col:cols[i-1],lcol:"#ff8a80",wkey:GG[0],skill:skill*rnd(.8,1.1)}); b.gi=0; placeActor(b,m.ffa[i][0],m.ffa[i][1],Math.atan2(m.ffa[i][0],m.ffa[i][1])); }
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
  const r=grant(win?4:1,(win?50:20)+M.kills*5); win?SFX.win():SFX.lose();
  UI.result({title:win?"우승!":"아쉽다…",win,sub:"총 바꾸기 · "+st+" / "+(GG.length+1)+" 단계",lines:[["아웃시킨 적",M.kills],["헤드샷",M.hs]],r,again:"gun"}); }

/* ---------- 매 프레임 ---------- */
function updateGame(dt){ M.t+=dt; tickFreeze(dt); updatePlayer(dt);
  for(let i=0;i<ACT.length;i++){ const a=ACT[i]; if(a.isBot) updateBot(a,dt); else if(a.remote) updateRemote(a,dt); updateAvatar(a,dt); }
  updateProj(dt); updatePicks(dt);
  if(M.type!=="online"&&M.phase==="play"&&M.freeze<=0){ M.pwT-=dt; if(M.pwT<=0){ M.pwT=13; if(PICK.length<3) dropPower(); } }
  if(M.type==="duel") updateDuel(dt); else if(M.type==="online") updateOnline(dt); else if(M.type==="gun") updateGun(dt); }
