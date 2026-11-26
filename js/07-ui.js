"use strict";
/* ===== J war — 화면(UI) · 메뉴 · 메인 루프 ===== */
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const UI = {scr:"home",bT:0,sT:0,hT:0,vg:0,ind:[0,0,0],indI:0,
  showGame(){ $("menu").classList.add("hide"); $("panel").classList.add("hide"); $("hud").classList.remove("hide"); $("emo").classList.add("hide"); UI.emoOn=false; $("feed").innerHTML=""; $("board").classList.toggle("hide",M.type!=="online"&&M.type!=="gun");
    $("banner").classList.remove("s"); $("streak").classList.remove("s"); UI.scr="game"; UI.weapon(); UI.vg=0; },
  showMenu(){ $("hud").classList.add("hide"); $("panel").classList.add("hide"); $("menu").classList.remove("hide"); UI.scr="home"; UI.home(); },
  panel(title,html,scr){ $("pTitle").textContent=title; $("pBody").innerHTML=html; $("pCoin").textContent="🔑 "+G.keys; $("panel").classList.remove("hide"); UI.scr=scr||"panel"; $("pBody").scrollTop=0; },
  weapon(){ if(!P) return; $("wpnName").textContent=WEAPONS[P.wkey].ic+" "+WEAPONS[P.wkey].n; $("btnZoom").style.visibility=P.knifeOnly?"hidden":"visible"; },
  mp(a,b){ const el=$("mp"); el.classList.toggle("hide",!a&&!b); el.textContent=a&&b?"🔥 매치 포인트 (마지막 판)":a?"🔥 매치 포인트":"⚠️ 상대 매치 포인트"; el.classList.toggle("r",!a&&!!b); $("scL").classList.toggle("mpt",!!a); $("scR").classList.toggle("mpt",!!b); },
  hitmark(k){ const h=$("hitm"); h.className="s "+k; UI.hT=.12; },
  hurt(by,amt){ UI.vg=Math.min(1,UI.vg+.25+amt/60); SFX.hurt(); FX.shake=Math.max(FX.shake,.2); if(!by||!P) return; const dx=by.pos.x-P.pos.x, dz=by.pos.z-P.pos.z, s=Math.sin(P.yaw), c=Math.cos(P.yaw);
    const ang=Math.atan2(dx*c-dz*s,-dx*s-dz*c)*180/Math.PI, i=UI.indI=(UI.indI+1)%3, el=$("dmgInd").children[i]; el.style.transform="rotate("+ang+"deg)"; UI.ind[i]=1; },
  feed(a,b,ic,me,ca,cb){ const f=$("feed"), d=document.createElement("div"); if(me) d.className=cb==="y"?"me dn":"me"; d.innerHTML=(a?'<b class="'+(ca||"")+'">'+esc(a)+"</b>":"")+"<i>"+ic+'</i><b class="'+(cb||"")+'">'+esc(b)+"</b>"; f.appendChild(d); while(f.children.length>3) f.removeChild(f.firstChild); setTimeout(()=>d.classList.add("out"),4100); setTimeout(()=>{ if(d.parentNode) d.parentNode.removeChild(d); },4500); },
  banner(t,sub,sec){ const b=$("banner"); b.innerHTML=esc(t)+(sub?"<small>"+esc(sub)+"</small>":""); b.classList.add("s"); UI.bT=sec||1.5; },
  streak(t){ const s=$("streak"); s.textContent="🔥 "+t; s.classList.add("s"); UI.sT=1.6; jingle([880,1175,1568],.06,"square",.12); },
  score(l,r,hide){ $("scL").style.display=$("scR").style.display=hide?"none":""; $("scL").textContent=l; $("scR").textContent=r; },
  timer(sec,txt){ const el=$("timer"); if(txt){ if(el.textContent!==txt) el.textContent=txt; return; } const s=Math.max(0,Math.ceil(sec)), v=Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); if(el.textContent!==v) el.textContent=v; },
  board(rows){ $("board").innerHTML=rows.map((r,i)=>`<div class="${r.me?"me":""}"><span>${i+1}. ${esc(r.n)}</span><b>${r.k}</b></div>`).join(""); },
  net(t){ const p=$("netPill"); p.textContent=t; p.classList.toggle("hide",!t); },
  hud(dt){ if(!P) return; const hp=clamp(P.hp/P.maxhp,0,1), hw=Math.round(hp*1000)/10; if(UI.hW!==hw){ UI.hW=hw; $("hpFill").style.width=hw+"%"; }
    /* 흰 잔상 막대: 맞으면 잠깐 멈췄다가 따라 줄어듦(얼마나 깎였는지 보임) */
    { let lg=UI.hL==null?hp:UI.hL; if(hp>=lg){ lg=hp; UI.hD=.35; } else if((UI.hD-=dt)<=0) lg=Math.max(hp,lg-dt*.55); UI.hL=lg; const lw=Math.round(lg*1000)/10; if(UI.hLW!==lw){ UI.hLW=lw; $("hpLag").style.width=lw+"%"; }
      const hc=hp>.5?"":hp>.25?"mid":"low"; if(UI.hC!==hc){ UI.hC=hc; $("hpBox").className=hc; }
      const ht=""+Math.ceil(P.hp), pw=(P.inv>0?"🛡️":"")+(P.pwD>0?"💥":"")+(P.pwS>0?"⚡":""); if(UI.hTx!==ht){ UI.hTx=ht; $("hpTxt").textContent=ht; } if(UI.hP!==pw){ UI.hP=pw; $("hpPw").textContent=pw; } }
    $("dashFill").style.width=(100*(1-clamp(P.dashLeft/P.dashCd,0,1)))+"%";
    { const mg=magOf(P.wi), am=P.ammo[P.wi], rl=P.relT>0, at=rl?"<small>장전 중…</small>":am+"<small> / "+mg+"</small>"; if(UI.aT!==at){ UI.aT=at; $("ammoTxt").innerHTML=at; }
      const fr=Math.round(100*clamp((rl?1-P.relT/(P.relFull||1):am/mg)||0,0,1)), ac=rl?"rel":(mg>1&&am<=mg*.25?"low":""); if(UI.aF!==fr){ UI.aF=fr; $("ammoFill").style.width=fr+"%"; } if(UI.aC!==ac){ UI.aC=ac; $("ammoBox").className=ac; } }
    const cr=$("cross"), zoomed=scoped(), W0=WEAPONS[P.wkey]; cr.style.display=zoomed||!P.alive||P.dance?"none":"";
    if(zoomed){ const t=(I.dist<W0.range?"거리 "+Math.round(I.dist)+"m":"거리 ―")+" · "+(I.zoom>1?"2단계":"1단계"); if(UI.scT!==t){ UI.scT=t; $("scInfo").textContent=t; } $("scDot").className=I.onTarget?(I.onHead?"h":"o"):""; }
    { const zt=I.zoom?(W0.scope?(I.zoom>1?"2단계":"1단계"):"조준 중"):"조준"; if(UI.zT!==zt){ UI.zT=zt; $("btnZoom").textContent=zt; $("btnZoom").classList.toggle("on",!!I.zoom); } } cr.style.setProperty("--g",(5+Math.min(14,Math.hypot(P.vel.x,P.vel.z)*1.1+(P.ground?0:5)+VM.kick*6))+"px"); cr.classList.toggle("on",I.onTarget);
    $("scope").classList.toggle("hide",!zoomed); $("supFill").style.width=(P.supT>0?P.supT/6*100:P.sup)+"%"; $("btnSuper").classList.toggle("rdy",P.sup>=100&&P.supT<=0); $("supGlow").style.opacity=P.supT>0?1:0; $("btnNade").style.opacity=P.nadeCd>0?.3:1; $("btnKnife").style.opacity=P.knifeCd>0?.4:1; $("btnSlide").style.opacity=P.slideCd>0||P.slideT>0?.4:1; $("btnDash").style.opacity=P.dashLeft>0?.4:1;
    if(UI.hT>0){ UI.hT-=dt; if(UI.hT<=0) $("hitm").className=""; }
    if(UI.bT>0){ UI.bT-=dt; if(UI.bT<=0) $("banner").classList.remove("s"); } if(UI.sT>0){ UI.sT-=dt; if(UI.sT<=0) $("streak").classList.remove("s"); }
    UI.vg=Math.max(0,UI.vg-dt*1.2); $("vign").style.opacity=Math.max(UI.vg,hp<.3&&P.alive?.35:0); $("frost").style.opacity=P.slowT>0?.8:0;
    for(let i=0;i<3;i++) if(UI.ind[i]>0){ UI.ind[i]=Math.max(0,UI.ind[i]-dt*1.3); $("dmgInd").children[i].style.opacity=UI.ind[i]; } },

  /* ----- 홈 ----- */
  home(){ ensureDay(); const lv=lvOf(G.xp), t=tierOf(G.rw);
    $("me").innerHTML=`<button class="chip" data-a="name">✏️ ${esc(G.name||"이름 정하기")}</button><button class="chip" data-a="diff">🎚️ 난이도: ${["쉬움","보통","어려움"][G.set.diff]}</button><span class="chip">Lv.${lv}</span><span class="chip">🔑 ${G.keys}</span><button class="chip" data-a="rank" style="color:${t.c}">${t.ic} ${t.n} · ${G.rw%TIER_WINS}/${TIER_WINS}승</button>`;
    $("ver").textContent="버전 v"+VER+" · "+G.rec.w+"승 "+G.rec.l+"패"; $("misDot").classList.toggle("hide",!misReady()); $("patchDot").classList.toggle("hide",G.seenVer>=VER); },
  result(o){ const r=o.r, t=tierOf(G.rw); let h=`<div id="res"><h1 style="color:${o.win?"#ffd740":"#cfd8dc"}">${esc(o.title)}</h1><div>${esc(o.sub)}</div>${o.up?`<div class="rw"><span class="chip pop" style="background:${o.up.c};color:#1a1200;font-size:18px">🎉 등급 상승! ${o.up.ic} ${o.up.n} (🔑 +${KEY_TIER})</span></div>`:""}
      <div class="rw"><span class="chip">🔑 +${r.keys}</span><span class="chip">✨ 경험치 +${r.xp}</span>${o.rank?`<span class="chip" style="color:${t.c}">${t.ic} ${t.n} · ${G.rw%TIER_WINS}/${TIER_WINS}승</span>`:""}${r.lvUp?`<span class="chip" style="background:#ffd740;color:#222">🎉 레벨 ${r.lvUp}! 🔑 +${r.bonus}</span>`:""}</div>`;
    if(o.rows) h+=`<table class="sb" style="max-width:420px;margin:0 auto 8px">${o.rows.map((x,i)=>`<tr class="${x.me?"me":""}"><td>${i+1}등</td><td>${esc(x.n)}</td><td>${x.k} 아웃</td></tr>`).join("")}</table>`;
    else h+=`<div class="rw">${o.lines.map(l=>`<span class="chip">${l[0]} ${l[1]}</span>`).join("")}</div>`;
    h+=`<div class="rowb"><button class="btn y" data-a="again" data-v="${o.again}">${o.again==="lobby"?"방으로 돌아가기":"🔁 한 판 더!"}</button>${o.rank?'<button class="btn" data-a="rank">📊 랭크 보기</button>':''}<button class="btn" data-a="home">홈으로</button></div></div>`;
    $("hud").classList.add("hide"); $("menu").classList.remove("hide"); UI.home(); UI.panel("결과",h,"result"); if(r.lvUp||o.up) SFX.up(); },
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
    const st=stars(k); return `<div class="item ${e0||e1?"on":""}"><div class="ic">${w.ic}</div><h4>${w.n}</h4><div>${w.desc}</div><div style="color:#ffd740">${"★".repeat(st)}${"☆".repeat(5-st)} <small style="color:#fff;opacity:.7">${G.wk[k]||0} 아웃</small></div><div class="bars">${statBar("피해",w.dmg*(w.pel||1)*1.05)}${statBar("연사",8/w.rate*(w.brst||1)/1.6)}${statBar("탄창",w.mag/1.5)}${statBar("사거리",w.range/3)}</div>
      <div class="rowb">${own?`<button class="btn ${e0?"y":""}" data-a="eq" data-v="0:${k}">${e0?"✔ 주무기":"주무기"}</button><button class="btn ${e1?"y":""}" data-a="eq" data-v="1:${k}">${e1?"✔ 보조":"보조"}</button>`
      :`<button class="btn g ${G.keys<w.cost?"off":""}" data-a="buyW" data-v="${k}">🔑 ${w.cost}개로 열기</button>`}</div></div>`; }).join("");
  UI.panel("🔫 무기고",`<div style="font-size:12px;opacity:.8;margin-bottom:8px">결투를 이기면 🔑 열쇠를 받아요. 열쇠로 새 총을 열 수 있어요.</div><div class="grid">${h}</div>`,"armory"); }
