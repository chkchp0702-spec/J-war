"use strict";
/* ===== J war — 온라인 (아주 작은 MQTT 클라이언트 + 방) ===== */
function MiniMQTT(url,opt){
  const self={url,ok:false,ws:null,buf:new Uint8Array(0),pid:1,pingT:null,retry:null,closed:false,subs:[],opt};
  const enc=new TextEncoder(), dec=new TextDecoder();
  function str(s){ const b=enc.encode(s); const o=new Uint8Array(b.length+2); o[0]=b.length>>8; o[1]=b.length&255; o.set(b,2); return o; }
  function cat(arr){ let n=0; arr.forEach(a=>n+=a.length); const o=new Uint8Array(n); let p=0; arr.forEach(a=>{ o.set(a,p); p+=a.length; }); return o; }
  function pkt(type,body){ const len=[]; let x=body.length; do{ let d=x%128; x=Math.floor(x/128); if(x>0) d|=128; len.push(d); }while(x>0); return cat([new Uint8Array([type]),new Uint8Array(len),body]); }
  function send(u8){ try{ if(self.ws&&self.ws.readyState===1) self.ws.send(u8); }catch(e){} }
  function connect(){ if(self.closed) return; let ws; try{ ws=new WebSocket(url,"mqtt"); }catch(e){ schedule(); return; } ws.binaryType="arraybuffer"; self.ws=ws;
    const to=setTimeout(()=>{ try{ ws.close(); }catch(e){} },9000);
    ws.onopen=()=>{ const body=cat([str("MQTT"),new Uint8Array([4,2,0,opt.keepalive||25]),str(opt.clientId)]); send(pkt(0x10,body)); };
    ws.onmessage=ev=>{ const d=new Uint8Array(ev.data); self.buf=cat([self.buf,d]); parse(); };
    ws.onclose=()=>{ clearTimeout(to); if(self.ok){ self.ok=false; opt.onclose&&opt.onclose(); } clearInterval(self.pingT); schedule(); };
    ws.onerror=()=>{};
    function parse(){ for(;;){ const b=self.buf; if(b.length<2) return; let mul=1,len=0,i=1; for(;;){ if(i>=b.length) return; const d=b[i++]; len+=(d&127)*mul; mul*=128; if(!(d&128)) break; } if(b.length<i+len) return; const type=b[0]>>4, body=b.subarray(i,i+len); self.buf=b.subarray(i+len);
        if(type===2){ if(body[1]===0){ self.ok=true; clearTimeout(to); self.pingT=setInterval(()=>send(new Uint8Array([0xC0,0])),(opt.keepalive||25)*1000*.6); self.subs.forEach(t=>subscribe(t)); opt.onconnect&&opt.onconnect(); } else { try{ ws.close(); }catch(e){} } }
        else if(type===3){ const qos=(b[0]>>1)&3; const tl=(body[0]<<8)|body[1]; const topic=dec.decode(body.subarray(2,2+tl)); let p=2+tl; if(qos>0) p+=2; const retain=b[0]&1; opt.onmessage&&opt.onmessage(topic,dec.decode(body.subarray(p)),!!retain); } } }
  }
  function schedule(){ if(self.closed) return; clearTimeout(self.retry); self.retry=setTimeout(connect,3000+Math.random()*2000); }
  function subscribe(t){ if(self.subs.indexOf(t)<0) self.subs.push(t); if(!self.ok) return; const id=self.pid++; send(pkt(0x82,cat([new Uint8Array([id>>8,id&255]),str(t),new Uint8Array([0])]))); }
  function publish(t,msg,retain){ if(!self.ok) return; send(pkt(0x30|(retain?1:0),cat([str(t),enc.encode(msg)]))); }
  function close(){ self.closed=true; clearInterval(self.pingT); clearTimeout(self.retry); try{ self.ws&&self.ws.close(); }catch(e){} }
  connect(); return {subscribe,publish,close,get ok(){ return self.ok; }};
}

