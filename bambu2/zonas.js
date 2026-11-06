/* Bambú CIMA 2.0 · Zonas y movimientos: termómetros STH, LTH y z frente a los movimientos de precio */
(function(){
"use strict";
const B=window.Bambu2,S=window.Bambu2S,$=s=>document.querySelector(s);
const THS=[20,25,30,35,40,45,50,60,75,100],HS=[30,90,180],MIN_N=5,GAP=30;
const RANGES=[["1a","1 año",365],["2a","2 años",730],["4a","4 años",1460],["max","Máx.",1e6]];
const INDS={sth:"Termómetro STH",lth:"Termómetro LTH",z:"z corto"};
const get=(k,d)=>{try{return localStorage.getItem("b2_zm_"+k)||d;}catch(e){return d;}};
const put=(k,v)=>{try{localStorage.setItem("b2_zm_"+k,v);}catch(e){}};
const st={t:get("t","BTC"),ind:get("ind","sth"),th:+get("th","20"),h:+get("h","90"),r:get("r","4a"),from:get("from",""),to:get("to","")};

const f0=v=>v==null?"—":Math.round(v).toLocaleString("es-ES",{useGrouping:"always"});
const f2=v=>v==null?"—":v.toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2});
const usd=v=>v==null?"—":"$"+(v>=1000?f0(v):v.toLocaleString("es-ES",{maximumFractionDigits:2}));
const sg=v=>v==null?"—":(v>=0?"+":"−")+f2(Math.abs(v));
const pc=v=>v==null?"—":(v>=0?"+":"−")+Math.abs(Math.round(v*100))+" %";
const fd=iso=>new Date(iso+"T00:00:00Z").toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"});
const num=v=>String(v).replace(".",",");

/* ---------- rango de fechas: lo marcan los botones o Desde/Hasta ---------- */
function range(s){const n=s.n,first=s.short.findIndex(v=>v!=null);let i0,i1=n-1;
 if(st.r==="custom"){i0=first;if(st.from)while(i0<n-1&&s.d[i0]<st.from)i0++;if(st.to)while(i1>first&&s.d[i1]>st.to)i1--;}
 else i0=Math.max(first,n-RANGES.find(r=>r[0]===st.r)[2]);
 if(i1<=i0){i1=Math.min(n-1,i0+1);i0=i1-1;}
 return{i0,i1,first};}

/* ---------- zonas de cada indicador, de frío a calor ---------- */
function zones(t,ind){
 if(ind==="sth"){let a=0;return B.STZ.map(z=>{const o={k:z[1],lbl:z[1],col:z[4],a,b:Math.min(z[0],100)};a=z[0];return o;});}
 if(ind==="lth")return [["MUY FRÍO",0,20,"#1f4e9c"],["FRÍO",20,40,"#5a8fd6"],["TEMPLADO",40,60,"#5e655f"],["CALIENTE",60,80,"#ee9b4a"],["MUY CALIENTE",80,100,"#c0392b"]].map(([k,a,b,col])=>({k,lbl:k,col,a,b}));
 const c=B.CFG[t];
 return [["MUY FRÍO",-2.5,-1,"#1f4e9c"],["MÁS ABAJO",-1,c.buy[0],"#3d6fbf"],["COMPRA",c.buy[0],c.buy[1],"#5a8fd6"],["TEMPLADO",c.buy[1],1,"#5e655f"],["VIGILAR",1,c.sellO,"#d9b93a"],["CALIENTE",c.sellO,c.sellR,"#ee9b4a"],["VENTA FUERTE",c.sellR,3.5,"#c0392b"]].map(([k,a,b,col])=>({k,lbl:k,col,a,b}));
}
const series=(s,ind)=>ind==="sth"?s.short:ind==="lth"?s.cyc:s.z;
function zoneOf(t,ind,v){if(v==null)return null;
 if(ind==="sth")return B.stZone(v).k;if(ind==="lth")return B.idxLabel(v).k;return B.zone(t,v).lbl;}
