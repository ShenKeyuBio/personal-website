const CACHE='nmp-companion-v1';
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 e.respondWith((async()=>{
  const c=await caches.open(CACHE);let hit=await c.match(e.request.url);
  if(!hit&&e.request.mode==='navigate')hit=await c.match(new URL('./index.html',self.location.href).href);
  if(!hit)return fetch(e.request);
  const range=e.request.headers.get('range');if(!range)return hit;
  const b=await hit.blob(),match=/^bytes=(\d*)-(\d*)$/.exec(range);
  if(!match)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${b.size}`}});
  const start=match[1]?Number(match[1]):Math.max(0,b.size-Number(match[2])),end=match[1]?(match[2]?Math.min(Number(match[2]),b.size-1):b.size-1):b.size-1;
  if(start>end||start>=b.size)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${b.size}`}});
  return new Response(b.slice(start,end+1),{status:206,headers:{'Content-Type':hit.headers.get('Content-Type')||'application/octet-stream','Content-Length':String(end-start+1),'Content-Range':`bytes ${start}-${end}/${b.size}`,'Accept-Ranges':'bytes'}});
 })());
});