/* ---------- 방(room) 연결: 같은 방 번호의 폰끼리 공개 중계 서버로 주고받음 ---------- */
const NET = {peers:{},room:"",on:false,clients:[],up:0,seq:0,seen:{},seenN:0,finished:{},join:0,cur:null,stT:0,hiT:0,shT:0,bc:null,
  BROKERS:["wss://broker.emqx.io:8084/mqtt","wss://broker.hivemq.com:8884/mqtt","wss://test.mosquitto.org:8081"], FAKE:/[?&]fakenet=1/.test(location.search),
  topic(){ return "chk0702/jwar/v1/"+NET.room; },
  joinRoom(code){ NET.leave(); NET.room=String(code); NET.on=true; NET.join=Date.now(); NET.peers={}; NET.cur=null; NET.up=0; NET.hiT=0;
    if(NET.FAKE){ NET.bc=new BroadcastChannel("jwar-"+NET.room); NET.bc.onmessage=e=>{ try{ NET.recv(JSON.parse(e.data)); }catch(x){ console.warn(x); } }; NET.up=1; NET.pill(); return; }
    NET.BROKERS.forEach((url,i)=>{ const c=MiniMQTT(url,{clientId:"jw_"+G.id+"_"+i+"_"+Math.random().toString(36).slice(2,6),keepalive:25,
      onconnect:()=>{ NET.up++; c.subscribe(NET.topic()); NET.pill(); NET.hello(); },
      onclose:()=>{ NET.up=Math.max(0,NET.up-1); NET.pill(); },
      onmessage:(t,msg)=>{ let d; try{ d=JSON.parse(msg); }catch(e){ return; } try{ NET.recv(d); }catch(e){ console.warn(e); } } }); NET.clients.push(c); }); NET.pill(); },
  leave(){ if(!NET.on) return; NET.send({t:"bye"}); NET.on=false; NET.clients.forEach(c=>{ try{ c.close(); }catch(e){} }); NET.clients=[]; if(NET.bc){ NET.bc.close(); NET.bc=null; } NET.peers={}; NET.room=""; NET.up=0; NET.cur=null; NET.pill(); },
  send(o){ if(!NET.on) return; o.i=G.id; o.q=++NET.seq; const s=JSON.stringify(o); if(NET.bc){ NET.bc.postMessage(s); return; } const tp=NET.topic(); NET.clients.forEach(c=>{ if(c.ok) try{ c.publish(tp,s); }catch(e){} }); },
  hello(){ NET.send({t:"hi",n:G.name||"친구",sk:G.skin,ht:G.hat,j:NET.join,w:P?P.wkey:G.eq[0]}); if(NET.isHost()&&NET.cur&&NET.cur.end>Date.now()+1500) NET.send({t:"gm",map:NET.cur.map,mid:NET.cur.mid,left:NET.cur.end-Date.now()}); },
  isHost(){ let j=NET.join, id=G.id; for(const k in NET.peers){ const p=NET.peers[k]; if(p.j&&(p.j<j||(p.j===j&&p.id<id))){ j=p.j; id=p.id; } } return id===G.id; },
  count(){ return Object.keys(NET.peers).length+1; },
  startMatch(map){ if(!NET.isHost()) return; const cfg={map,mid:Date.now()%1e9,end:Date.now()+184000}; NET.cur=cfg; NET.send({t:"gm",map,mid:cfg.mid,left:cfg.end-Date.now()}); startOnline(cfg); },
  shot(k,o,d){ const now=performance.now(); if(now-NET.shT<85) return; NET.shT=now; const r=v=>Math.round(v*100)/100, r3=v=>Math.round(v*1000)/1000; NET.send({t:"sh",w:k,o:[r(o.x),r(o.y),r(o.z)],d:[r3(d.x),r3(d.y),r3(d.z)]}); },
  pill(){ const n=NET.count()-1; UI.net(!NET.on?"":NET.up>0?("방 "+NET.room+" · "+(n>0?n+1+"명 접속":"친구 기다리는 중")):"서버에 연결 중…"); if(UI.scr==="lobby") UI.lobby(); },
  recv(d){ if(!NET.on||!d||d.i===G.id||!d.i) return; const key=d.i+":"+d.q; if(NET.seen[key]) return; NET.seen[key]=1; if(++NET.seenN>4000){ NET.seen={}; NET.seenN=0; }
    let p=NET.peers[d.i]; if(d.t==="bye"){ if(p) NET.drop(p,"나감"); return; }
    if(!p){ if(NET.count()>=8) return; p=NET.peers[d.i]={id:d.i,n:"친구",sk:0,ht:0,j:0,k:0,dd:0,w:"rifle",known:false}; }
    p.last=performance.now(); const inMatch=M.active&&M.type==="online", a=inMatch?remoteActor(p):null;
    if(d.t==="hi"){ const isNew=!p.known; p.known=true; p.n=String(d.n||"친구").slice(0,8); p.sk=d.sk|0; p.ht=d.ht|0; p.j=+d.j||0; if(WEAPONS[d.w]) p.w=d.w;
      if(isNew){ toast(p.n+" 입장!"); jingle([523,659,784]); NET.hello(); if(a&&a.name!==p.n){ removeActor(a); remoteActor(p); } } NET.pill(); }
    else if(d.t==="st"){ p.k=d.k|0; p.dd=d.dd|0; if(!a) return; a.tx=+d.x; a.ty=+d.y; a.tz=+d.z; a.tyaw=+d.a; a.tp=+d.p; a.hp=+d.h; a.maxhp=Math.max(100,a.hp); a.inv=d.iv?.35:0;
      if(d.al&&!a.alive){ a.alive=true; a.pos.set(a.tx,a.ty,a.tz); a.yaw=a.tyaw; } else if(!d.al&&a.alive){ a.dT=(a.dT||0)+1; if(a.dT>3){ a.alive=false; a.dT=0; } } else a.dT=0; }
    else if(d.t==="sh"){ if(a&&a.alive&&WEAPONS[d.w]&&d.o&&d.d){ a.wkey=d.w; shoot(a,d.w,_no.set(+d.o[0],+d.o[1],+d.o[2]),_nd.set(+d.d[0],+d.d[1],+d.d[2]).normalize(),{visual:true}); } }
    else if(d.t==="hit"){ if(a) netHit(d,a); }
    else if(d.t==="dead"){ if(a) netDead(d,a); }
    else if(d.t==="gm"){ const left=+d.left||0; if(left<4000||NET.finished[d.mid]||!MAPS[d.map]) return; const cfg={map:d.map,mid:d.mid,end:Date.now()+left}; NET.cur=cfg;
      if(!M.active&&UI.scr==="lobby") startOnline(cfg); } },
  drop(p,why){ delete NET.peers[p.id]; const a=ACT.find(x=>x.id===p.id&&x.remote); if(a) removeActor(a); if(p.known) toast(p.n+" "+why); NET.pill(); },
  tick(dt){ if(!NET.on) return; NET.hiT-=dt; if(NET.hiT<=0){ NET.hiT=2.5; NET.hello(); const now=performance.now(); for(const k in NET.peers){ const p=NET.peers[k]; if(now-p.last>8000) NET.drop(p,"연결 끊김"); } }
    if(M.active&&M.type==="online"&&P){ NET.stT-=dt; if(NET.stT<=0){ NET.stT=.1; const r=v=>Math.round(v*100)/100;
      NET.send({t:"st",x:r(P.pos.x),y:r(P.pos.y),z:r(P.pos.z),a:r(P.yaw),p:r(P.pitch),h:Math.round(P.hp),al:P.alive?1:0,k:P.kills,dd:P.deaths,iv:P.inv>0?1:0}); } } },
};
const _no = V3(), _nd = V3();
