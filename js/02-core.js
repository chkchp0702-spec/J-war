"use strict";
/* ===== J war — 기본 엔진 (저장 · 소리 · 화면 · 맵 · 충돌 · 광선 · 이펙트) ===== */
const $ = id => document.getElementById(id);
const clamp = (v,a,b) => v<a?a:v>b?b:v, lerp = (a,b,t) => a+(b-a)*t, rnd = (a,b) => a+Math.random()*(b-a), pick = a => a[Math.floor(Math.random()*a.length)];
const TOUCH = ("ontouchstart" in window) || navigator.maxTouchPoints>0;
const V3 = (x,y,z) => new THREE.Vector3(x||0,y||0,z||0);

/* ---------- 저장 ---------- */
const SAVE_KEY = "jwar-save-1";
function defSave(){ return {name:"",coins:0,xp:0,tro:0,own:{pistol:1,rifle:1},eq:["rifle","pistol"],skin:0,hat:0,ownSkin:{0:1},ownHat:{0:1},
  best:{wave:0,kills:0},stat:{k:0,hs:0,win:0,games:0},wk:{},day:"",dayc:{},mis:[],set:{sens:1,auto:TOUCH?1:0,assist:TOUCH?1:0,pad:TOUCH?1:0,snd:1,gfx:1,diff:1},id:Math.random().toString(36).slice(2,10),seenVer:0}; }
let G = defSave();
try{ const s=JSON.parse(localStorage.getItem(SAVE_KEY)||"null"); if(s){ const d=defSave(); G=Object.assign(d,s); G.set=Object.assign(defSave().set,s.set||{}); G.best=Object.assign({wave:0,kills:0},s.best||{}); G.stat=Object.assign({k:0,hs:0,win:0,games:0},s.stat||{}); } }catch(e){}
function save(){ try{ localStorage.setItem(SAVE_KEY,JSON.stringify(G)); }catch(e){} }
function lvOf(xp){ return Math.floor(Math.sqrt(xp/60))+1; }
function lvXp(lv){ return (lv-1)*(lv-1)*60; }

/* ---------- 소리 (파일 없이 직접 만드는 효과음) ---------- */
const AU = {ctx:null,nb:null,master:null};
function actx(){ if(!G.set.snd) return null;
  if(!AU.ctx){ const C=window.AudioContext||window.webkitAudioContext; if(!C) return null;
    try{ AU.ctx=new C(); const b=AU.ctx.createBuffer(1,AU.ctx.sampleRate*.5,AU.ctx.sampleRate), d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
      AU.nb=b; AU.master=AU.ctx.createGain(); AU.master.gain.value=.55; AU.master.connect(AU.ctx.destination); }catch(e){ return null; } }
  if(AU.ctx.state==="suspended") AU.ctx.resume(); return AU.ctx; }
function tone(f,d,type,vol,f2,delay){ const c=actx(); if(!c) return; const t=c.currentTime+(delay||0), o=c.createOscillator(), g=c.createGain();
  o.type=type||"square"; o.frequency.setValueAtTime(f,t); if(f2) o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+d);
  g.gain.setValueAtTime(vol||.2,t); g.gain.exponentialRampToValueAtTime(.001,t+d); o.connect(g); g.connect(AU.master); o.start(t); o.stop(t+d+.02); }
function noise(d,vol,fq,type){ const c=actx(); if(!c) return; const t=c.currentTime, s=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain();
  s.buffer=AU.nb; f.type=type||"lowpass"; f.frequency.value=fq||2000; g.gain.setValueAtTime(vol||.2,t); g.gain.exponentialRampToValueAtTime(.001,t+d);
  s.connect(f); f.connect(g); g.connect(AU.master); s.start(t); s.stop(t+d+.02); }
