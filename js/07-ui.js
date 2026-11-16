"use strict";
/* ===== J war — 화면(UI) · 메뉴 · 메인 루프 ===== */
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const UI = {scr:"home",bT:0,sT:0,hT:0,vg:0,ind:[0,0,0],indI:0,
  showGame(){ $("menu").classList.add("hide"); $("panel").classList.add("hide"); $("hud").classList.remove("hide"); $("cards").classList.add("hide"); $("feed").innerHTML=""; $("board").classList.toggle("hide",M.type!=="online");
    $("banner").classList.remove("s"); $("streak").classList.remove("s"); UI.scr="game"; UI.weapon(); UI.vg=0; },
  showMenu(){ $("hud").classList.add("hide"); $("panel").classList.add("hide"); $("menu").classList.remove("hide"); UI.scr="home"; UI.home(); },
  panel(title,html,scr){ $("pTitle").textContent=title; $("pBody").innerHTML=html; $("pCoin").textContent="🪙 "+G.coins; $("panel").classList.remove("hide"); UI.scr=scr||"panel"; $("pBody").scrollTop=0; },
  weapon(){ if(!P) return; $("wpnName").textContent=WEAPONS[P.wkey].ic+" "+WEAPONS[P.wkey].n; $("btnZoom").style.visibility=WEAPONS[P.wkey].zoom?"visible":"hidden"; },
  hitmark(k){ const h=$("hitm"); h.className="s "+k; UI.hT=.12; },
  hurt(by,amt){ UI.vg=Math.min(1,UI.vg+.25+amt/60); SFX.hurt(); if(!by||!P) return; const dx=by.pos.x-P.pos.x, dz=by.pos.z-P.pos.z, s=Math.sin(P.yaw), c=Math.cos(P.yaw);
    const ang=Math.atan2(dx*c-dz*s,-dx*s-dz*c)*180/Math.PI, i=UI.indI=(UI.indI+1)%3, el=$("dmgInd").children[i]; el.style.transform="rotate("+ang+"deg)"; UI.ind[i]=1; },
  feed(a,b,ic,me){ const f=$("feed"), d=document.createElement("div"); if(me) d.className="me"; d.textContent=(a?a+" ":"")+ic+" "+b; f.appendChild(d); while(f.children.length>4) f.removeChild(f.firstChild); setTimeout(()=>{ if(d.parentNode) d.parentNode.removeChild(d); },4500); },
  banner(t,sub,sec){ const b=$("banner"); b.innerHTML=esc(t)+(sub?"<small>"+esc(sub)+"</small>":""); b.classList.add("s"); UI.bT=sec||1.5; },
  streak(t){ const s=$("streak"); s.textContent="🔥 "+t; s.classList.add("s"); UI.sT=1.6; jingle([880,1175,1568],.06,"square",.12); },
  score(l,r,hide){ $("scL").style.display=$("scR").style.display=hide?"none":""; $("scL").textContent=l; $("scR").textContent=r; },
  timer(sec,txt){ const el=$("timer"); if(txt){ if(el.textContent!==txt) el.textContent=txt; return; } const s=Math.max(0,Math.ceil(sec)), v=Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); if(el.textContent!==v) el.textContent=v; },
  board(rows){ $("board").innerHTML=rows.map((r,i)=>`<div class="${r.me?"me":""}"><span>${i+1}. ${esc(r.n)}</span><b>${r.k}</b></div>`).join(""); },
  net(t){ const p=$("netPill"); p.textContent=t; p.classList.toggle("hide",!t); },
  cards(list){ $("cards").innerHTML="<h2>강화 카드를 하나 골라요</h2><div class='row'>"+list.map(u=>`<button class="card" data-a="card" data-v="${u.id}"><b>${u.ic}</b><span>${u.n}</span><small>${u.d}</small></button>`).join("")+"</div>"; $("cards").classList.remove("hide"); },
  hud(dt){ if(!P) return; const hp=clamp(P.hp/P.maxhp,0,1), f=$("hpFill"); f.style.width=(hp*100)+"%"; f.style.background=hp>.5?"linear-gradient(#7CFF6B,#27c93f)":hp>.25?"linear-gradient(#ffe36b,#ffa000)":"linear-gradient(#ff8a80,#e53935)";
    $("hpTxt").textContent=Math.ceil(P.hp)+(P.inv>0?" 🛡️":""); $("dashFill").style.width=(100*(1-clamp(P.dashLeft/P.dashCd,0,1)))+"%";
    $("ammoTxt").innerHTML=P.relT>0?"<small>장전 중…</small>":P.ammo[P.wi]+"<small> / "+magOf(P.wi)+"</small>";
    const cr=$("cross"), zoomed=camera.fov<50; cr.style.display=zoomed||!P.alive?"none":""; cr.style.setProperty("--g",(5+Math.min(14,Math.hypot(P.vel.x,P.vel.z)*1.1+(P.ground?0:5)+VM.kick*6))+"px"); cr.classList.toggle("on",I.onTarget);
    $("scope").classList.toggle("hide",!zoomed);
    if(UI.hT>0){ UI.hT-=dt; if(UI.hT<=0) $("hitm").className=""; }
    if(UI.bT>0){ UI.bT-=dt; if(UI.bT<=0) $("banner").classList.remove("s"); } if(UI.sT>0){ UI.sT-=dt; if(UI.sT<=0) $("streak").classList.remove("s"); }
    UI.vg=Math.max(0,UI.vg-dt*1.2); $("vign").style.opacity=Math.max(UI.vg,hp<.3&&P.alive?.35:0); $("frost").style.opacity=P.slowT>0?.8:0;
    for(let i=0;i<3;i++) if(UI.ind[i]>0){ UI.ind[i]=Math.max(0,UI.ind[i]-dt*1.3); $("dmgInd").children[i].style.opacity=UI.ind[i]; } },

  /* ----- 홈 ----- */
  home(){ ensureDay(); const lv=lvOf(G.xp), t=tierOf(G.tro);
    $("me").innerHTML=`<button class="chip" data-a="name">✏️ ${esc(G.name||"이름 정하기")}</button><span class="chip">Lv.${lv}</span><span class="chip">🪙 ${G.coins}</span><span class="chip" style="color:${t.c}">🏆 ${G.tro} ${t.n}</span>`;
    $("ver").textContent="버전 v"+VER+" · 최고 웨이브 "+G.best.wave; $("misDot").classList.toggle("hide",!misReady()); $("patchDot").classList.toggle("hide",G.seenVer>=VER); },
  result(o){ const r=o.r; let h=`<div id="res"><h1 style="color:${o.win?"#ffd740":"#cfd8dc"}">${esc(o.title)}</h1><div>${esc(o.sub)}</div><div class="rw"><span class="chip">🪙 +${r.coins}</span><span class="chip">✨ 경험치 +${r.xp}</span>${r.tro?`<span class="chip">🏆 ${r.tro>0?"+":""}${r.tro}</span>`:""}${r.lvUp?`<span class="chip" style="background:#ffd740;color:#222">🎉 레벨 ${r.lvUp}! 🪙 +${r.bonus}</span>`:""}</div>`;
    if(o.rows) h+=`<table class="sb" style="max-width:420px;margin:0 auto 8px">${o.rows.map((x,i)=>`<tr class="${x.me?"me":""}"><td>${i+1}등</td><td>${esc(x.n)}</td><td>${x.k} 아웃</td></tr>`).join("")}</table>`;
    else h+=`<div class="rw">${o.lines.map(l=>`<span class="chip">${l[0]} ${l[1]}</span>`).join("")}</div>`;
    h+=`<div class="rowb"><button class="btn y" data-a="again" data-v="${o.again}">${o.again==="lobby"?"방으로 돌아가기":"🔁 한 판 더!"}</button><button class="btn" data-a="home">홈으로</button></div></div>`;
    $("hud").classList.add("hide"); $("menu").classList.remove("hide"); UI.home(); UI.panel("결과",h,"result"); if(r.lvUp) SFX.up(); },
  lobby(){ if(UI.scr!=="lobby") return; const host=NET.isHost(), ps=[{n:G.name+" (나)",h:host}]; let hostId=""; if(!host){ let j=1e18; for(const k in NET.peers){ const p=NET.peers[k]; if(p.j&&p.j<j){ j=p.j; hostId=k; } } }
    for(const k in NET.peers) ps.push({n:NET.peers[k].n,h:k===hostId});
    const cur=NET.cur&&NET.cur.end>Date.now()+4000&&!NET.finished[NET.cur.mid];
    $("pBody").innerHTML=`<div style="text-align:center"><div style="font-size:13px;opacity:.8">방 번호 (친구에게 알려 주세요)</div>
      <div class="rowb" style="align-items:center;margin-top:0"><span style="font-size:42px;font-weight:900;letter-spacing:8px;color:#ffd740;line-height:1.1">${esc(NET.room)}</span><button class="btn" data-a="invite">🔗 초대 링크</button></div>
      <div style="margin:6px 0;font-size:13px">${NET.up>0?"🟢 서버 연결됨":"🟡 서버에 연결 중…"} · ${ps.length}명 / 8명</div>
      <div class="rowb">${ps.map(p=>`<span class="chip">${p.h?"👑 ":""}${esc(p.n)}</span>`).join("")}</div>
      ${host?`<div style="margin-top:8px;font-size:13px">맵 고르기</div><div class="rowb">${MAP_KEYS.map(k=>`<button class="btn ${UI.lmap===k?"y":""}" data-a="lmap" data-v="${k}">${MAPS[k].ic} ${MAPS[k].n}</button>`).join("")}</div>
      <div class="rowb" style="margin-top:10px"><button class="btn g" style="font-size:18px;padding:10px 30px" data-a="lstart">▶ 대결 시작 (3분)</button></div><div style="font-size:11px;opacity:.7;margin-top:6px">혼자서도 시작할 수 있어요. 친구는 도중에 들어올 수 있어요.</div>`
      :`<div style="margin-top:16px;font-size:16px;font-weight:900">${cur?"곧 대결에 들어가요…":"👑 방장이 시작하기를 기다리는 중…"}</div>`}</div>`; },
};

