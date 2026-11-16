// J war 자동 점검: 혼자 하는 모드를 모두 잠깐씩 돌려 스크립트 오류가 없는지 본다.
// 쓰는 법: node tools/smoke.js [스크린샷.png]   (Playwright + 크롬 필요)
let pw; try{ pw=require('playwright'); }catch(e){ pw=require('/opt/npm-tools/node_modules/playwright'); }
const http=require('http'),fs=require('fs'),path=require('path'),root=path.join(__dirname,'..'),shot=process.argv[2];
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const srv=http.createServer((q,r)=>{ let p=q.url.split('?')[0]; if(p==='/')p='/index.html'; const f=path.join(root,p); if(!f.startsWith(root)||!fs.existsSync(f)){ r.writeHead(404); r.end(); return; } r.writeHead(200,{'content-type':mime[path.extname(f)]||'text/plain'}); r.end(fs.readFileSync(f)); }).listen(0);
(async()=>{ const opt={args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']}; if(fs.existsSync('/usr/bin/google-chrome')) opt.executablePath='/usr/bin/google-chrome';
  const b=await pw.chromium.launch(opt), ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true}), pg=await ctx.newPage(), errs=[];
  pg.on('pageerror',e=>errs.push(e.message+' @ '+((e.stack||'').split('\n')[1]||'').trim()));
  await pg.addInitScript(()=>{ localStorage.setItem('jwar-save-1',JSON.stringify({name:'점검',coins:5000})); });
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'commit'}); await pg.waitForTimeout(2500);
  const out=await pg.evaluate(()=>{ const J=window.__jw, r={ver:VER}; const play=(start,n)=>{ start(); for(let i=0;i<n&&J.M.active;i++){ if(J.M.phase==='cards'){ document.querySelector('#cards .card').click(); continue; }
        const P=J.P, t=J.ACT.filter(a=>a.alive&&a!==P&&a.team!==P.team)[0]; if(t&&P.alive){ const dx=t.pos.x-P.pos.x, dz=t.pos.z-P.pos.z; P.yaw=Math.atan2(-dx,-dz); P.pitch=Math.atan2(t.pos.y+1-(P.pos.y+1.52),Math.hypot(dx,dz)); J.I.fire=true; if(i%90===0) J.I.jumpQ=true; if(i%150===0) J.I.slideQ=true; if(i%200===0) throwNade(); if(i%130===0) knife(); if(P.sup>=100) superGo(); } J.step(.033,1); }
      const k=J.M.kills; if(J.M.active) J.UIA.quit(); return k; };
    r.duel=play(()=>J.UIA.duel(2),900); r.gun=play(()=>J.UIA.gun(),900); r.paint=play(()=>J.UIA.paint(),900); r.wave=play(()=>J.UIA.wave(),1200);
    J.UIA.armory(); J.UIA.skins(); J.UIA.missions(); J.UIA.settings(); J.UIA.patch(); J.UIA.help(); J.UIA.home(); return r; });
  if(shot){ await pg.evaluate(()=>{ const J=window.__jw; J.UIA.duel(3); J.step(.033,150); const t=J.ACT.find(a=>a.team===1), P=J.P; P.pos.set(t.pos.x+1.5,0,t.pos.z+4.5); P.yaw=Math.atan2(-(t.pos.x-P.pos.x),-(t.pos.z-P.pos.z)); J.M.freeze=60; J.G.set.assist=0; J.G.set.auto=0; }); await pg.waitForTimeout(1200); await pg.screenshot({path:shot}); }
  console.log(JSON.stringify(out)); console.log(errs.length?('오류 '+errs.length+'개\n'+errs.slice(0,8).join('\n')):'오류 0개'); await b.close(); srv.close(); process.exit(errs.length?1:0);
})().catch(e=>{ console.error(e); process.exit(2); });