function scrDance(){ const h=DANCES.map((d,i)=>{ const g=G.dn[d.id]||0, nx=g<3?DGRADE[g+1]:null;
    return `<div class="item" style="border-color:${g?DGRADE[g].c:"rgba(255,255,255,.18)"}"><div class="ic">${d.ic}</div><h4>${d.n}</h4><div style="font-weight:900;color:${g?DGRADE[g].c:"#90a4ae"}">${g?"● "+DGRADE[g].n+" 등급 · "+DGRADE[g].t:"아직 없음"}</div>
      <div class="gr">${[1,2,3].map(k=>`<button class="${g>=k?"own":""}" style="background:${DGRADE[k].c}" data-a="pvD" data-v="${i}:${k}">${g>=k?"✔":"▶"} ${DGRADE[k].n}<small>${d.d[k-1]}</small></button>`).join("")}</div>
      <div class="rowb">${nx?`<button class="btn g ${G.keys<DANCE_STEP?"off":""}" data-a="buyD" data-v="${i}">🔑 ${DANCE_STEP}개 → ${nx.n} 등급</button>`:`<span class="chip" style="color:${DGRADE[3].c}">최고 등급!</span>`}</div></div>`; }).join("");
  UI.panel("💃 춤",`<div style="font-size:12px;opacity:.8;margin-bottom:8px">열쇠 100개마다 한 단계씩: <b style="color:${DGRADE[1].c}">초록</b>(표현) → <b style="color:${DGRADE[2].c}">파랑</b>(춤) → <b style="color:${DGRADE[3].c}">빨강</b>(실감 나는 춤). 색 버튼을 누르면 미리 볼 수 있어요. 게임 중 💃 버튼(컴퓨터는 B)으로 춰요.</div><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">${h}</div>`,"dance"); }
