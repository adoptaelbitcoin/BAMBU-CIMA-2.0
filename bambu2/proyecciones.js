/* Bambú CIMA 2.0 · Proyecciones de BTC a partir de los dos últimos ciclos completos */
(function(){
"use strict";
const S=window.Bambu2S,$=q=>document.querySelector(q),s=S.BTC,{p,d,n}=s;
const COL={C1:"#1f4e9c",C2:"#ee9b4a"},HZ=[30,90,180,365];
const f0=v=>v==null?"—":Math.round(v).toLocaleString("es-ES",{useGrouping:"always"});
const usd=v=>v==null?"—":"$"+f0(v);
const pc=v=>v==null?"—":(v>=0?"+":"−")+Math.abs(Math.round(v*100))+" %";
const pcn=v=>v==null?"—":Math.round(v*100)+" %";
const fd=iso=>new Date(iso+"T00:00:00Z").toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"});
const addDays=(iso,k)=>{const t=new Date(iso+"T00:00:00Z");t.setUTCDate(t.getUTCDate()+k);return t.toISOString().slice(0,10);};
const ix=iso=>d.indexOf(iso);
const hiOf=(a,b)=>{let k=a;for(let i=a;i<=b;i++)if(p[i]>p[k])k=i;return k;};
const loOf=(a,b)=>{let k=a;for(let i=a;i<=b;i++)if(p[i]<p[k])k=i;return k;};
const quant=(r,x)=>{if(!r.length)return null;const b=[...r].sort((u,v)=>u-v),f=x*(b.length-1),l=Math.floor(f);return b[l]+(b[Math.min(l+1,b.length-1)]-b[l])*(f-l);};
const median=r=>quant(r,.5);

/* ---------- modelo ---------- */
function model(){
 const last=n-1,T=[hiOf(ix("2017-10-01"),ix("2018-03-01")),hiOf(ix("2021-03-01"),ix("2022-01-31")),hiOf(ix("2025-01-01"),last)];
 const L=[loOf(T[0],ix("2019-06-01")),loOf(T[1],ix("2023-06-01")),loOf(T[2],last)];
 const D=last-T[2],Dl=last-L[2],p0=p[last];
 const paths=[{id:"C1t",c:"C1",lab:"Ciclo 1, desde el techo",dash:"",a:T[0]+D},{id:"C2t",c:"C2",lab:"Ciclo 2, desde el techo",dash:"",a:T[1]+D},{id:"C1s",c:"C1",lab:"Ciclo 1, desde el suelo",dash:"6 4",a:L[0]+Dl},{id:"C2s",c:"C2",lab:"Ciclo 2, desde el suelo",dash:"6 4",a:L[1]+Dl}];
 paths.forEach(q=>{q.at=h=>q.a+h<n?p0*p[q.a+h]/p[q.a]:null;});
 /* techo reciente: el del último tramo de 20 % */
 const G=window.Bambu2Zonas.legs(p,20),gl=G[G.length-1],top=gl.m>=0?gl.b:gl.a,drop=1-p0/p[top];
 /* escalera: caídas de al menos la actual desde un techo, en los dos ciclos */
 const X=Math.max(.05,drop),Z=window.Bambu2Zonas.legs(p,X*100),dn=Z.filter(l=>l.m<0&&!l.open&&l.a>=T[0]&&l.a<T[2]).map(l=>({m:-l.m,c:l.a<T[1]?1:2}));
 const lad=[.15,.2,.25,.3,.35,.4,.45,.5,.6].map(t=>{const f=c=>{const a=dn.filter(x=>!c||x.c===c);return a.length?a.filter(x=>x.m>=t).length/a.length:null;};return{t,price:p[top]*(1-t),all:f(0),c1:f(1),c2:f(2),done:drop>=t};});
 /* tramos de 20 % por ciclo */
 const leg=(a,b,up)=>{const r=G.filter(l=>!l.open&&l.a>=a&&l.b<=b&&(l.m>=0)===up);return{n:r.length,m:median(r.map(l=>l.m)),dur:median(r.map(l=>l.b-l.a))};};
 const up=[leg(T[0],T[1],true),leg(T[1],T[2],true)],dw=[leg(T[0],T[1],false),leg(T[1],T[2],false)];
 /* termómetros parecidos y su prueba hacia atrás */
 const zS=v=>v<42?"F":v<58?"N":"C",zL=v=>v<40?"F":v<=60?"N":"C",key=i=>zS(s.short[i])+zL(s.cyc[i]),ent=[],seen={};
 for(let i=T[0];i<n;i++){if(s.short[i]==null||s.cyc[i]==null)continue;const k=key(i);if(seen[k]==null||i-seen[k]>30)ent.push({i,k});seen[k]=i;}
 const ana=HZ.map(h=>{const v=ent.filter(e=>e.k===key(last)&&e.i+h<n).map(e=>p[e.i+h]/p[e.i]-1);return{h,n:v.length,q1:quant(v,.25),m:median(v),q3:quant(v,.75),pos:v.length?v.filter(x=>x>0).length/v.length:null};});
 const bt=[90,180].map(h=>{let N=0,inA=0,inB=0,dirA=0,dirB=0;ent.filter(e=>e.i>=T[1]&&e.i+h<n).forEach(e=>{const pr=ent.filter(x=>x.k===e.k&&x.i+h<=e.i).map(x=>p[x.i+h]/p[x.i]-1);if(pr.length<3)return;const base=[];for(let j=T[0];j+h<=e.i;j++)base.push(p[j+h]/p[j]-1);const r=p[e.i+h]/p[e.i]-1;N++;if(r>=quant(pr,.25)&&r<=quant(pr,.75))inA++;if(r>=quant(base,.25)&&r<=quant(base,.75))inB++;if((median(pr)>0)===(r>0))dirA++;if((median(base)>0)===(r>0))dirB++;});return{h,N,inA:inA/N,inB:inB/N,dirA:dirA/N,dirB:dirB/N};});
 return{last,T,L,D,Dl,p0,paths,top,drop,X,dn,lad,up,dw,ana,bt,G};}

/* ---------- dónde estamos ---------- */
function where(M){const{T,L,D,Dl,last,p0,top,drop}=M;
 const tile=(k,v,t)=>`<div class="pj-t"><span class="eyebrow">${k}</span><b>${v}</b><small>${t}</small></div>`;
 $("#pj-tiles").innerHTML=tile("Días desde el techo",f0(D),`${usd(p[T[2]])} · ${fd(d[T[2]])}`)+tile("Desde el techo",pc(p0/p[T[2]]-1),"Ciclos anteriores: "+pc(p[L[0]]/p[T[0]]-1)+" y "+pc(p[L[1]]/p[T[1]]-1)+" en su suelo")+tile("Desde el suelo",pc(p0/p[L[2]]-1),`${usd(p[L[2]])} · ${fd(d[L[2]])}`)+tile("Desde el techo reciente",pc(-drop),`${usd(p[top])} · ${fd(d[top])}`);
 const row=(lab,f)=>`<tr><td>${lab}</td>${[0,1,2].map(k=>`<td class="h-num">${f(k)}</td>`).join("")}</tr>`;
 const nx=k=>k<2?T[k+1]:null;
 $("#pj-cy").innerHTML=`<thead><tr><th>Dato</th><th class="zm-n">Ciclo 1</th><th class="zm-n">Ciclo 2</th><th class="zm-n">Actual</th></tr></thead><tbody>`+
 row("Techo",k=>`${usd(p[T[k]])}<small>${fd(d[T[k]])}</small>`)+
 row("Suelo tras el techo",k=>`${usd(p[L[k]])}<small>${fd(d[L[k]])}${k===2?" · hasta hoy":""}</small>`)+
 row("Caída de techo a suelo",k=>pc(p[L[k]]/p[T[k]]-1))+
 row("Días de techo a suelo",k=>f0(L[k]-T[k]))+
 row("Suelo frente al coste LTH",k=>(p[L[k]]/s.cl[L[k]]).toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2})+" veces")+
 row(`Precio el día ${f0(D)} tras el techo`,k=>{const i=T[k]+D;return `${usd(p[i])}<small>${pc(p[i]/p[T[k]]-1)} desde el techo</small>`;})+
 row("Días de suelo a siguiente techo",k=>nx(k)?f0(nx(k)-L[k]):"—")+
 row("Del suelo al siguiente techo",k=>nx(k)?(p[nx(k)]/p[L[k]]).toLocaleString("es-ES",{maximumFractionDigits:1})+" veces":"—")+
 row("Del techo al siguiente techo",k=>nx(k)?(p[nx(k)]/p[T[k]]).toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2})+" veces":"—")+`</tbody>`;
 const lowDays=[L[0]-T[0],L[1]-T[1]],win=[addDays(d[T[2]],Math.min(...lowDays)),addDays(d[T[2]],Math.max(...lowDays))];
 const nextA=[T[1]-L[0],T[2]-L[1]].map(k=>addDays(d[L[2]],k)),nextB=[T[1]-T[0],T[2]-T[1]].map(k=>addDays(d[T[2]],k)),all=[...nextA,...nextB].sort();
 const passed=d[last]>win[1];
 $("#pj-cal").innerHTML=`<b>Calendario.</b> En los dos ciclos el suelo llegó ${lowDays[0]} y ${lowDays[1]} días después del techo. Aquí, esa ventana era del ${fd(win[0])} al ${fd(win[1])}${passed&&L[2]<ix(win[0])?", y pasó sin marcar un mínimo nuevo: el último sigue siendo el de "+fd(d[L[2]])+".":"."} Si el calendario se repite, el siguiente techo caería entre ${fd(all[0])} y ${fd(all[all.length-1])}. Son solo dos ciclos: sirve de referencia, no de fecha.`;}