function jingle(arr,step,type,vol){ arr.forEach((f,i)=>tone(f,.16,type||"square",vol||.14,0,i*(step||.09))); }
const SFX = {
  shoot(k,v){ v=v==null?1:v; if(v<.04) return;
    if(k==="grenade"){ tone(300,.16,"sine",.16*v,140); return; }
    if(k==="shotgun"){ noise(.22,.5*v,1400); tone(140,.15,"sawtooth",.2*v,50); }
    else if(k==="sniper"){ noise(.3,.5*v,2600); tone(300,.25,"sawtooth",.25*v,40); }
    else if(k==="rocket"){ noise(.35,.4*v,700); tone(200,.3,"sawtooth",.2*v,60); }
    else if(k==="laser"){ tone(1300,.06,"sawtooth",.06*v,900); }
    else if(k==="ice"){ tone(900,.09,"triangle",.16*v,1500); noise(.05,.1*v,6000,"highpass"); }
    else if(k==="smg"||k==="minigun"){ noise(.06,.26*v,2600); tone(260,.05,"square",.09*v,120); }
    else if(k==="pistol"){ noise(.08,.3*v,3000); tone(520,.08,"square",.12*v,160); }
    else { noise(.08,.32*v,2200); tone(330,.07,"square",.12*v,110); } },
  hit(){ tone(950,.04,"square",.12); }, head(){ tone(1500,.07,"square",.16); tone(2100,.09,"square",.12,0,.05); },
  kill(){ jingle([660,880,1320],.07,"square",.15); }, hurt(){ tone(160,.12,"sawtooth",.2,80); },
  jump(){ tone(300,.1,"sine",.15,520); }, jump2(){ tone(420,.1,"sine",.15,760); }, dash(){ noise(.18,.25,1800,"bandpass"); },
  pad(){ tone(260,.25,"sine",.2,900); }, reload(){ tone(700,.03,"square",.1); tone(500,.03,"square",.1,0,.12); }, reloaded(){ tone(900,.04,"square",.12); },
  click(){ tone(660,.04,"square",.08); }, coin(){ jingle([988,1319],.07,"square",.12); }, empty(){ tone(200,.03,"square",.08); },
  boom(v){ v=v==null?1:v; if(v<.04) return; noise(.5,.6*v,500); tone(90,.4,"sine",.4*v,30); },
  win(){ jingle([523,659,784,1047,1319],.11,"square",.16); }, lose(){ jingle([392,330,262,196],.14,"triangle",.2); },
  step(){ noise(.05,.06,420); }, slash(){ noise(.12,.22,3200,"bandpass"); tone(1300,.09,"sawtooth",.1,300); }, thump(){ tone(130,.2,"sine",.35,45); },
  count(){ tone(600,.1,"square",.14); }, go(){ tone(1000,.3,"square",.16); }, up(){ jingle([523,784,1047],.08,"triangle",.2); },
};

/* ---------- 화면 ---------- */
let renderer, scene, camera, vmScene, vmCam, hemi, sun, BOXTEX;
const worldG = new THREE.Group(), fxG = new THREE.Group(), actG = new THREE.Group();
const UNIT = new THREE.BoxGeometry(1,1,1);
const MATS = {};
function mat(col,tex,glow){ const k=col+"|"+(tex?1:0)+"|"+(glow||0); if(MATS[k]) return MATS[k];
  const m=new THREE.MeshLambertMaterial({color:col,map:tex?BOXTEX:null}); if(glow){ m.emissive=new THREE.Color(col); m.emissiveIntensity=glow; } return MATS[k]=m; }
const BMATS = {};
function matB(col){ return BMATS[col]||(BMATS[col]=new THREE.MeshBasicMaterial({color:col})); }
function makeBoxTex(){ const c=document.createElement("canvas"); c.width=c.height=128; const x=c.getContext("2d");
  const g=x.createLinearGradient(0,0,0,128); g.addColorStop(0,"#ffffff"); g.addColorStop(1,"#d9d9d9"); x.fillStyle=g; x.fillRect(0,0,128,128);
  x.strokeStyle="rgba(0,0,0,.26)"; x.lineWidth=4; x.strokeRect(0,0,128,128); x.strokeStyle="rgba(255,255,255,.7)"; x.lineWidth=2; x.beginPath(); x.moveTo(5,5); x.lineTo(123,5); x.stroke();
  x.fillStyle="rgba(0,0,0,.18)"; [[12,12],[116,12],[12,116],[116,116]].forEach(p=>{ x.beginPath(); x.arc(p[0],p[1],3,0,7); x.fill(); });
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=4; return t; }
function baseFov(){ return clamp(2*Math.atan(1.09/(innerWidth/innerHeight))*57.2958,48,70); }
function makeFloorTex(c1,c2,S,dark){ const N=1024, c=document.createElement("canvas"); c.width=c.height=N; const x=c.getContext("2d"), W2=2*S+2, k=N/W2, t=2*k, off=k, hx=v=>"#"+v.toString(16).padStart(6,"0");
  x.fillStyle=hx(c1); x.fillRect(0,0,N,N); x.fillStyle=hx(c2); for(let i=-1;i<W2/2+1;i++) for(let j=-1;j<W2/2+1;j++){ if((i+j)&1) continue; x.fillRect(i*t+off,j*t+off,t,t); }
  x.strokeStyle=dark?"rgba(0,229,255,.35)":"rgba(0,0,0,.10)"; x.lineWidth=dark?2:1.5; for(let i=0;i<=W2/2+1;i++){ const p=i*t+off; x.beginPath(); x.moveTo(p,0); x.lineTo(p,N); x.moveTo(0,p); x.lineTo(N,p); x.stroke(); }
  const zg=(y0,y1,col)=>{ const g=x.createLinearGradient(0,y0,0,y1); g.addColorStop(0,col); g.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle=g; x.fillRect(0,Math.min(y0,y1),N,Math.abs(y1-y0)); };
  zg(0,9*k,"rgba(255,60,60,.4)"); zg(N,N-9*k,"rgba(40,120,255,.4)");   /* 팀 구역: 위(-z) 빨강, 아래(+z) 파랑 */
  x.strokeStyle=dark?"rgba(255,64,129,.85)":"rgba(255,255,255,.8)"; x.lineWidth=5; x.beginPath(); x.arc(N/2,N/2,5*k,0,7); x.stroke(); x.beginPath(); x.moveTo(0,N/2); x.lineTo(N,N/2); x.stroke();
  x.lineWidth=10; x.strokeStyle=dark?"rgba(0,229,255,.7)":"rgba(255,193,7,.85)"; x.strokeRect(k*1.25,k*1.25,N-k*2.5,N-k*2.5);
  const tx=new THREE.CanvasTexture(c); tx.anisotropy=8; return tx; }