/* ---------- 메뉴 화면들 ---------- */
function statBar(l,v){ return `<div>${l}<u><s style="width:${clamp(v,4,100)}%"></s></u></div>`; }
function scrArmory(){ const h=WKEYS.map(k=>{ const w=WEAPONS[k], own=G.own[k], e0=G.eq[0]===k, e1=G.eq[1]===k;
    return `<div class="item ${e0||e1?"on":""}"><div class="ic">${w.ic}</div><h4>${w.n}</h4><div>${w.desc}</div><div class="bars">${statBar("피해",w.dmg*(w.pel||1)*1.05)}${statBar("연사",8/w.rate/1.6)}${statBar("탄창",w.mag/1.2)}</div>
      <div class="rowb">${own?`<button class="btn ${e0?"y":""}" data-a="eq" data-v="0:${k}">${e0?"✔ 주무기":"주무기"}</button><button class="btn ${e1?"y":""}" data-a="eq" data-v="1:${k}">${e1?"✔ 보조":"보조"}</button>`
      :`<button class="btn g ${G.coins<w.cost?"off":""}" data-a="buyW" data-v="${k}">🪙 ${w.cost} 사기</button>`}</div></div>`; }).join("");
  UI.panel("🔫 무기고",`<div class="grid">${h}</div>`,"armory"); }