function scrRank(){ const R=G.rec, ti=tierIdx(G.rw), t=TIERS[ti], top=ti>=TIERS.length-1, in10=G.rw%TIER_WINS, tot=R.w+R.l;
  const lad=TIERS.map((x,i)=>`<div class="tr ${i===ti?"on":i<ti?"dn":""}" style="${i<=ti?"border-color:"+x.c+";color:"+x.c:""}"><b>${x.ic}</b>${x.n}<small>${i*TIER_WINS}승~</small></div>`).join("");
  const modes=[1,2,3,4,5].map(n=>{ const m=R.m[n]||[0,0]; return `<span class="chip">${n}대${n} · ${m[0]}승 ${m[1]}패</span>`; }).join("");
  const hist=G.hist.length?`<table class="sb">${G.hist.slice(0,12).map(x=>{ const d=new Date(x.d); return `<tr><td style="color:${x.w?"#69f0ae":"#ff8a80"};font-weight:900">${x.w?"승":"패"}</td><td>${x.n}대${x.n}</td><td>${x.a} : ${x.b}</td><td>${x.k} 아웃</td><td style="opacity:.6;font-size:12px">${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}</td></tr>`; }).join("")}</table>`:`<div style="opacity:.7;font-size:13px;text-align:center;padding:10px">아직 결투 기록이 없어요. 결투를 하면 여기에 남아요.</div>`;
  UI.panel("📊 랭크",`<div style="text-align:center"><div style="font-size:54px;line-height:1">${t.ic}</div><div style="font-size:26px;font-weight:900;color:${t.c}">${t.n}</div>
    <div style="font-size:13px;margin:4px 0">${top?"최고 등급 달성! (총 "+G.rw+"승)":"다음 등급 "+TIERS[ti+1].n+"까지 "+(TIER_WINS-in10)+"승"}</div><div class="prog" style="max-width:340px;margin:0 auto;height:12px"><s style="width:${top?100:in10/TIER_WINS*100}%;background:${t.c}"></s></div><div style="font-size:11px;opacity:.7;margin-top:3px">결투를 ${TIER_WINS}번 이길 때마다 한 등급 올라가요 (${in10} / ${TIER_WINS})</div></div>
    <div class="lad">${lad}</div>
    <div class="rowb" style="margin:10px 0"><span class="chip">${R.w}승 ${R.l}패</span><span class="chip">승률 ${tot?Math.round(R.w/tot*100):0}%</span><span class="chip">🔥 지금 ${R.cur}연승</span><span class="chip">최고 ${R.best}연승</span><span class="chip">아웃 ${G.stat.k}</span><span class="chip">헤드샷 ${G.stat.hs}</span></div>
    <div class="rowb" style="margin-bottom:10px">${modes}</div><div class="line" style="display:block"><b>최근 경기</b>${hist}</div>`,"rank"); }
