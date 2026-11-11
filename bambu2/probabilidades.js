/* Bambú CIMA 2.0 · Probabilidades de BTC y ETH a 7–90 días según los movimientos desde 2018 */
(function(){
"use strict";
const S=window.Bambu2S,B=window.Bambu2,$=q=>document.querySelector(q);
const HZ=[7,15,30,45,60,90],MAXH=90,FROM="2018-01-01",WIN=60;
const DEF={BTC:[80000,69000,67000],ETH:[2300,1850,1750]};
const get=(k,d)=>{try{const v=localStorage.getItem("b2_pb_"+k);return v==null?d:v;}catch(e){return d;}};
const put=(k,v)=>{try{localStorage.setItem("b2_pb_"+k,v);}catch(e){}};
const st={lens:get("lens","base"),lv:{BTC:JSON.parse(get("lvBTC",JSON.stringify(DEF.BTC))),ETH:JSON.parse(get("lvETH",JSON.stringify(DEF.ETH)))}};
const f0=v=>v==null?"—":Math.round(v).toLocaleString("es-ES",{useGrouping:"always"});
const usd=v=>v==null||!isFinite(v)?"—":"$"+f0(v);
const pcs=v=>(v>=0?"+":"−")+Math.abs(Math.round(v*100))+" %";
const pct=v=>v==null?"—":Math.round(v*100)+" %";
const fd=iso=>new Date(iso+"T00:00:00Z").toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"});
const quant=(b,x)=>{const f=x*(b.length-1),l=Math.floor(f);return b[l]+(b[Math.min(l+1,b.length-1)]-b[l])*(f-l);};

/* ---------- fase del ciclo de BTC: días desde el techo de cada ciclo ---------- */
function phase(){const s=S.BTC,d=s.d,p=s.p,ix=x=>d.indexOf(x),hi=(a,b)=>{let k=a;for(let i=a;i<=b;i++)if(p[i]>p[k])k=i;return k;};
 const T=[hi(ix("2017-10-01"),ix("2018-03-01")),hi(ix("2021-03-01"),ix("2022-01-31")),hi(ix("2025-01-01"),s.n-1)],D=s.n-1-T[2];
 const win=[0,1].map(k=>[d[Math.max(0,T[k]+D-WIN)],d[Math.min(s.n-1,T[k]+D+WIN)]]);
 return{D,T,win,inside:iso=>win.some(([a,b])=>iso>=a&&iso<=b)};}

/* ---------- distribución de movimientos desde cada día de la muestra ---------- */
const memo={};
function dist(t,lens){const key=t+lens;if(memo[key])return memo[key];
 const s=S[t],p=s.p,d=s.d,n=s.n,ph=phase(),R=[],MN={},MX={};
 for(let h=1;h<=MAXH;h++)R[h]=[];HZ.forEach(h=>{MN[h]=[];MX[h]=[];});
 let N=0;
 for(let i=0;i+MAXH<n;i++){if(d[i]<FROM||!p[i])continue;if(lens==="fase"&&!ph.inside(d[i]))continue;N++;
  let mn=1,mx=1;for(let h=1;h<=MAXH;h++){const r=p[i+h]/p[i];if(r<mn)mn=r;if(r>mx)mx=r;R[h].push(r);if(MN[h]){MN[h].push(mn);MX[h].push(mx);}}}
 for(let h=1;h<=MAXH;h++)R[h].sort((a,b)=>a-b);
 return memo[key]={R,MN,MX,N,ph};}
const touch=(D,h,rel)=>{const a=rel<1?D.MN[h]:D.MX[h];return a.filter(m=>rel<1?m<=rel:m>=rel).length/a.length;};

/* ---------- tabla de rangos ---------- */
function table(t,D,now){const row=h=>{const r=D.R[h],q=x=>now*quant(r,x),sh=f=>r.filter(f).length/r.length;
  return `<tr><td><b>${h} días</b></td><td class="h-num pb-main">${usd(q(.25))} – ${usd(q(.75))}</td><td class="h-num">${usd(q(.5))}<small>${pcs(quant(r,.5)-1)}</small></td><td class="h-num">${usd(q(.1))} – ${usd(q(.9))}</td><td class="h-num">${pct(sh(x=>x>1))}</td><td class="h-num">${pct(sh(x=>x>=1.1))}</td><td class="h-num">${pct(sh(x=>x<=.9))}</td></tr>`;};
 return `<div class="h-wrap"><table class="h-t pb-t"><thead><tr><th>Plazo</th><th class="zm-n">Rango probable (50 %)</th><th class="zm-n">Mediana</th><th class="zm-n">Rango amplio (80 %)</th><th class="zm-n">Sube</th><th class="zm-n">Sube ≥10 %</th><th class="zm-n">Cae ≥10 %</th></tr></thead><tbody>${HZ.map(row).join("")}</tbody></table></div>`;}

/* ---------- tabla de niveles: probabilidad de tocarlos ---------- */
function levels(t,D,now){const s=S[t],i=s.n-1;
 const L=[...st.lv[t].map((v,k)=>({k:"lv"+k,v,edit:true})),{k:"Coste STH",v:s.c[i]},{k:"Coste LTH",v:s.cl[i]}].filter(o=>o.v>0).sort((a,b)=>b.v-a.v);
 const cell=(h,v)=>{const p=touch(D,h,v/now),up=v>=now;return `<td class="h-num" style="background:rgba(${up?"13,122,47":"192,57,43"},${(p*.45).toFixed(2)})">${pct(p)}</td>`;};
 return `<div class="h-wrap"><table class="h-t pb-t"><thead><tr><th>Nivel</th><th class="zm-n">Distancia</th>${HZ.map(h=>`<th class="zm-n">${h} d</th>`).join("")}</tr></thead><tbody>${L.map(o=>`<tr><td>${o.edit?`<input class="pb-in" type="number" min="0" step="any" inputmode="decimal" value="${o.v}" data-t="${t}" data-k="${o.k.slice(2)}" aria-label="Nivel de precio">`:`<b>${o.k}</b> <small class="muted">${usd(o.v)}</small>`}</td><td class="h-num">${pcs(o.v/now-1)}</td>${HZ.map(h=>cell(h,o.v)).join("")}</tr>`).join("")}</tbody></table></div>`;}

/* ---------- abanico: rangos por plazo ---------- */
function fan(t,D,now,box){const W=Math.max(260,box.clientWidth),small=W<640,H=small?250:290,PL=6,PR=small?58:74,PT=12,PB=24,iw=W-PL-PR,ih=H-PT-PB;
 const x=h=>PL+h/MAXH*iw,lvs=st.lv[t].filter(v=>v>0);
 let lo=now*quant(D.R[MAXH],.1),hi=now*quant(D.R[MAXH],.9);lvs.forEach(v=>{lo=Math.min(lo,v);hi=Math.max(hi,v);});lo*=.95;hi*=1.04;
 const y=v=>PT+ih-(Math.log(v)-Math.log(lo))/(Math.log(hi)-Math.log(lo))*ih;
 const band=(a,b,op)=>{const up=[],dn=[];for(let h=0;h<=MAXH;h++){const r=h?D.R[h]:[1];up.push(`${x(h).toFixed(1)},${y(now*(h?quant(r,b):1)).toFixed(1)}`);dn.unshift(`${x(h).toFixed(1)},${y(now*(h?quant(r,a):1)).toFixed(1)}`);}return `<polygon points="${up.join(" ")} ${dn.join(" ")}" fill="#3d6fbf" fill-opacity="${op}"/>`;};
 let g="";HZ.filter(h=>!small||h>=30).forEach(h=>{g+=`<line x1="${x(h).toFixed(1)}" x2="${x(h).toFixed(1)}" y1="${PT}" y2="${PT+ih}" class="zm-grid"/><text x="${x(h).toFixed(1)}" y="${H-7}" text-anchor="middle" class="zm-ax">${h} d</text>`;});
 g+=band(.1,.9,.16)+band(.25,.75,.3);
 let m="";for(let h=0;h<=MAXH;h++)m+=`${x(h).toFixed(1)},${y(now*(h?quant(D.R[h],.5):1)).toFixed(1)} `;g+=`<polyline points="${m}" fill="none" stroke="#141714" stroke-width="2"/>`;
 const lab=[...lvs.map(v=>({v,t:usd(v)})),{v:now,t:"Hoy "+usd(now),b:1}].map(o=>({...o,yy:y(o.v)})).sort((a,b)=>a.yy-b.yy);for(let j=1;j<lab.length;j++)if(lab[j].yy-lab[j-1].yy<13)lab[j].yy=lab[j-1].yy+13;
 lab.forEach(o=>{g+=`<line x1="${PL}" x2="${W-PR}" y1="${y(o.v).toFixed(1)}" y2="${y(o.v).toFixed(1)}" stroke="#141714" stroke-opacity="${o.b?.6:.4}" stroke-dasharray="${o.b?"":"3 3"}"/><text x="${W-PR+5}" y="${(o.yy+3.5).toFixed(1)}" class="zm-ax${o.b?" zm-axb":""}">${small&&o.b?usd(o.v):o.t}</text>`;});
 box.innerHTML=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Rangos de precio de ${t} a 90 días">${g}<line class="zm-hx" y1="${PT}" y2="${PT+ih}"/><rect x="${PL}" y="${PT}" width="${iw}" height="${ih}" fill="transparent"/></svg><div class="zm-tip"></div>`;
 const svg=box.querySelector("svg"),tip=box.querySelector(".zm-tip"),hx=box.querySelector(".zm-hx");
 svg.onpointermove=e=>{const r=svg.getBoundingClientRect(),h=Math.max(1,Math.min(MAXH,Math.round((e.clientX-r.left-PL)/iw*MAXH))),X=x(h);hx.setAttribute("x1",X);hx.setAttribute("x2",X);hx.style.opacity=1;const q=v=>usd(now*quant(D.R[h],v));
  tip.innerHTML=`<b>A ${h} días</b><span>Mediana <b>${q(.5)}</b></span><span>Rango probable ${q(.25)} – ${q(.75)}</span><span>Rango amplio ${q(.1)} – ${q(.9)}</span>`;tip.style.opacity=1;tip.style.left=(X>W*.55?X-tip.offsetWidth-12:X+12)+"px";};
 svg.onpointerleave=()=>{tip.style.opacity=0;hx.style.opacity=0;};}

/* ---------- pintar ---------- */
function coin(t){const s=S[t],i=s.n-1,now=s.p[i],D=dist(t,st.lens),r30=D.R[30];
 const el=$("#pb-"+t);
 el.innerHTML=`<div class="chart-head"><div><h2>${B.CFG[t].name} <span class="muted pb-px">${usd(now)} · cierre del ${fd(s.d[i])}</span></h2><p class="sub">A 30 días, la mitad de los casos quedó entre <b>${usd(now*quant(r30,.25))}</b> y <b>${usd(now*quant(r30,.75))}</b>. Muestra: ${f0(D.N)} días de partida.</p></div></div>
 <div class="zm-chart pb-fan"></div><div class="legend zm-leg"><span><i class="sw" style="background:rgba(61,111,191,.46)"></i>Rango probable (50 % de los casos)</span><span><i class="sw" style="background:rgba(61,111,191,.16)"></i>Rango amplio (80 %)</span><span><i style="background:#141714"></i>Mediana</span><span><i style="background:repeating-linear-gradient(90deg,#141714 0 3px,transparent 3px 6px)"></i>Tus niveles</span></div>
 <h3 class="zm-h3">Rangos de precio por plazo</h3>${table(t,D,now)}
 <h3 class="zm-h3">Probabilidad de tocar cada nivel</h3><p class="muted sm pb-hint">Puedes cambiar los tres primeros niveles. Cuenta como tocado si algún cierre diario llega al nivel dentro del plazo.</p>${levels(t,D,now)}`;
 fan(t,D,now,el.querySelector(".pb-fan"));
 el.querySelectorAll(".pb-in").forEach(inp=>inp.onchange=()=>{const v=parseFloat(inp.value);if(!(v>0))return;st.lv[t][+inp.dataset.k]=v;put("lv"+t,JSON.stringify(st.lv[t]));coin(t);});}
function render(){const ph=phase();
 $("#pb-lens").innerHTML=[["base","Todos los días desde 2018"],["fase","Misma fase del ciclo"]].map(([v,l])=>`<button data-v="${v}" class="${st.lens===v?"on":""}">${l}</button>`).join("");
 $("#pb-lens").querySelectorAll("button").forEach(b=>b.onclick=()=>{st.lens=b.dataset.v;put("lens",st.lens);render();});
 $("#pb-lens-txt").innerHTML=st.lens==="base"?`Cada día desde el 1 de enero de 2018 es un punto de partida: se mide cuánto se movió el precio en los días siguientes. Incluye los dos últimos ciclos de BTC completos, con sus subidas y bajadas.`:
  `Solo los días en la misma fase del ciclo de BTC que hoy, ${f0(ph.D)} días después del techo (±${WIN} días): del ${fd(ph.win[0][0])} al ${fd(ph.win[0][1])} y del ${fd(ph.win[1][0])} al ${fd(ph.win[1][1])}. <b>Son solo dos episodios</b>, ambos justo después del suelo de un mercado bajista; por eso salen tan alcistas.`;
 coin("BTC");coin("ETH");}
let rz;window.addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(()=>{if(!$("#view-prob").hidden)render();},150);});
window.Bambu2Prob={render,dist,touch,quant};
})();