function scrSkins(){ const sw=SKINS.map((s,i)=>`<button class="${G.skin===i?"on":""} ${G.ownSkin[i]?"":"lock"}" style="background:#${s.c.toString(16).padStart(6,"0")}" data-a="skin" data-v="${i}" title="${s.n}">${G.ownSkin[i]?"":"🔒"}</button>`).join("");
  const ht=HATS.map((s,i)=>`<button class="${G.hat===i?"on":""} ${G.ownHat[i]?"":"lock"}" style="background:#18214f" data-a="hat" data-v="${i}">${s.ic}</button>`).join("");
  const ps=SKINS[UI.selS==null?G.skin:UI.selS], ph=HATS[UI.selH==null?G.hat:UI.selH];
  UI.panel("🎨 꾸미기",`<div class="line"><div class="f"><b>옷 색깔</b> — ${ps.n} ${G.ownSkin[SKINS.indexOf(ps)]?"":"(🪙 "+ps.cost+")"}<div class="sw" style="margin-top:6px">${sw}</div></div></div>
    <div class="line"><div class="f"><b>머리 장식</b> — ${ph.n} ${G.ownHat[HATS.indexOf(ph)]?"":"(🪙 "+ph.cost+")"}<div class="sw" style="margin-top:6px">${ht}</div></div></div>
    <div style="font-size:12px;opacity:.75">🔒 을 누르면 코인으로 살 수 있어요. 친구와 대결할 때 친구 화면에 내 모습이 보여요.</div>`,"skins"); }