const EDGEM = new THREE.LineBasicMaterial({color:0x0a0d1a,transparent:true,opacity:.5});
const OUTM = new THREE.MeshBasicMaterial({color:0x0d1020,side:THREE.BackSide});   /* 만화 느낌 외곽선 */
let ML;
function initGL(){
  renderer=new THREE.WebGLRenderer({canvas:$("gl"),antialias:G.set.gfx>0,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,G.set.gfx>0?2:1.25)); renderer.autoClear=false;
  scene=new THREE.Scene(); camera=new THREE.PerspectiveCamera(75,1,.08,320); camera.rotation.order="YXZ";
  vmScene=new THREE.Scene(); vmCam=new THREE.PerspectiveCamera(58,1,.01,10);
  vmScene.add(new THREE.AmbientLight(0xffffff,.75)); const l=new THREE.DirectionalLight(0xffffff,.7); l.position.set(1,2,1.5); vmScene.add(l);
  hemi=new THREE.HemisphereLight(0xffffff,0x8899aa,.85); sun=new THREE.DirectionalLight(0xffffff,.65); sun.position.set(30,50,20); scene.add(hemi,sun);
  if(G.set.gfx>0){ renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); const sc=sun.shadow.camera; sc.left=sc.bottom=-36; sc.right=sc.top=36; sc.near=5; sc.far=130; sun.shadow.bias=-.0012; sun.shadow.normalBias=.03; }
  ML=new THREE.PointLight(0xffd27a,0,18); scene.add(ML);
  scene.add(worldG,actG,fxG); BOXTEX=makeBoxTex(); resize(); addEventListener("resize",resize); addEventListener("orientationchange",()=>setTimeout(resize,300)); }
function resize(){ const w=innerWidth,h=innerHeight; renderer.setSize(w,h,false); camera.aspect=vmCam.aspect=w/h; camera.updateProjectionMatrix(); vmCam.updateProjectionMatrix(); }

/* ---------- 맵 ---------- */
const W = {key:"",boxes:[],pads:[],S:24,grav:24,grid:null,gn:0,spin:[]};
function addBox(x,y,z,w,h,d,col){ W.boxes.push({x0:x-w/2,x1:x+w/2,y0:y,y1:y+h,z0:z-d/2,z1:z+d/2});
  const geo=new THREE.BoxGeometry(w,h,d), uv=geo.attributes.uv, R=v=>Math.max(1,Math.round(v/2)), fu=[R(d),R(d),R(w),R(w),R(w),R(w)], fv=[R(h),R(h),R(d),R(d),R(h),R(h)];
  for(let i=0;i<24;i++){ const f=i>>2; uv.setXY(i,uv.getX(i)*fu[f],uv.getY(i)*fv[f]); }
  const me=new THREE.Mesh(geo,mat(col,1,MAPS[W.key].dark?.16:0)); me.position.set(x,y+h/2,z); me.castShadow=me.receiveShadow=true; me.userData.own=2; worldG.add(me);
  if(G.set.gfx>0) me.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),EDGEM)); }
function addPad(x,z,p){ const g=new THREE.Group(); g.position.set(x,0,z);
  const a=new THREE.Mesh(new THREE.CylinderGeometry(1,1.1,.1,20),matB(0x263238)); a.position.y=.05;
  const b=new THREE.Mesh(new THREE.CylinderGeometry(.75,.75,.06,20),matB(0xffea00)); b.position.y=.12;
  const r=new THREE.Mesh(new THREE.TorusGeometry(.8,.06,6,20),matB(0xffffff)); r.rotation.x=Math.PI/2; r.position.y=.3;
  g.add(a,b,r); worldG.add(g); W.pads.push({x,z,p,ring:r}); }
