import * as pdfjs from './vendor/pdf.min.mjs';
pdfjs.GlobalWorkerOptions.workerSrc='./vendor/pdf.worker.min.mjs';
const $=s=>document.querySelector(s),{slides,assets}=window.POSTER;
let index=Math.min(slides.length-1,Math.max(0,(Number(location.hash.slice(1))||1)-1));
let returnFocus=null,activeKey=null,pdfPage=null,pdfDoc=null,sharedDocument=null,renderJob=null,renderTimer=null,epoch=0;
let scale=1,fitScale=1,tx=0,ty=0,pointMode=false,drag=null,pinch=null,lastTap=0,gestureMoved=false;
const pointers=new Map();
const tissue='<span><i class="swatch nt"></i>NT · neural tube</span><span><i class="swatch sm"></i>SM · somite</span><span><i class="swatch tb"></i>TB · tailbud</span><span class="aside">Projection | 3D mask · Arrowheads: GFP+ donor cells</span>';
const hostLegend='<span>Projection: <i class="swatch tb"></i>TBXT &nbsp; <i class="swatch sox"></i>SOX2 &nbsp; <i class="swatch sm"></i>MEOX1</span><span>3D mask: <i class="swatch co"></i>TBXT+SOX2+ &nbsp; <i class="swatch other"></i>Other nuclei</span><span class="aside">100 µm bars</span>';
function fig(key,caption=false){const a=assets[key];return `<button class="fig" data-figure="${key}" aria-label="Explore ${a.label}">${caption?`<figcaption>${a.label}</figcaption>`:''}<img src="${a.preview}" alt="${a.label}" draggable="false"></button>`;}
function toast(t){$('#toast').textContent=t;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,5000);}
function draw(){
 const s=slides[index];document.querySelectorAll('video').forEach(v=>v.pause());
 $('#section').textContent=s.section;$('#position').textContent=`${String(index+1).padStart(2,'0')} / ${slides.length}`;$('#prev').disabled=index===0;$('#next').disabled=index===slides.length-1;
 $('#hint').textContent=s.kind==='video'?'Video supplied at 2X · play at default rate':'Tap any figure to explore';
 let body='',cls=s.kind;
 if(s.kind==='title'){cls='title-layout';body=`<div><div class="paper-title">Human Trunk-like Structures Enable Functional Assessment of Human NMP Fate Potential and Bias</div><p class="authors">Keyu Shen¹*, Peter Baillie-Benson¹*, Komal Makwana¹,<br>Louise Tilley² & Naomi Moris¹</p><div class="affiliation">¹ The Francis Crick Institute &nbsp; ² The Babraham Institute<br>* These authors contributed equally to this work.</div></div>${fig('schematic')}`;}
 else if(s.kind==='intro'){cls='intro-layout';body=`<div class="prose"><p>Neuromesodermal progenitors (NMPs) contribute to neural tube and paraxial mesoderm during posterior axis elongation. NMP-like cells are commonly identified by TBXT/SOX2 co-expression.</p><p>hTLS recapitulate neural tube–somite co-development and contain a posterior tailbud-like region. Human systems for functional studies of NMPs remain limited.</p><div class="questions"><p>How do initial NMP states relate to subsequent tissue contribution?</p><p>Can one human NMP-like cell contribute to neural and somitic tissues while retaining posterior descendants?</p></div></div>${fig('schematic')}`;}
 else if(s.kind==='video'){cls='video-layout';body=`<div class="video-wrap"><video controls playsinline preload="metadata" poster="assets/video-poster.jpg" aria-label="Microinjection video at 2X"><source src="assets/injection-2X.mp4" type="video/mp4"></video></div><div class="video-notes"><h2>From donor cell<br>to recipient hTLS</h2><p>A live view of the microinjection procedure.</p><p>2X playback<br><span class="small">14.6 s · original sequence</span></p><p class="small">Pause or scrub to discuss the injection. The 2X label remains visible in full screen.</p></div>`;}
 else if(s.kind==='recovery'||s.kind==='singlecounts'){body=`<div class="recovery-side">${fig(s.assets[0])}${fig(s.assets[1])}</div>${fig(s.assets[2])}`;}
 else if(s.kind==='workflow'){cls='workflow-layout';body=`${fig('workflow')}<p class="takeaway">H2B-GFP+ donor cells → 72 h hTLS recipient → culture to 120 h → IF, confocal imaging and 3D analysis.</p>`;}
 else if(s.kind==='protocol'){cls='protocol-layout';body=`${fig('protocols')}<p class="takeaway">D4: hNMP-like donor cells.<br>D6: RA- or CHIR-biased donor conditions.<br>Compare initial donor state with subsequent tissue contribution.</p>`;}
 else if(s.kind==='conclusions'){cls='conclusions';body=`<div class="conclusion-lines"><p>hTLS enable population- and single-cell analysis of human NMP behaviour.</p><p>Donor state is associated with tissue contribution and spatial distribution.</p><p>Single-cell grafts provide evidence of neural and somitic contribution from individual human NMP-like cells.</p><p>Next: optimize differentiation protocol and increase throughput.</p></div>${fig('references')}`;}
 else{body=s.assets.map(k=>fig(k,s.kind.startsWith('gallery'))).join('');}
 $('#slide').innerHTML=(s.kind==='title'?'':`<h1>${s.title}</h1>`)+`<div class="content ${cls}">${body}</div>`+(s.note?`<p class="note">${s.note}</p>`:'')+(s.legend?`<div class="legend">${s.legend==='host'?hostLegend:tissue}</div>`:'');
 $('#slide').querySelectorAll('[data-figure]').forEach(b=>b.onclick=()=>openFigure(b.dataset.figure,b));
 $('#slide').querySelector('video')?.addEventListener('error',()=>toast('Movie could not load. Use the downloaded MP4 backup.'));
 history.replaceState(null,'','#'+(index+1));
 const next=slides[index+1];if(next)next.assets.forEach(k=>{const im=new Image();im.src=assets[k].preview;});
}
function move(delta){index=Math.max(0,Math.min(slides.length-1,index+delta));draw();}
$('#prev').onclick=()=>move(-1);$('#next').onclick=()=>move(1);
$('#contents').onclick=()=>{let group='';$('#menu-list').innerHTML=slides.map((s,i)=>{let head=s.section!==group?`<div class="group">${s.section}</div>`:'';group=s.section;return head+`<button class="${i===index?'current':''}" data-index="${i}">${String(i+1).padStart(2,'0')} &nbsp; ${s.title}</button>`;}).join('');$('#menu-list').querySelectorAll('button').forEach(b=>b.onclick=()=>{index=Number(b.dataset.index);draw();$('#menu').close();});$('#menu').showModal();};
$('#help').onclick=()=>$('#instructions').showModal();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$('#'+b.dataset.close).close());
window.addEventListener('hashchange',()=>{index=Math.min(slides.length-1,Math.max(0,(Number(location.hash.slice(1))||1)-1));draw();});
function local(e){const r=$('#viewport').getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
function updatePreview(){const a=assets[activeKey];$('#preview').style.width=a.width+'px';$('#preview').style.height=a.height+'px';$('#preview').style.transform=`translate(${tx}px,${ty}px) scale(${scale})`;$('#detail').style.visibility='hidden';}
function fit(){if(!activeKey)return;const r=$('#viewport').getBoundingClientRect(),a=assets[activeKey];fitScale=Math.min((r.width-24)/a.width,(r.height-24)/a.height);scale=fitScale;tx=(r.width-a.width*scale)/2;ty=(r.height-a.height*scale)/2;updatePreview();queueRender();}
function zoom(factor,x,y){const r=$('#viewport').getBoundingClientRect();x??=r.width/2;y??=r.height/2;const next=Math.max(fitScale,Math.min(fitScale*16,scale*factor));tx=x-(x-tx)*next/scale;ty=y-(y-ty)*next/scale;scale=next;updatePreview();queueRender();}
function queueRender(){clearTimeout(renderTimer);renderTimer=setTimeout(renderDetail,100);}
async function renderDetail(){
 if(!pdfPage||!activeKey)return;const token=epoch;
 if(renderJob){renderJob.cancel();try{await renderJob.promise;}catch{}}
 if(token!==epoch||!pdfPage)return;
 const r=$('#viewport').getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),canvas=document.createElement('canvas');
 canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);
 try{const job=pdfPage.render({canvasContext:canvas.getContext('2d'),viewport:pdfPage.getViewport({scale:scale*dpr}),transform:[1,0,0,1,tx*dpr,ty*dpr],background:'rgb(255,255,255)'});renderJob=job;await job.promise;
  if(token!==epoch||pointers.size)return;const target=$('#detail');target.width=canvas.width;target.height=canvas.height;target.style.width=r.width+'px';target.style.height=r.height+'px';target.getContext('2d').drawImage(canvas,0,0);target.style.visibility='visible';$('#loading').hidden=true;
 }catch(e){if(e.name!=='RenderingCancelledException'){$('#loading').textContent='Preview shown · source unavailable';console.error(e);}}
}
async function openFigure(key,button){
 epoch++;const token=epoch;activeKey=key;returnFocus=button;pdfPage=null;pointMode=false;pointers.clear();
 $('#point').setAttribute('aria-pressed','false');$('#viewport').classList.remove('point');$('#figure-title').textContent=assets[key].label;
 $('#preview').src=assets[key].preview;$('#preview').alt=assets[key].label;$('#viewer').hidden=false;$('#app').inert=true;
 $('#viewer-caption').textContent=slides[index].legend==='tissue'?'Projection | 3D mask · Arrowheads: GFP+ donor cells · NT: neural tube · SM: somite · TB: tailbud · 100 µm bars':(slides[index].legend==='host'?'Projection: TBXT / SOX2 / MEOX1 · 3D mask: TBXT+SOX2+ / Other nuclei · 100 µm bars':'Pinch to zoom · Drag to move · Double-tap to enlarge · Fit to reset');
 $('#loading').textContent='Loading source…';$('#loading').hidden=false;$('#close-viewer').focus();fit();
 try{sharedDocument??=pdfjs.getDocument({url:assets[key].pdf,standardFontDataUrl:'./vendor/standard_fonts/',wasmUrl:'./vendor/wasm/'}).promise;const d=await sharedDocument;if(token!==epoch)return;pdfDoc=d;pdfPage=await d.getPage(assets[key].page);if(token!==epoch)return;queueRender();}
 catch(e){if(token===epoch){$('#loading').textContent='Preview shown · source unavailable';console.error(e);}}
}
function closeFigure(){epoch++;activeKey=null;pdfPage=null;renderJob?.cancel();clearTimeout(renderTimer);pdfDoc=null;pointers.clear();$('#viewer').hidden=true;$('#app').inert=false;$('#pointer').style.display='none';returnFocus?.focus();}
$('#close-viewer').onclick=closeFigure;$('#fit').onclick=fit;$('#plus').onclick=()=>zoom(1.5);$('#minus').onclick=()=>zoom(1/1.5);
$('#point').onclick=()=>{pointMode=!pointMode;$('#point').setAttribute('aria-pressed',String(pointMode));$('#viewport').classList.toggle('point',pointMode);$('#pointer').style.display='none';};
function showPoint(p){const el=$('#pointer');el.style.left=p.x+'px';el.style.top=p.y+'px';el.style.display='block';}
const vp=$('#viewport');
vp.addEventListener('pointerdown',e=>{e.preventDefault();vp.setPointerCapture(e.pointerId);const p=local(e);pointers.set(e.pointerId,p);gestureMoved=false;if(pointMode&&pointers.size===1){showPoint(p);return;}if(pointers.size===1)drag={...p,tx,ty};if(pointers.size===2){const[a,b]=[...pointers.values()];pinch={dist:Math.hypot(a.x-b.x,a.y-b.y),scale,tx,ty,mx:(a.x+b.x)/2,my:(a.y+b.y)/2};}});
vp.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;e.preventDefault();const p=local(e);pointers.set(e.pointerId,p);if(pointMode&&pointers.size===1){showPoint(p);return;}
 if(pointers.size===2&&pinch){const[a,b]=[...pointers.values()],mx=(a.x+b.x)/2,my=(a.y+b.y)/2;scale=Math.min(fitScale*16,Math.max(fitScale,pinch.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.dist)));tx=mx-(pinch.mx-pinch.tx)*scale/pinch.scale;ty=my-(pinch.my-pinch.ty)*scale/pinch.scale;gestureMoved=true;updatePreview();}
 else if(drag){if(Math.hypot(p.x-drag.x,p.y-drag.y)>4)gestureMoved=true;tx=drag.tx+p.x-drag.x;ty=drag.ty+p.y-drag.y;updatePreview();}});