function scrMissions(){ ensureDay(); const h=G.mis.map(x=>{ const m=MISSIONS.find(y=>y.id===x.id); if(!m) return ""; const v=Math.min(m.n,G.dayc[m.k]||0), done=v>=m.n;
    return `<div class="line"><div class="f"><b>${m.txt}</b><small>${v} / ${m.n}</small><div class="prog"><s style="width:${v/m.n*100}%"></s></div></div>${x.got?`<span class="chip">✔ 받음</span>`:`<button class="btn ${done?"y":"off"}" data-a="claim" data-v="${m.id}">🪙 ${m.rw}</button>`}</div>`; }).join("");
  UI.panel("🎯 오늘의 임무",h+`<div style="font-size:12px;opacity:.75">임무는 날마다 새로 바뀌어요.</div>`,"missions"); }
function scrSettings(){ UI.panel("⚙️ 설정",`
  <div class="line"><div class="f"><b>화면 돌리는 빠르기</b><small>${G.set.sens.toFixed(1)}배</small></div><input type="range" min="0.4" max="2.5" step="0.1" value="${G.set.sens}" id="sens"></div>
  <div class="line"><div class="f"><b>자동 발사</b><small>조준점이 적에게 닿으면 알아서 쏴요 (휴대폰 추천)</small></div><button class="btn ${G.set.auto?"y":""}" data-a="tog" data-v="auto">${G.set.auto?"켜짐":"꺼짐"}</button></div>
  <div class="line"><div class="f"><b>소리</b></div><button class="btn ${G.set.snd?"y":""}" data-a="tog" data-v="snd">${G.set.snd?"켜짐":"꺼짐"}</button></div>
  <div class="line"><div class="f"><b>그래픽</b><small>버벅이면 '가볍게'로 (다음에 켤 때 적용)</small></div><button class="btn" data-a="tog" data-v="gfx">${G.set.gfx?"선명하게":"가볍게"}</button></div>
  ${M.active?"":`<div class="line"><div class="f"><b>기록 모두 지우기</b><small>코인·무기·등급이 모두 사라져요</small></div><button class="btn r" data-a="wipe">지우기</button></div>`}`,M.active?"pause2":"settings"); }
function scrPatch(){ G.seenVer=VER; save(); UI.panel("📜 패치 노트",PATCH.map(p=>`<div class="line"><div class="f"><b>v${p.v} — ${esc(p.t)}</b><small>${p.d}</small><ul style="margin:6px 0 0;padding-left:18px;font-size:13px">${p.l.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div></div>`).join(""),"patch"); }
function scrHelp(){ UI.panel("❓ 조작법",`
  <div class="line"><div class="f"><b>📱 휴대폰 · 태블릿</b><small style="font-size:13px;opacity:1;line-height:1.7">왼쪽 화면을 끌면 이동 · 오른쪽 화면을 끌면 둘러보기<br>🔥 발사(누른 채 끌면 조준도 됨) · 점프(공중에서 한 번 더!) · 대시 · 장전 · 무기 교체<br>저격총은 '조준'을 누르면 확대돼요</small></div></div>
  <div class="line"><div class="f"><b>💻 컴퓨터</b><small style="font-size:13px;opacity:1;line-height:1.7">WASD 이동 · 마우스 조준 · 왼쪽 클릭 발사 · 오른쪽 클릭 확대<br>스페이스 점프 · Shift 대시 · R 장전 · Q 무기 교체 · Esc 멈춤</small></div></div>
  <div class="line"><div class="f"><b>💡 꿀팁</b><small style="font-size:13px;opacity:1;line-height:1.7">머리를 맞히면 피해가 1.6배! · 노란 점프대를 밟으면 높이 날아요<br>4초 동안 안 맞으면 체력이 저절로 차요 · 로켓을 발밑에 쏘면 로켓 점프!</small></div></div>`,"help"); }