function buildMap(key){ const m=MAPS[key]; W.key=key;
  while(worldG.children.length){ const c=worldG.children.pop(); if(c.userData.own===1){ c.geometry.dispose(); if(c.material.map) c.material.map.dispose(); c.material.dispose(); } else if(c.userData.own===2){ c.geometry.dispose(); c.children.forEach(k=>k.geometry&&k.geometry.dispose()); } }
  W.boxes=[]; W.pads=[]; W.spin=[]; W.S=m.S; W.grav=m.grav;
  const top=new THREE.Color(m.dark?0x02030c:m.sky).multiplyScalar(m.dark?1:.6), hor=new THREE.Color(m.dark?0x3a1f7a:0xffffff).lerp(new THREE.Color(m.sky),m.dark?0:.4);
  scene.background=hor.clone(); scene.fog=new THREE.Fog(hor.getHex(),m.fog[1],m.fog[2]); hemi.intensity=.68*m.light; sun.intensity=.9*m.light;
  { const sg=new THREE.SphereGeometry(260,20,12), sc=[], cc=new THREE.Color(), pp=sg.attributes.position; for(let i=0;i<pp.count;i++){ const t=clamp(pp.getY(i)/260*1.5,0,1); cc.copy(hor).lerp(top,Math.pow(t,.7)); sc.push(cc.r,cc.g,cc.b); }
    sg.setAttribute("color",new THREE.Float32BufferAttribute(sc,3)); const dome=new THREE.Mesh(sg,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false})); dome.userData.own=1; dome.renderOrder=-1; worldG.add(dome); }
  const S=m.S, ft=makeFloorTex(m.floor[0],m.floor[1],S,m.dark);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(2*S+2,2*S+2),new THREE.MeshLambertMaterial({map:ft})); fl.rotation.x=-Math.PI/2; fl.userData.own=1; fl.receiveShadow=true; worldG.add(fl);
  m.build((x,y,z,w,h,d,c,mir)=>{ addBox(x,y,z,w,h,d,c); if(mir) addBox(-x,y,-z,w,h,d,c); }, (x,z,p,mir)=>{ addPad(x,z,p); if(mir) addPad(-x,-z,p); });
  buildProps(m);
  addBox(0,0,S+.5,2*S+2,7,1,m.wall); addBox(0,0,-S-.5,2*S+2,7,1,m.wall); addBox(S+.5,0,0,1,7,2*S,m.wall); addBox(-S-.5,0,0,1,7,2*S,m.wall);
  { const ac=matB(m.dark?0x00e5ff:0xffffff), ac2=matB(m.dark?0xff4081:0xffc107); [[0,S-.04,2*S,.06],[0,-S+.04,2*S,.06],[S-.04,0,.06,2*S],[-S+.04,0,.06,2*S]].forEach(p=>{ const a=new THREE.Mesh(UNIT,ac); a.scale.set(p[2],.22,p[3]); a.position.set(p[0],3.2,p[1]); const b=new THREE.Mesh(UNIT,ac2); b.scale.set(p[2],.5,p[3]); b.position.set(p[0],.25,p[1]); worldG.add(a,b); }); }
  buildGrid(); buildDeco(m); }