const zoneObj=(t,ind,k)=>zones(t,ind).find(z=>z.k===k);
const fmtInd=(ind,v)=>v==null?"—":ind==="z"?sg(v):String(Math.round(v));

/* ---------- episodios: cada entrada a una zona tras más de 30 días fuera ---------- */
const memo={};
function episodes(t,ind,H){const key=t+ind+H;if(memo[key])return memo[key];
 const s=S[t],a=series(s,ind),out={},last={};
 zones(t,ind).forEach(z=>out[z.k]=[]);
 for(let i=0;i<s.n;i++){if(a[i]==null)continue;const k=zoneOf(t,ind,a[i]);
  if((last[k]==null||i-last[k]>GAP)&&i+H<s.n){let up=0,dn=0;for(let j=i+1;j<=i+H;j++){const m=s.p[j]/s.p[i]-1;if(m>up)up=m;if(m<dn)dn=m;}out[k].push({i,up,dn});}
  last[k]=i;}
 return memo[key]=out;}
const share=(eps,fn)=>eps.length?eps.filter(fn).length/eps.length:null;
const median=a=>{if(!a.length)return null;const b=[...a].sort((x,y)=>x-y),m=b.length>>1;return b.length%2?b[m]:(b[m-1]+b[m])/2;};

/* ---------- movimientos: zigzag sobre cierres diarios ---------- */
function legs(p,th){const T=th/100,piv=[];let dir=0,lo=0,hi=0,ext=0;
 for(let i=1;i<p.length;i++){
  if(dir===0){if(p[i]<p[lo])lo=i;if(p[i]>p[hi])hi=i;
   if(lo<i&&p[i]/p[lo]-1>=T){piv.push(lo);dir=1;ext=i;}
   else if(hi<i&&1-p[i]/p[hi]>=T){piv.push(hi);dir=-1;ext=i;}}
  else if(dir===1){if(p[i]>p[ext])ext=i;else if(1-p[i]/p[ext]>=T){piv.push(ext);dir=-1;ext=i;}}
  else{if(p[i]<p[ext])ext=i;else if(p[i]/p[ext]-1>=T){piv.push(ext);dir=1;ext=i;}}}
 const out=[];for(let k=0;k<piv.length;k++){const a=piv[k],b=k+1<piv.length?piv[k+1]:ext;if(b>a)out.push({a,b,m:p[b]/p[a]-1,open:k===piv.length-1});}
 return out;}

/* ---------- lectura de hoy ---------- */
function gauge(t,ind){const s=S[t],a=series(s,ind),v=a[s.n-1],Z=zones(t,ind),k=zoneOf(t,ind,v),z=zoneObj(t,ind,k);
 const lo=Z[0].a,hi=Z[Z.length-1].b,pos=x=>(Math.max(lo,Math.min(hi,x))-lo)/(hi-lo)*100;
 const eps=episodes(t,ind,st.h)[k]||[],T=st.th/100,u=share(eps,e=>e.up>=T),d=share(eps,e=>e.dn<=-T);
 const hist=eps.length?`En ${st.h} días: sube ≥${st.th} % en <b>${Math.round(u*100)} %</b> · cae ≥${st.th} % en <b>${Math.round(d*100)} %</b> <span class="muted">(${eps.length} episodios${eps.length<MIN_N?", poca muestra":""})</span>`:"Sin episodios suficientes";
 return `<div class="zm-g"><div class="zm-gh"><span class="zm-gn">${INDS[ind]}</span><span class="zm-gv">${fmtInd(ind,v)}</span><span class="zm-chip"><i style="background:${z.col}"></i>${k}</span></div>
 <div class="zm-bar" role="img" aria-label="${INDS[ind]} ${fmtInd(ind,v)}, zona ${k}">${Z.map(q=>`<em style="left:${pos(q.a)}%;width:${pos(q.b)-pos(q.a)}%;background:${q.col}"></em>`).join("")}<i style="left:${pos(v)}%"></i></div>
 <p class="zm-gp">${hist}</p></div>`;}