function scrDuel(){ const t=tierOf(G.tro), nx=TIERS[TIERS.indexOf(t)+1];
  UI.panel("⚔️ 결투",`<div style="text-align:center;font-size:14px">내 등급 <b style="color:${t.c}">🏆 ${G.tro} ${t.n}</b>${nx?` · 다음 등급 ${nx.n}까지 ${nx.t-G.tro}`:""}<br><small style="opacity:.75">먼저 3판을 이기면 승리! 등급이 오를수록 봇이 똑똑해져요.</small></div>
  <div class="modes">${[1,2,3].map(n=>`<button class="mode" data-a="duel" data-v="${n}"><b>${n===1?"🧍":n===2?"🧑‍🤝‍🧑":"👨‍👩‍👦"}</b>${n} 대 ${n}<small>${n===1?"나 혼자 승부":"봇 동료 "+(n-1)+"명과 함께"}</small><small>승리 🪙 ${50+25*n} · 🏆 +${10+2*n}</small></button>`).join("")}</div>`,"duel"); }
function scrOnline(code){ UI.panel("🌐 친구와 대결",`<div style="text-align:center">
  <div class="modes"><div class="mode" style="width:230px"><b>🏠</b>방 만들기<small>방 번호가 생겨요. 친구에게 알려 주세요</small><div class="rowb"><button class="btn y" data-a="mkroom">방 만들기</button></div></div>
  <div class="mode" style="width:230px"><b>🚪</b>방 들어가기<small>친구가 알려 준 번호 4자리</small><div class="rowb"><input type="tel" id="roomIn" maxlength="4" placeholder="0000" value="${esc(code||"")}" style="width:110px"><button class="btn g" data-a="joinroom">들어가기</button></div></div></div>
  <div style="font-size:12px;opacity:.75;margin-top:12px">같은 방 번호를 넣은 사람끼리 만나요 (최대 8명). 모두가 적! 3분 동안 가장 많이 아웃시키면 1등.<br>공개 중계 서버를 써서, 이름과 위치만 주고받아요.</div></div>`,"online"); }
function scrName(first){ UI.panel(first?"👋 J war 에 온 걸 환영해요!":"✏️ 이름 바꾸기",`<div style="text-align:center;margin-top:10px"><div style="margin-bottom:10px">게임에서 쓸 이름을 정해요 (8글자까지)</div>
  <input type="text" id="nameIn" maxlength="8" value="${esc(G.name)}" placeholder="이름"><div class="rowb" style="margin-top:12px"><button class="btn y" data-a="setname">확인</button></div></div>`,"name"); }
function scrPause(){ UI.panel(M.type==="online"?"메뉴 (대결은 계속돼요)":"⏸ 잠깐 멈춤",`<div class="rowb" style="margin-top:20px"><button class="btn y" style="font-size:18px;padding:12px 28px" data-a="resume">▶ 계속하기</button><button class="btn" data-a="settings">⚙️ 설정</button><button class="btn r" data-a="quit">나가기</button></div>`,"pause"); }

