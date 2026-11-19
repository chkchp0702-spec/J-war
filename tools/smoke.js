// J war 자동 점검: 혼자 하는 모드를 모두 잠깐씩 돌려 스크립트 오류가 없는지 본다.
// 쓰는 법: node tools/smoke.js [스크린샷.png]   (Playwright + 크롬 필요)
let pw; try{ pw=require('playwright'); }catch(e){ pw=require('/opt/npm-tools/node_modules/playwright'); }
const http=require('http'),fs=require('fs'),path=require('path'),root=path.join(__dirname,'..'),shot=process.argv[2];
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const srv=http.createServer((q,r)=>{ let p=q.url.split('?')[0]; if(p==='/')p='/index.html'; const f=path.join(root,p); if(!f.startsWith(root)||!fs.existsSync(f)){ r.writeHead(404); r.end(); return; } r.writeHead(200,{'content-type':mime[path.extname(f)]||'text/plain'}); r.end(fs.readFileSync(f)); }).listen(0);
(async()=>{ const opt={args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']}; if(fs.existsSync('/usr/bin/google-chrome')) opt.executablePath='/usr/bin/google-chrome';
  const b=await pw.chromium.launch(opt), ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true}), pg=await ctx.newPage(), errs=[];
  pg.on('pageerror',e=>errs.push(e.message+' @ '+((e.stack||'').split('\n')[1]||'').trim()));
  await pg.addInitScript(()=>{ if(!localStorage.getItem('jwar-save-1')) localStorage.setItem('jwar-save-1',JSON.stringify({name:'점검',coins:5000,own:{pistol:1,rifle:1,shotgun:1,smg:1,laser:1},eq:['smg','rifle'],skin:3,tro:300})); });
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'commit'}); await pg.waitForTimeout(2500);
  const out=await pg.evaluate(()=>{ const J=window.__jw, r={ver:VER,keys:J.G.keys,own:Object.keys(J.G.own).join(','),eq:J.G.eq.join(',')}; const play=(start,n)=>{ start(); for(let i=0;i<n&&J.M.active;i++){
        const P=J.P, t=J.ACT.filter(a=>a.alive&&a!==P&&a.team!==P.team)[0]; if(t&&P.alive){ const dx=t.pos.x-P.pos.x, dz=t.pos.z-P.pos.z; P.yaw=Math.atan2(-dx,-dz); P.pitch=Math.atan2(t.pos.y+1-(P.pos.y+1.52),Math.hypot(dx,dz)); J.I.fire=true; if(i%90===0) J.I.jumpQ=true; if(i%150===0) J.I.slideQ=true; if(i%200===0) throwNade(); if(i%130===0) knife(); if(i%170===0) cycleZoom(); if(i%400===399) swapWeapon(); if(P.sup>=100) superGo(); } J.step(.033,1); }
      const k=J.M.kills, done=!J.M.active; if(J.M.active) J.UIA.quit(); return k+(done?' 끝':''); };
    J.G.dn={wave:1,disco:2,robot:3}; J.G.own.sniper=1; J.G.own.burst=1; J.G.own.launcher=1; J.G.own.minigun=1;
    J.G.eq=['sniper','burst']; r.duel1=play(()=>J.UIA.duel(1),6000); J.G.eq=['launcher','rainbow']; r.duel5=play(()=>J.UIA.duel(5),2500); J.G.eq=['minigun','shotgun']; r.duel3=play(()=>J.UIA.duel(3),1500); r.gun=play(()=>J.UIA.gun(),2500);
    J.UIA.duel(2); J.step(.033,140); J.UIA.emo(); r.wheel=document.querySelectorAll('#emo .eb').length; J.UIA.dance(1); J.step(.033,30); r.dance=!!J.P.dance; J.step(.033,260); r.danceEnd=!J.P.dance; J.UIA.quit();
    J.UIA.armory(); J.UIA.dances(); J.UIA.pvD('1:3'); J.UIA.pvEnd(); J.UIA.rank(); J.UIA.missions(); J.UIA.settings(); J.UIA.patch(); J.UIA.help(); J.UIA.duelMenu(); J.UIA.home();
    r.rec=J.G.rec.w+'승'+J.G.rec.l+'패'; r.rw=J.G.rw; r.hist=J.G.hist.length; r.keys2=J.G.keys; return r; });
  if(shot){ await pg.evaluate(()=>{ const J=window.__jw; J.UIA.duel(3); J.step(.033,150); const t=J.ACT.find(a=>a.team===1), P=J.P; P.pos.set(t.pos.x+1.5,0,t.pos.z+4.5); P.yaw=Math.atan2(-(t.pos.x-P.pos.x),-(t.pos.z-P.pos.z)); J.M.freeze=60; J.G.set.assist=0; J.G.set.auto=0; }); await pg.waitForTimeout(1200); await pg.screenshot({path:shot}); }
  console.log(JSON.stringify(out)); console.log(errs.length?('오류 '+errs.length+'개\n'+errs.slice(0,8).join('\n')):'오류 0개'); await b.close(); srv.close(); process.exit(errs.length?1:0);
})().catch(e=>{ console.error(e); process.exit(2); });