/* ---------- gráfico 1: rutas proyectadas ---------- */
function chartPaths(M){const box=$("#pj-c1"),{T,L,last,p0,paths,top}=M,W=Math.max(260,box.clientWidth),small=W<640,H=small?360:460,PL=small?4:8,PR=small?62:128,PT=14,PB=26,iw=W-PL-PR,ih=H-PT-PB;
 const t0=T[2],span=last+365-t0,x=i=>PL+(i-t0)/span*iw;
 let lo=Infinity,hi=0;for(let i=t0;i<=last;i++){lo=Math.min(lo,p[i]);hi=Math.max(hi,p[i]);}
 paths.forEach(q=>{for(let h=0;h<=365;h++){const v=q.at(h);if(v){lo=Math.min(lo,v);hi=Math.max(hi,v);}}});
 lo=Math.min(lo,s.cl[last])*.9;hi*=1.08;const y=v=>PT+ih-(Math.log(v)-Math.log(lo))/(Math.log(hi)-Math.log(lo))*ih;
 let g="";
 for(let e=Math.floor(Math.log10(lo));e<=Math.ceil(Math.log10(hi));e++)for(const m of [1,2,5]){const v=m*10**e;if(v>lo&&v<hi)g+=`<line x1="${PL}" x2="${W-PR}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="zm-grid"/>`;}
 /* eje de tiempo por trimestres */
 const qs=[];let pk=null;for(let k=0;k<=span;k++){const iso=addDays(d[t0],k),m=+iso.slice(5,7),key=m%3===1?iso.slice(0,7):null;if(key&&key!==pk&&k>0)qs.push([k,iso]);if(key)pk=key;}
 qs.filter((_,j)=>!small||j%2===0).forEach(([k,iso])=>{const X=PL+k/span*iw;g+=`<line x1="${X.toFixed(1)}" x2="${X.toFixed(1)}" y1="${PT}" y2="${PT+ih}" class="zm-grid"/><text x="${(X+3).toFixed(1)}" y="${H-8}" class="zm-ax">${new Date(iso+"T00:00:00Z").toLocaleDateString("es-ES",{month:"short",year:"2-digit",timeZone:"UTC"})}</text>`;});
 /* niveles con etiqueta a la derecha, sin solaparse */
 const lv=[["Coste STH",s.c[last]],["Coste LTH",s.cl[last]],["Suelo",p[L[2]]],["Techo reciente",p[top]],["Techo ciclo",p[T[2]]]].map(([k,v])=>({k,v,yy:y(v)})).sort((a,b)=>a.yy-b.yy);
 for(let j=1;j<lv.length;j++)if(lv[j].yy-lv[j-1].yy<(small?24:14))lv[j].yy=lv[j-1].yy+(small?24:14);
 lv.forEach(o=>{g+=`<line x1="${PL}" x2="${W-PR}" y1="${y(o.v).toFixed(1)}" y2="${y(o.v).toFixed(1)}" stroke="#141714" stroke-opacity=".35" stroke-dasharray="2 3"/>`;
  g+=small?`<text x="${W-PR+4}" y="${(o.yy+1).toFixed(1)}" class="zm-ax">${o.k.split(" ").pop()}</text><text x="${W-PR+4}" y="${(o.yy+11).toFixed(1)}" class="zm-ax zm-axb">$${Math.round(o.v/1000)}k</text>`:`<text x="${W-PR+6}" y="${(o.yy+3.5).toFixed(1)}" class="zm-ax">${o.k} <tspan class="zm-axb">$${Math.round(o.v/1000)}k</tspan></text>`;});
 /* rutas */
 paths.forEach(q=>{let o="";for(let h=0;h<=365;h+=2){const v=q.at(h);if(v)o+=`${x(last+h).toFixed(1)},${y(v).toFixed(1)} `;}g+=`<polyline points="${o}" fill="none" stroke="${COL[q.c]}" stroke-width="2" stroke-dasharray="${q.dash}" stroke-linejoin="round"/>`;});
 let po="";for(let i=t0;i<=last;i++)po+=`${x(i).toFixed(1)},${y(p[i]).toFixed(1)} `;
 g+=`<polyline points="${po}" fill="none" stroke="#141714" stroke-width="2" stroke-linejoin="round"/><line x1="${x(last).toFixed(1)}" x2="${x(last).toFixed(1)}" y1="${PT}" y2="${PT+ih}" stroke="#141714" stroke-width="1"/><text x="${(x(last)-4).toFixed(1)}" y="${PT+12}" text-anchor="end" class="zm-pt">Hoy ${usd(p0)}</text><circle cx="${x(last).toFixed(1)}" cy="${y(p0).toFixed(1)}" r="4" fill="#141714" stroke="#fff" stroke-width="2"/>`;
 box.innerHTML=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Precio de Bitcoin desde el techo y cuatro rutas a 365 días según los dos ciclos anteriores">${g}<line class="zm-hx" y1="${PT}" y2="${PT+ih}"/><rect x="${PL}" y="${PT}" width="${iw}" height="${ih}" fill="transparent"/></svg><div class="zm-tip"></div>`;
 const svg=box.querySelector("svg"),tip=box.querySelector(".zm-tip"),hx=box.querySelector(".zm-hx");
 svg.onpointermove=e=>{const r=svg.getBoundingClientRect(),k=Math.max(0,Math.min(span,Math.round((e.clientX-r.left-PL)/iw*span))),i=t0+k,X=PL+k/span*iw;hx.setAttribute("x1",X);hx.setAttribute("x2",X);hx.style.opacity=1;
  const iso=addDays(d[t0],k);
  tip.innerHTML=i<=last?`<b>${fd(iso)}</b><span>Precio <b>${usd(p[i])}</b></span>`:`<b>${fd(iso)}</b><span class="muted">+${f0(i-last)} días</span>${paths.map(q=>`<span>${q.lab}: <b>${usd(q.at(i-last))}</b></span>`).join("")}`;
  tip.style.opacity=1;tip.style.left=(X>W*.55?X-tip.offsetWidth-12:X+12)+"px";};
 svg.onpointerleave=()=>{tip.style.opacity=0;hx.style.opacity=0;};}