/* ---------- 버튼 동작 ---------- */
const UIA = {
  back(){ if(UI.scr==="lobby"){ NET.leave(); UI.showMenu(); } else if(UI.scr==="pause") UIA.resume(); else if(UI.scr==="pause2") scrPause(); else if(UI.scr==="name"&&!G.name) return; else if(UI.scr==="result") UIA.home(); else { $("panel").classList.add("hide"); UI.scr="home"; UI.home(); } },
  home(){ if(NET.on) NET.leave(); UI.showMenu(); },
  duelMenu(){ scrDuel(); }, duel(v){ startDuel(+v||1); }, wave(){ startWave(); },
  online(){ scrOnline(""); }, armory(){ scrArmory(); }, skins(){ UI.selS=UI.selH=null; scrSkins(); }, missions(){ scrMissions(); }, settings(){ scrSettings(); }, patch(){ scrPatch(); UI.home(); }, help(){ scrHelp(); }, name(){ scrName(false); },
  setname(){ const v=$("nameIn").value.trim().slice(0,8); if(!v){ toast("이름을 적어 주세요"); return; } G.name=v; save(); $("panel").classList.add("hide"); UI.scr="home"; UI.home(); if(UI.pendingRoom){ const c=UI.pendingRoom; UI.pendingRoom=""; UIA.enter(c); } },
  buyW(k){ const w=WEAPONS[k]; if(G.coins<w.cost){ toast("코인이 "+(w.cost-G.coins)+" 모자라요"); return; } G.coins-=w.cost; G.own[k]=1; save(); SFX.coin(); toast(w.n+" 을(를) 얻었어요!"); scrArmory(); },
  eq(v){ const [s,k]=v.split(":"), i=+s; if(!G.own[k]) return; if(G.eq[1-i]===k) G.eq[1-i]=G.eq[i]; G.eq[i]=k; save(); scrArmory(); },
  skin(v){ const i=+v, s=SKINS[i]; if(!G.ownSkin[i]){ if(UI.selS!==i){ UI.selS=i; scrSkins(); toast(s.n+" · 🪙 "+s.cost+" — 한 번 더 누르면 사요"); return; } if(G.coins<s.cost){ toast("코인이 모자라요"); return; } G.coins-=s.cost; G.ownSkin[i]=1; SFX.coin(); } G.skin=i; UI.selS=null; save(); scrSkins(); },
  hat(v){ const i=+v, s=HATS[i]; if(!G.ownHat[i]){ if(UI.selH!==i){ UI.selH=i; scrSkins(); toast(s.n+" · 🪙 "+s.cost+" — 한 번 더 누르면 사요"); return; } if(G.coins<s.cost){ toast("코인이 모자라요"); return; } G.coins-=s.cost; G.ownHat[i]=1; SFX.coin(); } G.hat=i; UI.selH=null; save(); scrSkins(); },
  claim(id){ const m=MISSIONS.find(y=>y.id===id), x=G.mis.find(y=>y.id===id); if(!m||!x||x.got||(G.dayc[m.k]||0)<m.n) return; x.got=1; G.coins+=m.rw; save(); SFX.coin(); toast("🪙 +"+m.rw); scrMissions(); },
  tog(k){ G.set[k]=G.set[k]?0:1; save(); scrSettings(); },
  wipe(){ if(UI.wipeT&&Date.now()-UI.wipeT<4000){ localStorage.removeItem(SAVE_KEY); location.reload(); } else { UI.wipeT=Date.now(); toast("정말 지우려면 한 번 더 눌러요"); } },
  pause(){ if(!M.active||UI.scr!=="game") return; if(M.type!=="online") M.paused=true; resetInput(); if(document.exitPointerLock) document.exitPointerLock(); scrPause(); },
  resume(){ M.paused=false; $("panel").classList.add("hide"); UI.scr="game"; lastT=0; },
  quit(){ const on=M.type==="online"; stopMatch(); if(on) NET.leave(); UI.showMenu(); },
  card(id){ pickCard(id); },
  again(v){ if(v==="wave") startWave(); else if(v==="lobby"){ if(NET.on){ UI.panel("🌐 대결 방","","lobby"); UI.lobby(); } else UIA.online(); } else startDuel(+v.split(":")[1]||1); },
  mkroom(){ UIA.enter(String(Math.floor(1000+Math.random()*9000))); },
  joinroom(){ const v=$("roomIn").value.replace(/\D/g,""); if(v.length!==4){ toast("방 번호 4자리를 넣어 주세요"); return; } UIA.enter(v); },
  enter(code){ if(!G.name){ UI.pendingRoom=code; scrName(true); return; } if(!/^https?:/.test(location.protocol)&&!NET.FAKE){ toast("같이 하기는 게임 주소로 열었을 때만 돼요"); return; } NET.joinRoom(code); UI.lmap=UI.lmap||"toy"; UI.panel("🌐 대결 방","","lobby"); UI.lobby(); },
  lmap(k){ UI.lmap=k; UI.lobby(); }, lstart(){ if(NET.up<=0){ toast("서버에 연결되는 중이에요. 잠시만요"); return; } NET.startMatch(UI.lmap||"toy"); },
  invite(){ const url=location.origin+location.pathname+"?room="+NET.room, txt="J war 같이 하자! 방 번호 "+NET.room;
    if(navigator.share){ navigator.share({title:"J war",text:txt,url}).catch(()=>{}); } else if(navigator.clipboard){ navigator.clipboard.writeText(txt+" "+url).then(()=>toast("초대 링크를 복사했어요")).catch(()=>toast(url)); } else toast(url); },
};
document.addEventListener("click",e=>{ const b=e.target.closest("[data-a]"); if(!b) return; if(b.classList.contains("off")) { toast("아직 안 돼요"); return; } const f=UIA[b.dataset.a]; if(f){ SFX.click(); f(b.dataset.v,b); } });
document.addEventListener("input",e=>{ if(e.target.id==="sens"){ G.set.sens=+e.target.value; save(); e.target.parentNode.querySelector("small").textContent=G.set.sens.toFixed(1)+"배"; } });
document.addEventListener("visibilitychange",()=>{ if(document.hidden){ if(M.active&&M.type!=="online"&&UI.scr==="game") UIA.pause(); } else if(!M.active) checkVersion(); });