function scrMissions(){ ensureDay(); const h=G.mis.map(x=>{ const m=MISSIONS.find(y=>y.id===x.id); if(!m) return ""; const v=Math.min(m.n,G.dayc[m.k]||0), done=v>=m.n;
    return `<div class="line"><div class="f"><b>${m.txt}</b><small>${v} / ${m.n}</small><div class="prog"><s style="width:${v/m.n*100}%"></s></div></div>${x.got?`<span class="chip">✔ 받음</span>`:`<button class="btn ${done?"y":"off"}" data-a="claim" data-v="${m.id}">🔑 ${m.rw}</button>`}</div>`; }).join("");
  UI.panel("🎯 오늘의 임무",h+`<div style="font-size:12px;opacity:.75">임무는 날마다 새로 바뀌어요.</div>`,"missions"); }
function scrSettings(){ UI.panel("⚙️ 설정",`
  <div class="line"><div class="f"><b>화면 돌리는 빠르기</b><small>${G.set.sens.toFixed(1)}배</small></div><input type="range" min="0.4" max="3.5" step="0.1" value="${G.set.sens}" id="sens"></div>
  <div class="line"><div class="f"><b>저격 조준경 빠르기</b><small>${G.set.scope.toFixed(1)}배</small></div><input type="range" min="0.3" max="2.5" step="0.1" value="${G.set.scope}" id="scopeS"></div>
  <div class="line"><div class="f"><b>자동 발사</b><small>알아서 쏘지만 한 박자 늦고, 덜 정확하고, 피해가 20% 적어요. 직접 쏘면 더 세요</small></div><button class="btn ${G.set.auto?"y":""}" data-a="tog" data-v="auto">${G.set.auto?"켜짐":"꺼짐"}</button></div>
  <div class="line"><div class="f"><b>조준 도움</b><small>조준점이 가까운 적 쪽으로 살짝 붙어요</small></div><button class="btn ${G.set.assist?"y":""}" data-a="tog" data-v="assist">${G.set.assist?"켜짐":"꺼짐"}</button></div>
  <div class="line"><div class="f"><b>조준 패드 (왼쪽 위)</b><small>패드를 민 방향으로 화면이 계속 돌아가요</small></div><button class="btn ${G.set.pad?"y":""}" data-a="tog" data-v="pad">${G.set.pad?"켜짐":"꺼짐"}</button></div>
  <div class="line"><div class="f"><b>소리</b></div><button class="btn ${G.set.snd?"y":""}" data-a="tog" data-v="snd">${G.set.snd?"켜짐":"꺼짐"}</button></div>
  <div class="line"><div class="f"><b>그래픽</b><small>버벅이면 '가볍게'로 (다음에 켤 때 적용)</small></div><button class="btn" data-a="tog" data-v="gfx">${G.set.gfx?"선명하게":"가볍게"}</button></div>
  ${M.active?"":`<div class="line"><div class="f"><b>기록 모두 지우기</b><small>열쇠·무기·춤·등급이 모두 사라져요</small></div><button class="btn r" data-a="wipe">지우기</button></div>`}`,M.active?"pause2":"settings"); }