/* ---------- gráfico 2: los ciclos superpuestos ---------- */
function chartMap(M){const box=$("#pj-c2"),{T,L,last,D}=M,W=Math.max(260,box.clientWidth),H=W<640?280:340,PL=8,PR=44,PT=14,PB=26,iw=W-PL-PR,ih=H-PT-PB;
 const CY=[{a:T[0],b:T[1],col:COL.C1,w:2,lab:"Ciclo 1"},{a:T[1],b:T[2],col:COL.C2,w:2,lab:"Ciclo 2"},{a:T[2],b:last,col:"#141714",w:2.5,lab:"Actual"}];
 const span=Math.max(T[1]-T[0],T[2]-T[1]),x=k=>PL+k/span*iw,lo=.12,hi=4,y=v=>PT+ih-(Math.log(Math.max(lo,Math.min(hi,v)))-Math.log(lo))/(Math.log(hi)-Math.log(lo))*ih;
 let g="";[.2,.5,1,2,3].forEach(v=>{g+=`<line x1="${PL}" x2="${W-PR}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="${v===1?"zm-zero":"zm-grid"}"/><text x="${W-PR+6}" y="${(y(v)+3.5).toFixed(1)}" class="zm-ax">${v===1?"Techo":String(v).replace(".",",")+"x"}</text>`;});
 for(let k=365;k<span;k+=365)g+=`<line x1="${x(k).toFixed(1)}" x2="${x(k).toFixed(1)}" y1="${PT}" y2="${PT+ih}" class="zm-grid"/><text x="${(x(k)+3).toFixed(1)}" y="${H-8}" class="zm-ax">año ${k/365}</text>`;
 CY.forEach(c=>{let o="";for(let i=c.a;i<=c.b;i+=c.a===T[2]?1:2)o+=`${x(i-c.a).toFixed(1)},${y(p[i]/p[c.a]).toFixed(1)} `;g+=`<polyline points="${o}" fill="none" stroke="${c.col}" stroke-width="${c.w}" stroke-linejoin="round"/>`;});
 [0,1].forEach(k=>{g+=`<circle cx="${x(L[k]-T[k]).toFixed(1)}" cy="${y(p[L[k]]/p[T[k]]).toFixed(1)}" r="4" fill="${COL["C"+(k+1)]}" stroke="#fff" stroke-width="1.5"/><text x="${(x(L[k]-T[k])+7).toFixed(1)}" y="${(y(p[L[k]]/p[T[k]])+(k?-6:12)).toFixed(1)}" class="zm-lb">${pc(p[L[k]]/p[T[k]]-1)}</text>`;});
 g+=`<circle cx="${x(D).toFixed(1)}" cy="${y(p[last]/p[T[2]]).toFixed(1)}" r="4.5" fill="#141714" stroke="#fff" stroke-width="2"/><text x="${(x(D)+7).toFixed(1)}" y="${(y(p[last]/p[T[2]])-7).toFixed(1)}" class="zm-lb">Hoy ${pc(p[last]/p[T[2]]-1)}</text>`;
 box.innerHTML=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Precio frente al techo de cada ciclo, por días desde el techo">${g}<line class="zm-hx" y1="${PT}" y2="${PT+ih}"/><rect x="${PL}" y="${PT}" width="${iw}" height="${ih}" fill="transparent"/></svg><div class="zm-tip"></div>`;
 const svg=box.querySelector("svg"),tip=box.querySelector(".zm-tip"),hx=box.querySelector(".zm-hx");
 svg.onpointermove=e=>{const r=svg.getBoundingClientRect(),k=Math.max(0,Math.min(span,Math.round((e.clientX-r.left-PL)/iw*span))),X=x(k);hx.setAttribute("x1",X);hx.setAttribute("x2",X);hx.style.opacity=1;
  tip.innerHTML=`<b>Día ${f0(k)} tras el techo</b>`+CY.map(c=>{const i=c.a+k;return i<=c.b?`<span>${c.lab}: <b>${pc(p[i]/p[c.a]-1)}</b> <span class="muted">${fd(d[i])}</span></span>`:"";}).join("");
  tip.style.opacity=1;tip.style.left=(X>W*.55?X-tip.offsetWidth-12:X+12)+"px";};
 svg.onpointerleave=()=>{tip.style.opacity=0;hx.style.opacity=0;};}