/* 맵 소품(v9): 벽 가까운 정해진 자리에만 세운다 — 친구와 대결에서도 모두 같은 곳. 부딪히고 뒤에 숨을 수 있다 */
let PG;
const PROPS = {
  lamp(p,hi,dk){ p(PG.cyl,0x37474f,.6,.22,.6,0,.11,0); p(PG.cyl,0x546e7a,.16,3.3,.16,0,1.75,0); hi&&p(UNIT,0x37474f,.5,.12,.5,0,3.42,0); p(PG.sph,dk?0x00e5ff:0xfff3b0,.52,.52,.52,0,3.68,0,1); return [.5,3.9]; },
  barrel(p,hi,dk){ const c=dk?[0x37474f,0x76ff03]:W.key==="desert"?[0x8d6e63,0x4e342e]:[0xef5350,0xffd54f];
    p(PG.cyl,c[0],.95,1.15,.95,0,.575,0); p(PG.cyl,c[1],1,.12,1,0,.3,0,dk); p(PG.cyl,c[1],1,.12,1,0,.86,0,dk); hi&&p(PG.cyl,dk?0x263238:0x263238,.6,.05,.6,0,1.17,0); return [.9,1.15]; },
  cone(p,hi){ p(UNIT,0xff7043,.8,.09,.8,0,.045,0); p(PG.cone,0xff7043,.6,1,.6,0,.58,0); hi&&p(PG.cyl,0xffffff,.37,.16,.37,0,.52,0,1); return [.62,1.05]; },
  cactus(p,hi){ const c=0x43a047, c2=0x2e7d32; p(PG.cyl,c,.58,2.3,.58,0,1.15,0); p(PG.sph,c,.58,.58,.58,0,2.3,0);
    p(UNIT,c2,.5,.26,.3,.36,1.2,0); p(PG.cyl,c,.32,.95,.32,.6,1.62,0); p(UNIT,c2,.46,.24,.28,-.34,.9,0); p(PG.cyl,c,.3,.7,.3,-.56,1.2,0);
    hi&&p(PG.sph,0xff80ab,.2,.2,.2,.1,2.62,0,1); return [.7,2.55]; },
  sign(p,hi){ p(UNIT,0x6d4c41,.14,1.7,.14,0,.85,0); p(UNIT,0xffd54f,1.15,.62,.1,0,1.85,0); p(UNIT,0x4e342e,.62,.13,.12,-.08,1.85,0,1);
    hi&&p(PG.cone,0x4e342e,.34,.3,.12,.34,1.85,0,1).rotation.set(0,0,-Math.PI/2); return [.5,2.16]; },
  dish(p,hi){ p(PG.cyl,0x455a64,.6,.2,.6,0,.1,0); p(PG.cyl,0x78909c,.13,2.5,.13,0,1.35,0); p(PG.cone,0xb0bec5,1,.42,1,0,2.78,0).rotation.x=Math.PI; p(PG.sph,0xff4081,.24,.24,.24,0,3.08,0,1); return [.45,3.2]; },
};
const PROP_SET = {toy:["lamp","barrel","cone"], desert:["cactus","barrel","sign"], space:["lamp","barrel","dish"]};
function buildProps(m){ const S=m.S, hi=G.set.gfx>0, set=PROP_SET[W.key]||PROP_SET.toy, e=S-.85, slots=[], nb=W.boxes.length;
  PG=PG||{cyl:new THREE.CylinderGeometry(.5,.5,1,10), cone:new THREE.ConeGeometry(.5,1,10), sph:new THREE.SphereGeometry(.5,10,8)};
  for(const s of [1,-1]){ for(const t of [-.75,-.42,.42,.75]) slots.push([t*S,s*e,Math.abs(t)>.5?0:1,s>0?Math.PI:0]); for(const t of [-.5,.5]) slots.push([s*e,t*S,2,s>0?-Math.PI/2:Math.PI/2]); }
  const sp=(m.t0||[]).concat(m.ffa||[]);
  for(const [x,z,ki,ry] of slots){
    let ok=true; for(let i=0;i<nb&&ok;i++){ const b=W.boxes[i]; if(x+1.1>b.x0&&x-1.1<b.x1&&z+1.1>b.z0&&z-1.1<b.z1&&b.y0<4) ok=false; }
    for(const q of W.pads) if(Math.hypot(q.x-x,q.z-z)<2.6) ok=false;
    for(const q of sp) if(Math.hypot(q[0]-x,q[1]-z)<2.6||Math.hypot(q[0]+x,q[1]+z)<2.6) ok=false;
    if(!ok) continue;
    const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry;
    const sz=PROPS[set[ki]]((geo,col,sx,sy,sz,px,py,pz,glow)=>{ const me=new THREE.Mesh(geo,glow?matB(col):mat(col,0,m.dark?.16:0)); me.scale.set(sx,sy,sz); me.position.set(px,py,pz); if(!glow) me.castShadow=me.receiveShadow=hi; g.add(me); return me; },hi,!!m.dark);
    worldG.add(g); W.boxes.push({x0:x-sz[0]/2,x1:x+sz[0]/2,y0:0,y1:sz[1],z0:z-sz[0]/2,z1:z+sz[0]/2}); } }
function buildDeco(m){ const S=m.S;
  if(m.dark){ const n=500, p=new Float32Array(n*3); for(let i=0;i<n;i++){ const a=Math.random()*6.283, e=Math.random()*1.3+.08, r=200; p[i*3]=Math.cos(a)*Math.cos(e)*r; p[i*3+1]=Math.sin(e)*r; p[i*3+2]=Math.sin(a)*Math.cos(e)*r; }
    const g=new THREE.BufferGeometry(); g.setAttribute("position",new THREE.BufferAttribute(p,3)); const st=new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:1.6,fog:false})); st.userData.own=1; worldG.add(st);
    const pl=new THREE.Mesh(new THREE.SphereGeometry(30,24,16),new THREE.MeshLambertMaterial({color:0x5c6bc0,emissive:0x1a237e,fog:false})); pl.position.set(-90,60,-150); pl.userData.own=1; worldG.add(pl);
  } else { const cols=key=>key==="desert"?[0xe0b070,0xc99555]:[0xff8a65,0x4fc3f7,0xffd54f,0x81c784,0xba68c8]; const cs=cols(W.key);
    for(let i=0;i<22;i++){ const a=i/22*6.283+Math.random()*.2, r=S+16+Math.random()*40, h=W.key==="desert"?rnd(4,12):rnd(6,26);
      const me=new THREE.Mesh(W.key==="desert"?new THREE.ConeGeometry(rnd(10,20),h,5):UNIT,mat(pick(cs),W.key!=="desert",0));
      if(W.key==="desert"){ me.userData.own=2; me.position.set(Math.cos(a)*r,h/2-1,Math.sin(a)*r); } else { const s=rnd(4,9); me.scale.set(s,h,s); me.position.set(Math.cos(a)*r,h/2,Math.sin(a)*r); }
      worldG.add(me); }
    { const c=document.createElement("canvas"); c.width=c.height=128; const x=c.getContext("2d"), g=x.createRadialGradient(64,64,4,64,64,64); g.addColorStop(0,"rgba(255,255,240,1)"); g.addColorStop(.25,"rgba(255,240,180,.7)"); g.addColorStop(1,"rgba(255,220,120,0)"); x.fillStyle=g; x.fillRect(0,0,128,128);
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),blending:THREE.AdditiveBlending,fog:false,depthWrite:false})); sp.position.copy(sun.position).normalize().multiplyScalar(230); sp.scale.set(110,110,1); sp.userData.own=1; sp.geometry={dispose(){}}; worldG.add(sp); }
    for(let i=0;i<7;i++){ const cl=new THREE.Mesh(UNIT,matB(0xffffff)); cl.scale.set(rnd(10,20),2.5,rnd(6,10)); cl.position.set(rnd(-90,90),rnd(32,48),rnd(-90,90)); worldG.add(cl); W.spin.push(cl); } } }

