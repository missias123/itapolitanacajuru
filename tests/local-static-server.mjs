import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.env.PORT||8135);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.jpeg':'image/jpeg','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url||'/',`http://${req.headers.host}`).pathname);const relative=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');const target=path.resolve(root,relative);if(!target.startsWith(root+path.sep)&&target!==root)throw new Error('forbidden');const data=await fs.readFile(target);res.writeHead(200,{'Content-Type':mime[path.extname(target).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch(error){res.writeHead(error?.message==='forbidden'?403:404,{'Content-Type':'text/plain; charset=utf-8'});res.end(error?.message==='forbidden'?'Forbidden':'Not found');}});
server.listen(port,'127.0.0.1',()=>console.log(`STATIC_SERVER_READY http://127.0.0.1:${port}`));