function today(){return ["BTC","ETH"].map(t=>{const s=S[t],i=s.n-1,dev=s.p[i]/s.c[i]-1;
 return `<article class="card zm-c"><header><b>${B.CFG[t].name}</b><span>${usd(s.p[i])}</span></header>${gauge(t,"sth")}${gauge(t,"lth")}${gauge(t,"z")}<p class="zm-dv">Precio frente al coste STH: <b>${pc(dev)}</b> <span class="muted">(coste ${usd(s.c[i])})</span></p></article>`;}).join("");}

/* ---------- gráfico de tres paneles ---------- */
function ticksLog(lo,hi){const out=[];for(let e=Math.floor(Math.log10(lo));e<=Math.ceil(Math.log10(hi));e++)for(const m of [1,2,5]){const v=m*10**e;if(v>=lo&&v<=hi)out.push(v);}return out;}
function chart(){const box=$("#zm-chart"),s=S[st.t],n=s.n,W=Math.max(260,box.clientWidth),small=W<640;
 const {i0,i1}=range(s),N=i1-i0;
 const PL=small?6:10,PR=small?48:64,top=[10,small?256:346,small?380:486],hh=[small?228:318,small?100:118,small?100:118],H=top[2]+hh[2]+24;
 const iw=W-PL-PR,x=i=>PL+(i-i0)/N*iw;
 const Lg=legs(s.p,st.th).filter(l=>l.b>=i0&&l.a<=i1),Ld=Lg.filter(l=>l.b<=i1);
 let lo=Infinity,hi=0;for(let i=i0;i<=i1;i++){if(s.p[i]<lo)lo=s.p[i];if(s.p[i]>hi)hi=s.p[i];}lo*=.84;hi*=1.2;
 const yP=v=>top[0]+hh[0]-(Math.log(v)-Math.log(lo))/(Math.log(hi)-Math.log(lo))*hh[0];
 const pts=(f,a=i0,b=i1)=>{let o="";for(let i=a;i<=b;i++){const v=f(i);if(v!=null)o+=`${x(i).toFixed(1)},${v.toFixed(1)} `;}return o;};
 const Z=zones(st.t,st.ind),a=series(s,st.ind),op=z=>/NEUTRA|TEMPLADO/.test(z.k)?.1:.3;
 let g="";
 /* fondo por zona en el panel de precio */
 let from=i0,cur=zoneOf(st.t,st.ind,a[i0]);
 for(let i=i0+1;i<=i1+1;i++){const k=i<=i1?zoneOf(st.t,st.ind,a[i]):null;if(k!==cur){const z=zoneObj(st.t,st.ind,cur);if(z)g+=`<rect x="${x(from).toFixed(1)}" y="${top[0]}" width="${(Math.min(x(i),PL+iw)-x(from)).toFixed(1)}" height="${hh[0]}" fill="${z.col}" fill-opacity="${op(z)}"/>`;from=i;cur=k;}}
 /* eje de tiempo */
 const axis=[];let pk=null;const every=Math.max(1,Math.round(N/5));for(let i=i0;i<=i1;i++){const d=s.d[i],m=+d.slice(5,7),y=d.slice(0,4),key=N>800?y:N>400?(m%3===1?d.slice(0,7):null):N>150?(m%2===1?d.slice(0,7):null):N>45?d.slice(0,7):((i-i0)%every===0?d:null);
  if(key&&key!==pk&&i>i0){const lab=N>800?y:new Date(d+"T00:00:00Z").toLocaleDateString("es-ES",N>45?{month:"short",year:"2-digit",timeZone:"UTC"}:{day:"numeric",month:"short",timeZone:"UTC"});
   if(!(small&&N>800&&+y%2))axis.push(`<line x1="${x(i).toFixed(1)}" x2="${x(i).toFixed(1)}" y1="${top[0]}" y2="${top[2]+hh[2]}" class="zm-grid"/><text x="${(x(i)+3).toFixed(1)}" y="${H-8}" class="zm-ax">${lab}</text>`);}
  if(key)pk=key;}
 const rlab=(y,t,cls="zm-ax")=>`<text x="${W-PR+6}" y="${(y+3.5).toFixed(1)}" class="${cls}">${t}</text>`;
 /* panel 1: precio y movimientos */
 ticksLog(lo,hi).forEach(v=>{g+=`<line x1="${PL}" x2="${W-PR}" y1="${yP(v).toFixed(1)}" y2="${yP(v).toFixed(1)}" class="zm-grid"/>`+rlab(yP(v),v>=1000?"$"+v/1000+"k":"$"+v);});
 g+=`<polyline points="${pts(i=>yP(s.p[i]))}" fill="none" stroke="#141714" stroke-opacity=".55" stroke-width="1.2" stroke-linejoin="round"/>`;
 Lg.forEach(l=>{const A=Math.max(l.a,i0),E=Math.min(l.b,i1);g+=`<line x1="${x(A).toFixed(1)}" y1="${yP(s.p[A]).toFixed(1)}" x2="${x(E).toFixed(1)}" y2="${yP(s.p[E]).toFixed(1)}" stroke="${l.m>=0?"#0d7a2f":"#c0392b"}" stroke-width="2" stroke-linecap="round"${l.open?' stroke-dasharray="5 4"':""}/>`;});
 Ld.forEach(l=>{const up=l.m>=0;g+=`<circle cx="${x(l.b).toFixed(1)}" cy="${yP(s.p[l.b]).toFixed(1)}" r="3.5" fill="${up?"#0d7a2f":"#c0392b"}" stroke="#fff" stroke-width="1.5"/>`;});
 /* etiquetas: primero los mayores; se omiten las que chocarían */
 const kept=[],lw=small?40:46;[...Ld].sort((p,q)=>Math.abs(q.m)-Math.abs(p.m)).forEach(l=>{const up=l.m>=0,px=x(l.b),py=yP(s.p[l.b])+(up?-9:17);
  if(px>W-PR-6||kept.some(o=>Math.abs(o.x-px)<lw&&Math.abs(o.y-py)<15))return;kept.push({x:px,y:py});
  g+=`<text x="${Math.max(PL+20,Math.min(px,W-PR-20)).toFixed(1)}" y="${py.toFixed(1)}" text-anchor="middle" class="zm-lb">${pc(l.m)}</text>`;});
 g+=`<text x="${PL+6}" y="${top[0]+15}" class="zm-pt">${small?`Tramos ≥${st.th} % · fondo: zona`:`Precio y movimientos de ≥${st.th} % · fondo: zona del ${INDS[st.ind]}`}</text>`;
 /* panel 2: indicador con sus zonas */
 const zlo=st.ind==="z"?-2.5:0,zhi=st.ind==="z"?3.5:100,yZ=v=>top[1]+hh[1]-(Math.max(zlo,Math.min(zhi,v))-zlo)/(zhi-zlo)*hh[1];
 Z.forEach(z=>{g+=`<rect x="${PL}" y="${yZ(z.b).toFixed(1)}" width="${iw}" height="${(yZ(z.a)-yZ(z.b)).toFixed(1)}" fill="${z.col}" fill-opacity="${op(z)}"/>`;});
 (st.ind==="z"?[-1,0,1,2,3]:[20,40,60,80]).forEach(v=>{g+=rlab(yZ(v),st.ind==="z"?sg(v).replace(",00",""):v);});
 g+=`<polyline points="${pts(i=>a[i]==null?null:yZ(a[i]))}" fill="none" stroke="#141714" stroke-width="1.5" stroke-linejoin="round"/><text x="${PL+6}" y="${top[1]+15}" class="zm-pt">${INDS[st.ind]}${st.ind==="z"&&!small?" (recortado a −2,5 / +3,5)":""}</text>`;
 /* panel 3: desviación % frente al coste STH */
 let dl=0,dh=0;for(let i=i0;i<=i1;i++){const v=s.p[i]/s.c[i]-1;if(v<dl)dl=v;if(v>dh)dh=v;}
 dl=Math.min(dl*1.1,-st.th/100*1.15);dh=Math.max(dh*1.1,st.th/100*1.15);
 const yD=v=>top[2]+hh[2]-(v-dl)/(dh-dl)*hh[2],T=st.th/100;
 [-.75,-.5,-.25,0,.25,.5,.75,1,1.5,2].filter(v=>v>dl&&v<dh).forEach(v=>{g+=`<line x1="${PL}" x2="${W-PR}" y1="${yD(v).toFixed(1)}" y2="${yD(v).toFixed(1)}" class="${v===0?"zm-zero":"zm-grid"}"/>`;if(Math.abs(v-T)>.08&&Math.abs(v+T)>.08)g+=rlab(yD(v),v?pc(v):"0 %");});
 const dv=pts(i=>yD(s.p[i]/s.c[i]-1)),base=`${x(i1).toFixed(1)},${yD(0).toFixed(1)} ${x(i0).toFixed(1)},${yD(0).toFixed(1)}`;
 g+=`<clipPath id="zm-up"><rect x="${PL}" y="${top[2]}" width="${iw}" height="${(yD(T)-top[2]).toFixed(1)}"/></clipPath><clipPath id="zm-dn"><rect x="${PL}" y="${yD(-T).toFixed(1)}" width="${iw}" height="${(top[2]+hh[2]-yD(-T)).toFixed(1)}"/></clipPath>
 <polygon points="${dv}${base}" fill="#c0392b" fill-opacity=".55" clip-path="url(#zm-up)"/><polygon points="${dv}${base}" fill="#1f4e9c" fill-opacity=".55" clip-path="url(#zm-dn)"/>`;
 [T,-T].forEach(v=>{g+=`<line x1="${PL}" x2="${W-PR}" y1="${yD(v).toFixed(1)}" y2="${yD(v).toFixed(1)}" stroke="#141714" stroke-width="1" stroke-dasharray="4 3"/>`+rlab(yD(v),pc(v),"zm-ax zm-axb");});
 g+=`<polyline points="${dv}" fill="none" stroke="#141714" stroke-width="1.3" stroke-linejoin="round"/><text x="${PL+6}" y="${top[2]+15}" class="zm-pt">${small?`Frente al coste STH · color: ±${st.th} %`:`Desviación del precio frente al coste STH · color: más allá de ±${st.th} %`}</text>`;
 box.innerHTML=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${B.CFG[st.t].name}: precio con movimientos, ${INDS[st.ind]} y desviación frente al coste STH">${axis.join("")}${g}<line class="zm-hx" y1="${top[0]}" y2="${top[2]+hh[2]}"/><rect x="${PL}" y="${top[0]}" width="${iw}" height="${top[2]+hh[2]-top[0]}" fill="transparent"/></svg><div class="zm-tip"></div>`;
 const svg=box.querySelector("svg"),tip=box.querySelector(".zm-tip"),hx=box.querySelector(".zm-hx");
 svg.onpointermove=e=>{const r=svg.getBoundingClientRect(),i=Math.max(i0,Math.min(i1,Math.round(i0+(e.clientX-r.left-PL)/iw*N))),px=x(i);
  hx.setAttribute("x1",px);hx.setAttribute("x2",px);hx.style.opacity=1;
  const leg=Lg.find(l=>i>=l.a&&i<=l.b);
  const row=ind=>{const v=series(s,ind)[i],k=zoneOf(st.t,ind,v);return `<span>${INDS[ind]}: <b>${fmtInd(ind,v)}</b>${k?" · "+k.toLowerCase():""}</span>`;};
  tip.innerHTML=`<b>${fd(s.d[i])}</b><span>Precio ${usd(s.p[i])}</span>${row("sth")}${row("lth")}${row("z")}<span>Frente al coste STH: <b>${pc(s.p[i]/s.c[i]-1)}</b></span>${leg?`<span class="zm-ts">Tramo ${pc(leg.m)} en ${f0(leg.b-leg.a)} días${leg.open?" (en curso)":""}</span>`:""}`;
  tip.style.opacity=1;tip.style.left=(px>W*.55?px-tip.offsetWidth-12:px+12)+"px";};
 svg.onpointerleave=()=>{tip.style.opacity=0;hx.style.opacity=0;};
 $("#zm-leg").innerHTML=Z.map(z=>`<span><i style="background:${z.col}"></i>${z.lbl}</span>`).join("")+`<span><i style="background:#0d7a2f;height:3px"></i>Tramo al alza</span><span><i style="background:#c0392b;height:3px"></i>Tramo a la baja</span>`;}