/* 길찾기 격자 (1칸 = 1걸음) */
function buildGrid(){ const S=W.S,n=2*S; W.gn=n; const g=W.grid=new Uint8Array(n*n);
  for(const b of W.boxes){ if(b.y0>1.5||b.y1<.57) continue; const x0=Math.max(0,Math.floor(b.x0-.42+S)),x1=Math.min(n-1,Math.floor(b.x1+.42+S)),z0=Math.max(0,Math.floor(b.z0-.42+S)),z1=Math.min(n-1,Math.floor(b.z1+.42+S));
    for(let z=z0;z<=z1;z++) for(let x=x0;x<=x1;x++) g[z*n+x]=1; }
  W.q=new Int32Array(n*n); }
function freeCell(x,z){ const n=W.gn,S=W.S,g=W.grid; const cx=clamp(Math.floor(x+S),0,n-1), cz=clamp(Math.floor(z+S),0,n-1); if(!g[cz*n+cx]) return cz*n+cx;
  for(let r=1;r<9;r++) for(let dz=-r;dz<=r;dz++) for(let dx=-r;dx<=r;dx++){ if(Math.max(Math.abs(dx),Math.abs(dz))!==r) continue; const X=cx+dx,Z=cz+dz; if(X<0||Z<0||X>=n||Z>=n) continue; if(!g[Z*n+X]) return Z*n+X; }
  return cz*n+cx; }
function cellPos(c,out){ const n=W.gn; out.x=(c%n)+.5-W.S; out.z=Math.floor(c/n)+.5-W.S; return out; }
function flowField(gx,gz,out){ const n=W.gn,g=W.grid,q=W.q; if(!out||out.length!==n*n) out=new Int16Array(n*n); out.fill(-1);
  let h=0,t=0; const s=freeCell(gx,gz); out[s]=0; q[t++]=s;
  while(h<t){ const c=q[h++], cx=c%n, cz=(c-cx)/n, d=out[c]+1;
    for(let dz=-1;dz<=1;dz++) for(let dx=-1;dx<=1;dx++){ if(!dx&&!dz) continue; const X=cx+dx,Z=cz+dz; if(X<0||Z<0||X>=n||Z>=n) continue; const k=Z*n+X; if(g[k]||out[k]>=0) continue;
      if(dx&&dz&&(g[cz*n+X]||g[Z*n+cx])) continue; out[k]=d; q[t++]=k; } }
  return out; }
function flowDir(f,x,z,v){ const n=W.gn,S=W.S,g=W.grid; const c=freeCell(x,z), cx=c%n, cz=(c-cx)/n; let best=f[c], bx=0, bz=0; if(best<0) return false;
  for(let dz=-1;dz<=1;dz++) for(let dx=-1;dx<=1;dx++){ if(!dx&&!dz) continue; const X=cx+dx,Z=cz+dz; if(X<0||Z<0||X>=n||Z>=n) continue; const d=f[Z*n+X]; if(d<0||d>=best) continue;
    if(dx&&dz&&(g[cz*n+X]||g[Z*n+cx])) continue; best=d; bx=dx; bz=dz; }
  if(!bx&&!bz) return false; v.x=(cx+bx+.5-S)-x; v.z=(cz+bz+.5-S)-z; const l=Math.hypot(v.x,v.z)||1; v.x/=l; v.z/=l; return true; }
function safeSpot(x,z,out){ return cellPos(freeCell(x,z),out||{}); }

/* ---------- 충돌 ---------- */
const STEP = .56;
function hitsBox(a,b){ return a.pos.x+a.r>b.x0&&a.pos.x-a.r<b.x1&&a.pos.z+a.r>b.z0&&a.pos.z-a.r<b.z1&&a.pos.y<b.y1-.001&&a.pos.y+a.h>b.y0+.001; }
function moveAxis(a,ax,d){ if(!d) return; a.pos[ax]+=d; const B=W.boxes;
  for(let i=0;i<B.length;i++){ const b=B[i]; if(!hitsBox(a,b)) continue;
    if(b.y1-a.pos.y<=STEP && a.vel.y<=.5){ const oy=a.pos.y; a.pos.y=b.y1; let blocked=false; for(let j=0;j<B.length;j++) if(j!==i&&hitsBox(a,B[j])){ blocked=true; break; } if(!blocked) continue; a.pos.y=oy; }
    if(ax==="x") a.pos.x=d>0?b.x0-a.r-.001:b.x1+a.r+.001; else a.pos.z=d>0?b.z0-a.r-.001:b.z1+a.r+.001; a.wall=true; } }