function scrPatch(){ G.seenVer=VER; save(); UI.panel("📜 패치 노트",PATCH.map(p=>`<div class="line"><div class="f"><b>v${p.v} — ${esc(p.t)}</b><small>${p.d}</small><ul style="margin:6px 0 0;padding-left:18px;font-size:13px">${p.l.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div></div>`).join(""),"patch"); }
function scrHelp(){ UI.panel("❓ 조작법",`
  <div class="line"><div class="f"><b>📱 휴대폰 · 태블릿</b><small style="font-size:13px;opacity:1;line-height:1.7">왼쪽 화면을 끌면 이동 · 오른쪽 화면을 끌면 둘러보기 · 왼쪽 위 조준 패드로도 조준<br>🔥 발사(누른 채 끌면 조준도 됨) · 점프(공중에서 한 번 더!) · 대시 · 슬라이드 · 🗡️ 검 · 💣 폭탄 · 💃 춤<br>'조준'을 누르면 확대! 저격소총은 한 번 더 누르면 2단계로 더 크게 보여요</small></div></div>
  <div class="line"><div class="f"><b>💻 컴퓨터</b><small style="font-size:13px;opacity:1;line-height:1.7">WASD 이동 · 마우스 조준 · 왼쪽 클릭 발사 · 오른쪽 클릭 확대(저격소총은 휠로 1·2단계)<br>스페이스 점프 · Shift 대시 · C 슬라이드 · F 검 · G 폭탄 · R 장전 · Q 무기 교체 · B 춤(숫자 1~5) · Esc 멈춤</small></div></div>
  <div class="line"><div class="f"><b>🔭 저격 꿀팁</b><small style="font-size:13px;opacity:1;line-height:1.7">조준경을 켜고 <b>멈춰서</b> 쏘면 십자선 한가운데에 정확히 맞아요. 움직이거나 뛰면서 쏘면 빗나가요<br>확대할수록 화면이 천천히 움직여서 머리를 겨누기 쉬워요. 가운데 점이 빨강이면 몸, 노랑이면 머리!<br>조준경 아래에 적까지의 거리가 나와요. 머리는 한 방!</small></div></div>
  <div class="line"><div class="f"><b>💡 꿀팁</b><small style="font-size:13px;opacity:1;line-height:1.7">머리를 맞히면 피해가 1.6배! · 노란 점프대를 밟으면 높이 날아요<br>4초 동안 안 맞으면 체력이 저절로 차요 · 폭탄을 발밑에 터뜨리면 높이 점프!<br>적을 맞히면 ⭐ 필살기 게이지가 차요 (컴퓨터는 E) · 달리다 슬라이드 → 바로 점프하면 훨씬 멀리 가요 · 적 등 뒤에서 검으로 베면 한 방!</small></div></div>`,"help"); }