/* ---------- matriz zona × tamaño del movimiento ---------- */
function matrix(){const t=st.t,s=S[t],{i0,i1}=range(s),All=episodes(t,st.ind,st.h),E={},Z=zones(t,st.ind);Object.keys(All).forEach(k=>E[k]=All[k].filter(e=>e.i>=i0&&e.i<=i1));const todayK=zoneOf(t,st.ind,series(s,st.ind)[s.n-1]);
 const tb=(up,rgb)=>`<div class="h-wrap zm-mw"><table class="h-t zm-m"><thead><tr><th>Zona</th><th class="zm-n">Episodios</th>${THS.map(v=>`<th class="zm-n${v===st.th?" zm-sel":""}">${up?"+":"−"}${v} %</th>`).join("")}<th class="zm-n">Mediana</th></tr></thead><tbody>${Z.map(z=>{const e=E[z.k]||[],few=e.length<MIN_N;
  return `<tr class="${z.k===todayK?"zm-now":""}"><td><span class="zm-chip"><i style="background:${z.col}"></i>${z.lbl}</span>${z.k===todayK?' <small class="zm-hoy">hoy</small>':""}</td><td class="h-num">${e.length}</td>${THS.map(v=>{const T=v/100,p=share(e,x=>up?x.up>=T:x.dn<=-T);if(p==null)return `<td class="h-num muted">—</td>`;const c=e.filter(x=>up?x.up>=T:x.dn<=-T).length;
   return `<td class="h-num${few?" muted":""}" style="${few?"":`background:rgba(${rgb},${(p*.55).toFixed(2)})`}" title="${c} de ${e.length} episodios">${Math.round(p*100)}</td>`;}).join("")}<td class="h-num">${e.length?pc(median(e.map(x=>up?x.up:x.dn))):"—"}</td></tr>`;}).join("")}</tbody></table></div>`;
 $("#zm-mx").innerHTML=`<h3 class="zm-h3">Mayor subida en los ${st.h} días siguientes</h3>${tb(true,"13,122,47")}<h3 class="zm-h3">Mayor caída en los ${st.h} días siguientes</h3>${tb(false,"192,57,43")}`;
 $("#zm-mx-sub").textContent=`${B.CFG[t].name} · ${INDS[st.ind]} · % de episodios que alcanzaron cada movimiento, medido desde el cierre del día en que se entró en la zona. Entradas entre ${fd(s.d[i0])} y ${fd(s.d[i1])}.`;}