function moveActor(a,dt){ a.wall=false; a.vel.y-=W.grav*dt; if(a.vel.y<-45) a.vel.y=-45;
  moveAxis(a,"x",a.vel.x*dt); moveAxis(a,"z",a.vel.z*dt);
  const oy=a.pos.y; let ny=oy+a.vel.y*dt; a.ground=false; if(ny<=0){ ny=0; if(a.vel.y<0) a.vel.y=0; a.ground=true; }
  const B=W.boxes; for(let i=0;i<B.length;i++){ const b=B[i]; if(a.pos.x+a.r<=b.x0||a.pos.x-a.r>=b.x1||a.pos.z+a.r<=b.z0||a.pos.z-a.r>=b.z1) continue;
    if(a.vel.y<=0 && oy>=b.y1-.002 && ny<b.y1){ ny=b.y1; a.vel.y=0; a.ground=true; }
    else if(a.vel.y>0 && oy+a.h<=b.y0+.002 && ny+a.h>b.y0){ ny=b.y0-a.h; a.vel.y=0; } }
  a.pos.y=ny; const L=W.S-a.r; a.pos.x=clamp(a.pos.x,-L,L); a.pos.z=clamp(a.pos.z,-L,L); }

/* ---------- 광선 ---------- */
function rayBox(o,d,b){ let t0=0,t1=1e9,a,c;
  if(Math.abs(d.x)<1e-8){ if(o.x<b.x0||o.x>b.x1) return -1; } else { a=(b.x0-o.x)/d.x; c=(b.x1-o.x)/d.x; if(a>c){ const t=a;a=c;c=t; } if(a>t0)t0=a; if(c<t1)t1=c; if(t0>t1) return -1; }
  if(Math.abs(d.y)<1e-8){ if(o.y<b.y0||o.y>b.y1) return -1; } else { a=(b.y0-o.y)/d.y; c=(b.y1-o.y)/d.y; if(a>c){ const t=a;a=c;c=t; } if(a>t0)t0=a; if(c<t1)t1=c; if(t0>t1) return -1; }
  if(Math.abs(d.z)<1e-8){ if(o.z<b.z0||o.z>b.z1) return -1; } else { a=(b.z0-o.z)/d.z; c=(b.z1-o.z)/d.z; if(a>c){ const t=a;a=c;c=t; } if(a>t0)t0=a; if(c<t1)t1=c; if(t0>t1) return -1; }
  return t0; }
function rayWorld(o,d,max){ let t=max; if(d.y<-1e-6){ const tg=-o.y/d.y; if(tg<t) t=tg; }
  const B=W.boxes; for(let i=0;i<B.length;i++){ const tt=rayBox(o,d,B[i]); if(tt>=0&&tt<t) t=tt; } return t; }
const _hb = {x0:0,x1:0,y0:0,y1:0,z0:0,z1:0};
/* 캐릭터 맞았는지: 머리(공) + 몸(상자). mag 는 조준 보정(터치일 때 조금 크게) */
function rayActor(o,d,a,mag){ const s=a.scale||1, w=.4*s*mag, hc=a.hsc||1; let best=-1, head=false;
  _hb.x0=a.pos.x-w; _hb.x1=a.pos.x+w; _hb.z0=a.pos.z-w; _hb.z1=a.pos.z+w; _hb.y0=a.pos.y; _hb.y1=a.pos.y+1.36*s*hc;
  const tb=rayBox(o,d,_hb); if(tb>=0) best=tb;
  const hx=a.pos.x-o.x, hy=a.pos.y+1.6*s*hc-o.y, hz=a.pos.z-o.z, r=.3*s*mag, tc=hx*d.x+hy*d.y+hz*d.z;
  if(tc>0){ const d2=hx*hx+hy*hy+hz*hz-tc*tc; if(d2<r*r){ const th=tc-Math.sqrt(r*r-d2); if(best<0||th<best+.25){ best=Math.max(0,th); head=true; } } }
  return best<0?null:{t:best,head}; }

/* ---------- 이펙트 ---------- */
const FX = {tr:[],pt:[],fl:[],ex:[],shake:0};
const HS = {t:0}; function hitStop(s){ HS.t=Math.max(HS.t,s); }   /* 순간 멈춤(손맛) */
const _v1 = V3(), _v2 = V3(), _v3 = V3();
function tracer(from,to,col,w,life){ let t=FX.tr.find(x=>x.t<=0);
  if(!t){ if(FX.tr.length>48) return; const m=new THREE.Mesh(UNIT,new THREE.MeshBasicMaterial({color:col,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})); fxG.add(m); t={m,t:0,life:.1}; FX.tr.push(t); }
  const len=from.distanceTo(to); t.m.material.color.setHex(col); t.m.position.copy(from).add(to).multiplyScalar(.5); t.m.lookAt(to); t.m.scale.set(w||.04,w||.04,len); t.m.visible=true; t.life=t.t=life||.1; }