/* ---------- escenarios y tablas ---------- */
function scen(M){const{T,L,last,p0,paths,top,lad,up,dw}=M,at=(id,h)=>paths.find(q=>q.id===id).at(h);
 const y1=paths.map(q=>q.at(365)).filter(Boolean),t20=p[top]*.8,reb=up.map(u=>t20*(1+u.m)),ratio=[0,1].map(k=>p[L[k]]/s.cl[L[k]]*s.cl[last]),g=t=>lad.find(l=>l.t===t);
 const card=(cls,tag,title,rows)=>`<article class="pj-s ${cls}"><span class="pj-tag">${tag}</span><h3>${title}</h3><dl>${rows.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl></article>`;
 $("#pj-sc").innerHTML=
 card("up","Alcista",`El suelo de ${new Date(d[L[2]]+"T00:00:00Z").toLocaleDateString("es-ES",{month:"long",timeZone:"UTC"})} fue el del ciclo`,[["Lo confirmaría",`Cierre por encima del techo reciente, ${usd(p[top])}.`],["Qué dicen los ciclos",`Las cuatro rutas dan entre ${usd(Math.min(...y1))} y ${usd(Math.max(...y1))} a un año.`],["Ojo",`Vienen de suelos mucho más profundos (${pc(p[L[0]]/p[T[0]]-1)} y ${pc(p[L[1]]/p[T[1]]-1)}). La parte alta probablemente exagera.`]])+
 card("mid","Central","Corrección y nuevo tramo al alza",[["Lo confirmaría",`Giro al alza entre ${usd(g(.25).price)} y ${usd(g(.15).price)}, sin perder el suelo de ${usd(p[L[2]])}.`],["Qué dicen los movimientos",`Tras caer como ahora, se llegó a −15 % en el ${pcn(g(.15).all)} de los casos, a −20 % en el ${pcn(g(.2).all)} y a −25 % en el ${pcn(g(.25).all)}.`],["Rebote de referencia",`Desde ${usd(t20)}, la subida típica (${pc(up[0].m)} y ${pc(up[1].m)}) lleva a ${usd(Math.min(...reb))}–${usd(Math.max(...reb))} en ${f0(Math.min(up[0].dur,up[1].dur))}–${f0(Math.max(up[0].dur,up[1].dur))} días.`]])+
 card("dn","Bajista","El suelo del ciclo aún no está",[["Lo confirmaría",`Cierre por debajo de ${usd(p[L[2]])}, a ${pc(p[L[2]]/p0-1)} de hoy.`],["Niveles",`Coste LTH en ${usd(s.cl[last])} (${pc(s.cl[last]/p0-1)}). Los dos suelos anteriores quedaron a ${(p[L[0]]/s.cl[L[0]]).toLocaleString("es-ES",{maximumFractionDigits:2})} y ${(p[L[1]]/s.cl[L[1]]).toLocaleString("es-ES",{maximumFractionDigits:2})} veces ese coste: hoy, ${usd(Math.min(...ratio))}–${usd(Math.max(...ratio))}.`],["Ojo",`${L[2]<ix(addDays(d[T[2]],Math.max(L[0]-T[0],L[1]-T[1])))&&last>=ix(addDays(d[T[2]],Math.max(L[0]-T[0],L[1]-T[1])))?"La ventana de calendario ya pasó sin un mínimo nuevo, lo que resta apoyo a este caso. Aun así, es":"Es"} el de mayor daño, y dos ciclos no bastan para descartarlo.`]]);
 $("#pj-pt").innerHTML=`<thead><tr><th>Ruta</th><th>Se compara con</th>${HZ.map(h=>`<th class="zm-n">${h} días</th>`).join("")}<th class="zm-n">Peor caída en 365 días</th></tr></thead><tbody>${paths.map(q=>{let w=0;for(let h=1;h<=365;h++){const v=q.at(h);if(v&&v/p0-1<w)w=v/p0-1;}return `<tr><td><span class="zm-chip"><i style="background:${COL[q.c]}"></i>${q.lab}</span></td><td>${fd(d[q.a])}</td>${HZ.map(h=>{const v=q.at(h);return `<td class="h-num">${usd(v)}<small>${v?pc(v/p0-1):""}</small></td>`;}).join("")}<td class="h-num">${pc(w)}</td></tr>`;}).join("")}</tbody>`;
 $("#pj-lad").innerHTML=`<thead><tr><th>Caída desde el techo reciente</th><th class="zm-n">Precio</th><th class="zm-n">Frente a hoy</th><th class="zm-n">Ambos ciclos</th><th class="zm-n">Ciclo 1</th><th class="zm-n">Ciclo 2</th></tr></thead><tbody>${lad.map(l=>`<tr class="${l.done?"pj-done":""}"><td>−${Math.round(l.t*100)} %${l.done?" <small>ya alcanzada</small>":""}</td><td class="h-num">${usd(l.price)}</td><td class="h-num">${pc(l.price/p0-1)}</td><td class="h-num" style="background:rgba(192,57,43,${((l.all||0)*.5).toFixed(2)})">${pcn(l.all)}</td><td class="h-num">${pcn(l.c1)}</td><td class="h-num">${pcn(l.c2)}</td></tr>`).join("")}</tbody>`;
 const nC=c=>M.dn.filter(x=>x.c===c).length;
 $("#pj-lad-sub").textContent=`Desde ${usd(p[top])} (${fd(d[top])}). Porcentaje de caídas de al menos ${Math.round(M.X*100)} % en los dos ciclos que llegaron a cada nivel: ${M.dn.length} casos (${nC(1)} y ${nC(2)}).`;
 $("#pj-legs").innerHTML=`<thead><tr><th>Tramos de 20 % o más</th><th class="zm-n">Subidas</th><th class="zm-n">Mediana</th><th class="zm-n">Días</th><th class="zm-n">Bajadas</th><th class="zm-n">Mediana</th><th class="zm-n">Días</th></tr></thead><tbody>${[0,1].map(k=>`<tr><td>Ciclo ${k+1}</td><td class="h-num">${up[k].n}</td><td class="h-num">${pc(up[k].m)}</td><td class="h-num">${f0(up[k].dur)}</td><td class="h-num">${dw[k].n}</td><td class="h-num">${pc(dw[k].m)}</td><td class="h-num">${f0(dw[k].dur)}</td></tr>`).join("")}</tbody>`;
 $("#pj-bt").innerHTML=`<thead><tr><th>Plazo</th><th class="zm-n">Casos</th><th class="zm-n">Dentro de la banda: termómetros</th><th class="zm-n">Dentro de la banda: sin termómetros</th><th class="zm-n">Acierta dirección: termómetros</th><th class="zm-n">Acierta dirección: sin termómetros</th></tr></thead><tbody>${M.bt.map(b=>`<tr><td>${b.h} días</td><td class="h-num">${b.N}</td><td class="h-num">${pcn(b.inA)}</td><td class="h-num">${pcn(b.inB)}</td><td class="h-num">${pcn(b.dirA)}</td><td class="h-num">${pcn(b.dirB)}</td></tr>`).join("")}</tbody>`;
 const a=M.ana;$("#pj-ana").textContent=`Con termómetros parecidos a los de hoy, en ${a[1].n} episodios el precio se movió ${pc(a[1].m)} de mediana a 90 días y ${pc(a[2].m)} a 180 días. No lo usamos para proyectar:`;}

let MM;function render(){MM=MM||model();where(MM);chartPaths(MM);chartMap(MM);scen(MM);
 $("#pj-leg").innerHTML=`<span><i style="background:${COL.C1}"></i>Ciclo 1 (techo ${d[MM.T[0]].slice(0,4)})</span><span><i style="background:${COL.C2}"></i>Ciclo 2 (techo ${d[MM.T[1]].slice(0,4)})</span><span><i style="background:#555"></i>Continua: mismos días desde el techo</span><span><i style="background:repeating-linear-gradient(90deg,#555 0 5px,transparent 5px 8px)"></i>Discontinua: mismos días desde el suelo</span>`;
 $("#pj-leg2").innerHTML=`<span><i style="background:${COL.C1}"></i>Ciclo 1</span><span><i style="background:${COL.C2}"></i>Ciclo 2</span><span><i style="background:#141714"></i>Actual</span>`;}
let rz;window.addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(()=>{if(!$("#view-proy").hidden&&MM){chartPaths(MM);chartMap(MM);}},150);});
window.Bambu2Proy={render,model};
})();