function scrDuel(){ const t=tierOf(G.rw), ic=["🧍","🧑‍🤝‍🧑","👨‍👩‍👦","👨‍👩‍👧‍👦","🖐️"];
  UI.panel("⚔️ 결투",`<div style="text-align:center;font-size:14px">내 등급 <b style="color:${t.c}">${t.ic} ${t.n}</b> · ${G.rw%TIER_WINS} / ${TIER_WINS}승<br><small style="opacity:.75">9전 5선승제! 먼저 5판을 이기면 승리. 4판을 이기면 매치 포인트! 등급이 오를수록 봇이 똑똑해져요.</small></div>
  <div class="modes">${[1,2,3,4,5].map(n=>`<button class="mode" style="width:128px;padding:12px 6px" data-a="duel" data-v="${n}"><b>${ic[n-1]}</b>${n} 대 ${n}<small>${n===1?"나 혼자 승부":"봇 동료 "+(n-1)+"명과 함께"}</small><small>승리 🔑 ${KEY_WIN[G.set.diff]} · 패배 🔑 ${KEY_LOSE}</small></button>`).join("")}</div>`,"duel"); }
function scrOnline(code){ UI.panel("🌐 친구와 대결",`<div style="text-align:center">
  <div class="modes"><div class="mode" style="width:230px"><b>🏠</b>방 만들기<small>방 번호가 생겨요. 친구에게 알려 주세요</small><div class="rowb"><button class="btn y" data-a="mkroom">방 만들기</button></div></div>
  <div class="mode" style="width:230px"><b>🚪</b>방 들어가기<small>친구가 알려 준 번호 4자리</small><div class="rowb"><input type="tel" id="roomIn" maxlength="4" placeholder="0000" value="${esc(code||"")}" style="width:110px"><button class="btn g" data-a="joinroom">들어가기</button></div></div></div>
  <div style="font-size:12px;opacity:.75;margin-top:12px">같은 방 번호를 넣은 사람끼리 만나요 (최대 8명). 모두가 적! 3분 동안 가장 많이 아웃시키면 1등.<br>공개 중계 서버를 써서, 이름과 위치만 주고받아요.</div></div>`,"online"); }
function scrName(first){ UI.panel(first?"👋 J war 에 온 걸 환영해요!":"✏️ 이름 바꾸기",`<div style="text-align:center;margin-top:10px"><div style="margin-bottom:10px">게임에서 쓸 이름을 정해요 (8글자까지)</div>
  <input type="text" id="nameIn" maxlength="8" value="${esc(G.name)}" placeholder="이름"><div class="rowb" style="margin-top:12px"><button class="btn y" data-a="setname">확인</button></div></div>`,"name"); }
function scrPause(){ UI.panel(M.type==="online"?"메뉴 (대결은 계속돼요)":"⏸ 잠깐 멈춤",`<div class="rowb" style="margin-top:20px"><button class="btn y" style="font-size:18px;padding:12px 28px" data-a="resume">▶ 계속하기</button><button class="btn" data-a="settings">⚙️ 설정</button><button class="btn r" data-a="quit">나가기</button></div>`,"pause"); }