function burst(pos,col,n,spd,size,life,grav){ for(let i=0;i<n;i++){ let p=FX.pt.find(x=>x.t<=0);
    if(!p){ if(FX.pt.length>150) return; const m=new THREE.Mesh(UNIT,matB(col)); fxG.add(m); p={m,v:V3(),t:0,life:1,g:0,s:.1}; FX.pt.push(p); }
    p.m.material=matB(col); p.m.position.copy(pos); p.v.set(rnd(-1,1),rnd(-.3,1.2),rnd(-1,1)).normalize().multiplyScalar(spd*rnd(.4,1)); p.s=size||.1; p.g=grav==null?12:grav; p.life=p.t=(life||.5)*rnd(.6,1); p.m.visible=true; p.m.rotation.set(rnd(0,3),rnd(0,3),0); } }
function boomFx(pos,r,col){ const m=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshBasicMaterial({color:col||0xffa726,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})); m.position.copy(pos); fxG.add(m); FX.ex.push({m,t:.35,r});
  burst(pos,0xffca28,14,9,.22,.6,10); burst(pos,0x616161,8,5,.3,.8,3); }
function floatText(pos,txt,col,size,life){ let f=FX.fl.find(x=>x.t<=0);
  if(!f){ if(FX.fl.length>22) f=FX.fl[0]; else { const el=document.createElement("span"); $("floats").appendChild(el); f={el,p:V3(),t:0,life:1}; FX.fl.push(f); } }
  f.el.textContent=txt; f.el.style.color=col||"#fff"; f.el.style.fontSize=(size||18)+"px"; f.p.copy(pos); f.p.x+=rnd(-.25,.25); f.life=f.t=life||.8; f.el.style.display="block"; }
function toScreen(v,out){ _v3.copy(v).project(camera); out.ok=_v3.z<1&&_v3.z>-1; out.x=(_v3.x*.5+.5)*innerWidth; out.y=(-_v3.y*.5+.5)*innerHeight; return out; }
const _sc = {x:0,y:0,ok:false};
function updateFX(dt,time){
  for(const t of FX.tr){ if(t.t<=0) continue; t.t-=dt; if(t.t<=0){ t.m.visible=false; continue; } t.m.material.opacity=t.t/t.life; }
  for(const p of FX.pt){ if(p.t<=0) continue; p.t-=dt; if(p.t<=0){ p.m.visible=false; continue; } p.v.y-=p.g*dt; p.m.position.addScaledVector(p.v,dt); if(p.m.position.y<.03){ p.m.position.y=.03; p.v.y*=-.35; p.v.x*=.6; p.v.z*=.6; } const s=p.s*(p.t/p.life); p.m.scale.set(s,s,s); }
  for(let i=FX.ex.length-1;i>=0;i--){ const e=FX.ex[i]; e.t-=dt; if(e.t<=0){ fxG.remove(e.m); e.m.geometry.dispose(); e.m.material.dispose(); FX.ex.splice(i,1); continue; } const k=1-e.t/.35; e.m.scale.setScalar(e.r*(.3+k*.8)); e.m.material.opacity=1-k; }
  for(const f of FX.fl){ if(f.t<=0) continue; f.t-=dt; if(f.t<=0){ f.el.style.display="none"; continue; } f.p.y+=dt*1.1; toScreen(f.p,_sc); if(!_sc.ok){ f.el.style.opacity=0; continue; } f.el.style.opacity=Math.min(1,f.t/f.life*2); f.el.style.left=_sc.x+"px"; f.el.style.top=_sc.y+"px"; }
  for(const p of W.pads){ p.ring.position.y=.25+((time*1.4)%1)*1.1; p.ring.scale.setScalar(1-((time*1.4)%1)*.5); }
  for(const c of W.spin){ c.position.x+=dt*1.2; if(c.position.x>110) c.position.x=-110; }
  if(ML.intensity>0) ML.intensity=Math.max(0,ML.intensity-dt*16);
  if(FX.shake>0) FX.shake=Math.max(0,FX.shake-dt*2.5); }
function clearFX(){ for(const t of FX.tr){ t.t=0; t.m.visible=false; } for(const p of FX.pt){ p.t=0; p.m.visible=false; } for(const f of FX.fl){ f.t=0; f.el.style.display="none"; } for(const e of FX.ex){ fxG.remove(e.m); } FX.ex.length=0; FX.shake=0; }

let toastT=null;
function toast(msg,sec){ const t=$("toast"); t.textContent=msg; t.classList.add("s"); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("s"),(sec||2.2)*1000); }