function up(e){const p=local(e),wasPinch=pointers.size>1;pointers.delete(e.pointerId);if(!gestureMoved&&!wasPinch&&!pointMode&&e.type==='pointerup'){const now=Date.now();if(now-lastTap<320){zoom(scale>fitScale*1.5?fitScale/scale:2.5,p.x,p.y);lastTap=0;}else lastTap=now;}pinch=null;drag=null;if(pointers.size===1){const q=[...pointers.values()][0];drag={...q,tx,ty};gestureMoved=true;}if(!pointers.size)queueRender();}
vp.addEventListener('pointerup',up);vp.addEventListener('pointercancel',up);vp.addEventListener('wheel',e=>{e.preventDefault();const p=local(e);zoom(Math.exp(-e.deltaY*.002),p.x,p.y);},{passive:false});
window.addEventListener('resize',()=>{if(activeKey)fit();});
document.addEventListener('keydown',e=>{if(activeKey){if(e.key==='Escape')closeFigure();if(e.key==='+'||e.key==='=')zoom(1.5);if(e.key==='-')zoom(1/1.5);if(e.key==='0')fit();if(e.key==='Tab'){const controls=[...$('#viewer').querySelectorAll('button')];if(e.shiftKey&&document.activeElement===controls[0]){e.preventDefault();controls.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===controls.at(-1)){e.preventDefault();controls[0].focus();}}return;}if(document.querySelector('dialog[open]'))return;if(e.target.closest('video'))return;if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();move(1);}if(e.key==='ArrowLeft')move(-1);});
// Explicit, resumable offline preparation; the video is cached as a complete response.
let saving=false;
async function saveOffline(){if(saving)return;saving=true;const b=$('#offline');b.disabled=true;
 try{if(!('serviceWorker'in navigator)||!window.isSecureContext)throw new Error('Open the HTTPS website to save offline.');await navigator.serviceWorker.ready;
 const list=await(await fetch('./offline-files.json')).json(),cache=await caches.open('nmp-companion-v1');let n=0;
 for(const path of list){b.textContent=`Saving ${Math.round(n/list.length*100)}%`;if(!await cache.match(path)){const res=await fetch(path,{cache:'reload'});if(!res.ok)throw new Error('Could not save '+path);await cache.put(path,res);}n++;}
 localStorage.setItem('nmp-offline-v1','ready');b.textContent='Ready offline';await navigator.storage?.persist?.();toast('Saved. Test in Airplane Mode before your meeting.');
 }catch(e){b.textContent='Retry offline save';toast(e.message||'Save interrupted. Tap to resume.');}finally{b.disabled=false;saving=false;}
}
$('#offline').onclick=saveOffline;
if('serviceWorker'in navigator&&window.isSecureContext)navigator.serviceWorker.register('./sw.js').catch(()=>{});
async function checkOffline(){if(localStorage.getItem('nmp-offline-v1')==='ready'){try{const list=await(await fetch('./offline-files.json')).json(),cache=await caches.open('nmp-companion-v1');let complete=true;for(const p of list)if(!await cache.match(p)){complete=false;break;}$('#offline').textContent=complete?'Ready offline':'Save offline';}catch{$('#offline').textContent='Check offline save';}}}
draw();checkOffline();