/* ---------- 버튼 동작 ---------- */
const UIA = {
  back(){ if(UI.scr==="lobby"){ NET.leave(); UI.showMenu(); } else if(UI.scr==="pause") UIA.resume(); else if(UI.scr==="pause2") scrPause(); else if(UI.scr==="name"&&!G.name) return; else if(UI.scr==="result") UIA.home(); else if(UI.pv) UIA.pvEnd(); else { $("panel").classList.add("hide"); UI.scr="home"; UI.home(); } },
  home(){ if(NET.on) NET.leave(); UI.showMenu(); },
  duelMenu(){ scrDuel(); }, diff(){ G.set.diff=(G.set.diff+1)%3; save(); UI.home(); toast(["쉬움: 봇이 느긋해요 (승리 🔑 "+KEY_WIN[0]+")","보통: 봇이 피하고 물러나요 (승리 🔑 "+KEY_WIN[1]+")","어려움: 봇이 빠르고 정확해요 (승리 🔑 "+KEY_WIN[2]+")"][G.set.diff]); }, gun(){ startGun(); }, duel(v){ startDuel(+v||1); },
  online(){ scrOnline(""); }, armory(){ scrArmory(); }, dances(){ scrDance(); }, rank(){ scrRank(); }, missions(){ scrMissions(); }, settings(){ scrSettings(); }, patch(){ scrPatch(); UI.home(); }, help(){ scrHelp(); }, name(){ scrName(false); },
  setname(){ const v=$("nameIn").value.trim().slice(0,8); if(!v){ toast("이름을 적어 주세요"); return; } G.name=v; save(); $("panel").classList.add("hide"); UI.scr="home"; UI.home(); if(UI.pendingRoom){ const c=UI.pendingRoom; UI.pendingRoom=""; UIA.enter(c); } },
  buyW(k){ const w=WEAPONS[k]; if(!w||G.own[k]) return; if(G.keys<w.cost){ toast("열쇠가 "+(w.cost-G.keys)+"개 모자라요"); return; } G.keys-=w.cost; G.own[k]=1; save(); SFX.win(); toast("🔓 "+w.n+" 을(를) 열었어요!"); scrArmory(); },
  buyD(v){ const d=DANCES[+v]; if(!d) return; const g=G.dn[d.id]||0; if(g>=3) return; if(G.keys<DANCE_STEP){ toast("열쇠가 "+(DANCE_STEP-G.keys)+"개 모자라요"); return; } G.keys-=DANCE_STEP; G.dn[d.id]=g+1; save(); SFX.win(); toast(d.ic+" "+d.n+" · "+DGRADE[g+1].n+" 등급!"); UIA.pvD(v+":"+(g+1)); },
  pvD(v){ if(M.active) return; const [i,g]=v.split(":").map(Number), d=DANCES[i]; if(!d) return; if(UI.pv) removeActor(UI.pv); const s=safeSpot(0,W.S*.45), a=UI.pv=newActor({name:G.name||"나",team:0,col:PCOL,lcol:"#fff"}); a.pos.set(s.x,0,s.z); a.yaw=0; startDance(a,d.id,g,1);
    $("panel").classList.add("hide"); $("menu").classList.add("hide"); $("pv").classList.remove("hide"); $("pvT").innerHTML=`${d.ic} ${d.n} · <b style="color:${DGRADE[g].c}">${DGRADE[g].n} 등급</b> (${DGRADE[g].t})`; UI.scr="pv"; },
  pvEnd(){ if(UI.pv){ removeActor(UI.pv); UI.pv=null; } $("pv").classList.add("hide"); $("menu").classList.remove("hide"); scrDance(); },
  emo(){ if(!M.active||!P||!P.alive||UI.scr!=="game") return; const own=DANCES.map((d,i)=>({d,i,g:G.dn[d.id]||0})).filter(x=>x.g); if(!own.length){ toast("춤은 홈 화면의 💃 춤에서 열쇠로 살 수 있어요"); return; }
    UI.emoOn=!UI.emoOn; const el=$("emo"); el.classList.toggle("hide",!UI.emoOn); if(UI.emoOn) el.innerHTML=own.map(x=>`<button class="eb" style="border-color:${DGRADE[x.g].c}" data-a="dance" data-v="${x.i}"><b>${x.d.ic}</b>${x.d.n}<small>${x.i+1}</small></button>`).join(""); },
  dance(v){ UI.emoOn=false; $("emo").classList.add("hide"); startMyDance(+v); },
  eq(v){ const [s,k]=v.split(":"), i=+s; if(!G.own[k]) return; if(G.eq[1-i]===k) G.eq[1-i]=G.eq[i]; G.eq[i]=k; save(); scrArmory(); },
  claim(id){ const m=MISSIONS.find(y=>y.id===id), x=G.mis.find(y=>y.id===id); if(!m||!x||x.got||(G.dayc[m.k]||0)<m.n) return; x.got=1; G.keys+=m.rw; save(); SFX.coin(); toast("🔑 +"+m.rw); scrMissions(); },
  tog(k){ G.set[k]=G.set[k]?0:1; save(); document.body.classList.toggle("pad",!!G.set.pad); scrSettings(); },
  wipe(){ if(UI.wipeT&&Date.now()-UI.wipeT<4000){ localStorage.removeItem(SAVE_KEY); location.reload(); } else { UI.wipeT=Date.now(); toast("정말 지우려면 한 번 더 눌러요"); } },
  pause(){ if(!M.active||UI.scr!=="game") return; if(M.type!=="online") M.paused=true; resetInput(); if(document.exitPointerLock) document.exitPointerLock(); scrPause(); },
  resume(){ M.paused=false; $("panel").classList.add("hide"); UI.scr="game"; lastT=0; },
  quit(){ const on=M.type==="online"; stopMatch(); if(on) NET.leave(); UI.showMenu(); },
  again(v){ if(v==="gun") startGun(); else if(v==="lobby"){ if(NET.on){ UI.panel("🌐 대결 방","","lobby"); UI.lobby(); } else UIA.online(); } else startDuel(+v.split(":")[1]||1); },
  mkroom(){ UIA.enter(String(Math.floor(1000+Math.random()*9000))); },
  joinroom(){ const v=$("roomIn").value.replace(/\D/g,""); if(v.length!==4){ toast("방 번호 4자리를 넣어 주세요"); return; } UIA.enter(v); },
  enter(code){ if(!G.name){ UI.pendingRoom=code; scrName(true); return; } if(!/^https?:/.test(location.protocol)&&!NET.FAKE){ toast("같이 하기는 게임 주소로 열었을 때만 돼요"); return; } NET.joinRoom(code); UI.lmap=UI.lmap||"toy"; UI.panel("🌐 대결 방","","lobby"); UI.lobby(); },
  lmap(k){ UI.lmap=k; UI.lobby(); }, lstart(){ if(NET.up<=0){ toast("서버에 연결되는 중이에요. 잠시만요"); return; } NET.startMatch(UI.lmap||"toy"); },
  invite(){ const url=location.origin+location.pathname+"?room="+NET.room, txt="J war 같이 하자! 방 번호 "+NET.room;
    if(navigator.share){ navigator.share({title:"J war",text:txt,url}).catch(()=>{}); } else if(navigator.clipboard){ navigator.clipboard.writeText(txt+" "+url).then(()=>toast("초대 링크를 복사했어요")).catch(()=>toast(url)); } else toast(url); },
};
document.addEventListener("click",e=>{ const b=e.target.closest("[data-a]"); if(!b) return; if(b.classList.contains("off")) { toast("아직 안 돼요"); return; } const f=UIA[b.dataset.a]; if(f){ SFX.click(); f(b.dataset.v,b); } });
document.addEventListener("input",e=>{ if(e.target.id==="sens"){ G.set.sens=+e.target.value; save(); e.target.parentNode.querySelector("small").textContent=G.set.sens.toFixed(1)+"배"; }
  else if(e.target.id==="scopeS"){ G.set.scope=+e.target.value; save(); e.target.parentNode.querySelector("small").textContent=G.set.scope.toFixed(1)+"배"; } });