/* ---------- dónde giró el precio y lista de tramos ---------- */
function turns(){const t=st.t,s=S[t],{i0,i1}=range(s),a=series(s,st.ind),Z=zones(t,st.ind),L=legs(s.p,st.th).filter(l=>!l.open);
 const count=(pick)=>{const c={},seen=new Set();Z.forEach(z=>c[z.k]=0);let tot=0;L.forEach(l=>{const i=pick(l);if(i<i0||i>i1||seen.has(i))return;seen.add(i);const k=zoneOf(t,st.ind,a[i]);if(k){c[k]++;tot++;}});return{c,tot};};
 const lows=count(l=>l.m>=0?l.a:l.b),highs=count(l=>l.m>=0?l.b:l.a);
 const col=(title,o)=>{const mx=Math.max(1,...Object.values(o.c));return `<div class="zm-tu"><p class="eyebrow">${title} <span class="muted">(${o.tot})</span></p>${Z.map(z=>`<div class="zm-tr"><span>${z.lbl}</span><div>${o.c[z.k]?`<i style="width:${o.c[z.k]/mx*100}%;background:${z.col}"></i>`:""}</div><b>${o.c[z.k]}</b></div>`).join("")}</div>`;};
 $("#zm-tu").innerHTML=col(`Suelos de movimientos ≥${st.th} %`,lows)+col(`Techos de movimientos ≥${st.th} %`,highs);
 const rows=legs(s.p,st.th).filter(l=>l.b>=i0&&l.a<=i1&&s.c[l.a]).reverse();
 const cell=(ind,i)=>{const v=series(s,ind)[i],k=zoneOf(t,ind,v),z=k&&zoneObj(t,ind,k);return `<td class="h-num">${z?`<span class="zm-d" style="background:${z.col}"></span>`:""}${fmtInd(ind,v)}</td>`;};
 $("#zm-legs").innerHTML=`<thead><tr><th colspan="4"></th><th class="h-grp" colspan="3">Lectura al empezar</th><th class="h-grp" colspan="3">Lectura al terminar</th></tr><tr><th>Inicio</th><th>Fin</th><th class="zm-n">Movimiento</th><th class="zm-n">Días</th>${["STH","LTH","z"].map(h=>`<th class="zm-n">${h}</th>`).join("")}${["STH","LTH","z"].map(h=>`<th class="zm-n">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(l=>`<tr><td>${fd(s.d[l.a])}</td><td>${fd(s.d[l.b])}${l.open?' <small>en curso</small>':""}</td><td class="h-num"><b class="${l.m>=0?"rp-pos":"rp-neg"}">${pc(l.m)}</b></td><td class="h-num">${f0(l.b-l.a)}</td>${["sth","lth","z"].map(k=>cell(k,l.a)).join("")}${["sth","lth","z"].map(k=>cell(k,l.b)).join("")}</tr>`).join("")||'<tr><td colspan="10" class="muted">Sin movimientos en este periodo.</td></tr>'}</tbody>`;}

/* ---------- controles ---------- */
function seg(id,items,key){$(id).innerHTML=items.map(([v,l])=>`<button data-v="${v}" class="${String(st[key])===String(v)?"on":""}">${l}</button>`).join("");
 $(id).querySelectorAll("button").forEach(b=>b.onclick=()=>{st[key]=typeof st[key]==="number"?+b.dataset.v:b.dataset.v;put(key,st[key]);if(key==="r"){st.from=st.to="";put("from","");put("to","");}render();});}
function render(){
 seg("#zm-t",[["BTC","BTC"],["ETH","ETH"]],"t");
 seg("#zm-ind",[["sth","STH"],["lth","LTH"],["z","z corto"]],"ind");
 seg("#zm-th",THS.map(v=>[v,v+" %"]),"th");
 seg("#zm-h",HS.map(v=>[v,v+" días"]),"h");
 seg("#zm-r",RANGES.map(r=>[r[0],r[1]]),"r");
 const s=S[st.t],{i0,i1,first}=range(s),f=$("#zm-from"),o=$("#zm-to");
 [f,o].forEach(e=>{e.min=s.d[first];e.max=s.d[s.n-1];});f.value=s.d[i0];o.value=s.d[i1];
 $("#zm-rng").textContent=`${fd(s.d[i0])} → ${fd(s.d[i1])} · ${f0(i1-i0+1)} días`;
 $("#zm-today").innerHTML=today();chart();matrix();turns();}
/* Al escribir el año, el navegador avisa con años parciales (0002, 0020…): se ignoran hasta que esté completo */
const partial=v=>v&&+v.slice(0,4)<2000;
const onDate=edited=>()=>{let a=$("#zm-from").value,b=$("#zm-to").value;if(partial(a)||partial(b))return;
 /* Si una fecha cruza a la otra, la otra se abre hasta el extremo de los datos */
 if(a&&b&&a>b){if(edited==="from")b="";else a="";}
 st.r="custom";st.from=a;st.to=b;put("r","custom");put("from",a);put("to",b);render();};
$("#zm-from").onchange=onDate("from");$("#zm-to").onchange=onDate("to");
[$("#zm-from"),$("#zm-to")].forEach(e=>e.onblur=()=>{if(partial(e.value))render();});
let rz;window.addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(()=>{if(!$("#view-zonas").hidden)chart();},150);});
window.Bambu2Zonas={render,legs,episodes,zones};
})();