/* ---------- 새 버전 확인 (패치가 올라오면 바로 새 버전으로) ---------- */
function checkVersion(){ if(!/^https?:/.test(location.protocol)) return; fetch("version.json?t="+Date.now(),{cache:"no-store"}).then(r=>r.json()).then(j=>{
    if(j&&j.v>VER&&!M.active){ const q=new URLSearchParams(location.search); if(+q.get("v")===j.v) return; q.set("v",j.v); location.replace(location.pathname+"?"+q.toString()); } }).catch(()=>{}); }

/* ---------- 메인 루프 ---------- */
let lastT = 0;
function frame(t){ requestAnimationFrame(frame); const now=t/1000; let dt=lastT?Math.min(.05,now-lastT):.016; lastT=now; if(dt<=0) dt=.001;
  NET.tick(dt);
  if(M.active&&!M.paused){ updateGame(dt); updateVM(dt); updateFX(dt,now); UI.hud(dt); }
  else if(!M.active){ const a=now*.12, S=W.S; camera.position.set(Math.cos(a)*S*.8,13,Math.sin(a)*S*.8); camera.lookAt(0,1,0); if(camera.fov!==75){ camera.fov=75; camera.updateProjectionMatrix(); } updateFX(dt,now); VM.g.visible=false; }
  renderer.clear(); renderer.render(scene,camera); if(VM.g.visible&&M.active){ renderer.clearDepth(); renderer.render(vmScene,vmCam); } }

/* ---------- 시작 ---------- */
(function boot(){ if(TOUCH) document.body.classList.add("touch"); initGL(); buildMap(pick(MAP_KEYS)); ensureDay(); UI.home(); checkVersion();
  const room=(new URLSearchParams(location.search).get("room")||"").replace(/\D/g,"").slice(0,4);
  if(!G.name){ if(room.length===4) UI.pendingRoom=room; scrName(true); } else if(room.length===4) UIA.enter(room);
  window.__jw={M,G,ACT,W,NET,UI,UIA,I,get P(){ return P; },step(dt,n){ for(let i=0;i<(n||1);i++){ if(M.active&&!M.paused) updateGame(dt); } }};
  requestAnimationFrame(frame); })();