document.addEventListener("visibilitychange",()=>{ if(document.hidden){ if(M.active&&M.type!=="online"&&UI.scr==="game") UIA.pause(); } else if(!M.active) checkVersion(); });

/* ---------- 새 버전 확인 (패치가 올라오면 바로 새 버전으로) ---------- */
function checkVersion(){ if(!/^https?:/.test(location.protocol)) return; fetch("version.json?t="+Date.now(),{cache:"no-store"}).then(r=>r.json()).then(j=>{
    if(j&&j.v>VER&&!M.active){ const q=new URLSearchParams(location.search); if(+q.get("v")===j.v) return; q.set("v",j.v); location.replace(location.pathname+"?"+q.toString()); } }).catch(()=>{}); }

/* ---------- 메인 루프 ---------- */
let lastT = 0;
function frame(t){ requestAnimationFrame(frame); const now=t/1000; let dt=lastT?Math.min(.05,now-lastT):.016; lastT=now; if(dt<=0) dt=.001;
  NET.tick(dt);
  if(M.active&&!M.paused){ let gd=dt; if(HS.t>0){ HS.t-=dt; if(M.type!=="online") gd=dt*.1; } updateGame(gd); updateVM(dt); updateFX(dt,now); UI.hud(dt); }
  else if(!M.active){ const a=now*.12, S=W.S; if(UI.pv){ updateAvatar(UI.pv,dt); if(UI.pv.dance) danceCam(UI.pv); else UIA.pvEnd(); } else { camera.position.set(Math.cos(a)*S*.8,13,Math.sin(a)*S*.8); camera.lookAt(0,1,0); } { const bf=baseFov(); if(camera.fov!==bf){ camera.fov=bf; camera.updateProjectionMatrix(); } } updateFX(dt,now); VM.g.visible=false; }
  renderer.clear(); renderer.render(scene,camera); if(VM.g.visible&&M.active){ renderer.clearDepth(); renderer.render(vmScene,vmCam); } }

/* ---------- 시작 ---------- */
(function boot(){ if(TOUCH) document.body.classList.add("touch"); if(G.set.pad) document.body.classList.add("pad"); if(G.set.gfx) document.body.classList.add("gfx"); initGL(); buildMap(pick(MAP_KEYS)); ensureDay(); UI.home(); checkVersion();
  const room=(new URLSearchParams(location.search).get("room")||"").replace(/\D/g,"").slice(0,4);
  if(!G.name){ if(room.length===4) UI.pendingRoom=room; scrName(true); } else if(room.length===4) UIA.enter(room);
  window.__jw={M,G,ACT,W,NET,UI,UIA,I,get P(){ return P; },step(dt,n){ for(let i=0;i<(n||1);i++){ if(M.active&&!M.paused) updateGame(dt); } }};
  requestAnimationFrame(frame); })();
