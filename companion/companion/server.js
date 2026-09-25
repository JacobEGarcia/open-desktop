'use strict';
// OPEN local companion: deliberately narrow, no general shell, network binding, or autonomous tools.
const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const ROOT = path.resolve(process.env.OPEN_WORKSPACE || path.join(os.homedir(), 'OPEN Workspace'));
const PORT = Number(process.env.OPEN_PORT || 18183);
const TOKEN = process.env.OPEN_TOKEN || crypto.randomBytes(24).toString('base64url');
const ORIGINS = new Set(['https://jacobegarcia.github.io', `http://127.0.0.1:${PORT}`, `http://localhost:${PORT}`]);
const pending = new Map();
const MAX = 128 * 1024;
const json = (res, status, value) => {res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value))};
const fail = (res,status,message) => json(res,status,{error:message});
function nameOf(value) {if(typeof value !== 'string' || !/^[\w .()\-]{1,100}\.(txt|md|json|csv|js|html|css)$/i.test(value) || value.trim()!==value || value==='.' || value==='..' || /[\\/]/.test(value)) throw Error('Use a simple text filename with a supported extension');return value}
async function safeFile(value) {let name=nameOf(value), target=path.join(ROOT,name);try {let st=await fsp.lstat(target);if(st.isSymbolicLink() || !st.isFile())throw Error('Only regular files are allowed')}catch(e){if(e.code!=='ENOENT')throw e}return target}
async function body(req){let chunks=[], n=0;for await(const chunk of req){n+=chunk.length;if(n>MAX)throw Error('Request too large');chunks.push(chunk)}return JSON.parse(Buffer.concat(chunks).toString('utf8'))}
const equal = (a,b) => {let x=Buffer.from(a||''), y=Buffer.from(b||'');return x.length===y.length && crypto.timingSafeEqual(x,y)};
function cors(req,res){let origin=req.headers.origin;if(origin && !ORIGINS.has(origin)){fail(res,403,'Origin not allowed');return false}if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type, Private-Network-Access');res.setHeader('Access-Control-Allow-Private-Network','true')}return true}
async function model(){for(let port of [18182]){try{let c=new AbortController(), t=setTimeout(()=>c.abort(),850);let r=await fetch(`http://127.0.0.1:${port}/v1/models`,{signal:c.signal});clearTimeout(t);if(r.ok){let j=await r.json(), id=j.data?.[0]?.id;if(id)return {port,id}}}catch{}}return null}
async function respond(req,res){if(!cors(req,res))return;if(req.method==='OPTIONS'){res.writeHead(204);res.end();return}
let u=new URL(req.url,`http://127.0.0.1:${PORT}`);
if(req.method==='GET' && ['/','/index.html','/13-coast.jpg'].includes(u.pathname)){let file=path.join(__dirname,'..',u.pathname==='/'?'index.html':u.pathname.slice(1));let type=u.pathname.endsWith('.jpg')?'image/jpeg':'text/html; charset=utf-8';res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res);return}
if(!equal(req.headers.authorization?.replace(/^Bearer /,''),TOKEN))return fail(res,401,'Local companion key is missing or wrong');
try{
if(req.method==='GET' && u.pathname==='/api/status'){let m=await model();return json(res,200,{connected:true,workspace:ROOT,model:m?.id||null,modelReady:!!m,scope:'Text files in OPEN Workspace only. No shell, browser automation, or other folders.'})}
if(req.method==='GET' && u.pathname==='/api/system'){return json(res,200,{device:os.hostname(),platform:os.platform(),uptimeSeconds:Math.round(os.uptime()),memoryFreeGiB:Math.round(os.freemem()/1073741824*10)/10,memoryTotalGiB:Math.round(os.totalmem()/1073741824*10)/10})}
if(req.method==='GET' && u.pathname==='/api/files'){let entries=await fsp.readdir(ROOT,{withFileTypes:true}), names=entries.filter(x=>x.isFile()).map(x=>x.name).filter(x=>{try{nameOf(x);return true}catch{return false}}).sort();return json(res,200,{files:names})}
if(req.method==='GET' && u.pathname==='/api/file'){let file=await safeFile(u.searchParams.get('name'));let st=await fsp.stat(file);if(st.size>MAX)return fail(res,413,'File too large');return json(res,200,{name:path.basename(file),content:await fsp.readFile(file,'utf8')})}
if(req.method==='POST' && u.pathname==='/api/chat'){let b=await body(req), text=String(b.message||'').trim();if(!text||text.length>6000)return fail(res,400,'Message must be 1-6000 characters');let m=await model();if(!m)return fail(res,503,'No local model is responding on port 18182');let ctl=new AbortController(), timeout=setTimeout(()=>ctl.abort(),90000);try{let r=await fetch(`http://127.0.0.1:${m.port}/v1/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:m.id,messages:[{role:'system',content:'You are OPEN, a clear practical assistant. You have no tools or computer access. Do not claim to have run a command or changed a file. Give concise, accurate answers and state uncertainty.'},{role:'user',content:text}],temperature:0.4,max_tokens:750}),signal:ctl.signal});if(!r.ok)throw Error('Local model returned '+r.status);let j=await r.json();return json(res,200,{reply:j.choices?.[0]?.message?.content||'No answer returned',model:m.id})}finally{clearTimeout(timeout)}}
if(req.method==='POST' && u.pathname==='/api/prepare'){let b=await body(req), name=nameOf(b.name), content=String(b.content||'');if(Buffer.byteLength(content)>MAX)return fail(res,413,'File too large');let dest=await safeFile(name), exists=fs.existsSync(dest), original=exists?crypto.createHash('sha256').update(await fsp.readFile(dest)).digest('hex'):null;let approval=crypto.randomBytes(18).toString('base64url');pending.set(approval,{name,content,expires:Date.now()+60000,exists,original});setTimeout(()=>pending.delete(approval),61000).unref();return json(res,200,{approval,name,bytes:Buffer.byteLength(content),action:exists?'Replace':'Create',expiresInSeconds:60})}
if(req.method==='POST' && u.pathname==='/api/commit'){let b=await body(req), p=pending.get(b.approval);if(!p || Date.now()>p.expires)return fail(res,400,'Approval expired; preview again');pending.delete(b.approval);let dest=await safeFile(p.name);if(fs.existsSync(dest)!==p.exists)return fail(res,409,'File changed since preview');if(p.exists && crypto.createHash('sha256').update(await fsp.readFile(dest)).digest('hex')!==p.original)return fail(res,409,'File changed since preview');let temp=path.join(ROOT,'.open-'+crypto.randomBytes(8).toString('hex')+'.tmp');try{await fsp.writeFile(temp,p.content,{flag:'wx',mode:0o600});await fsp.rename(temp,dest)}finally{await fsp.rm(temp,{force:true})}return json(res,200,{saved:p.name,bytes:Buffer.byteLength(p.content)})}
return fail(res,404,'Not found');
}catch(e){return fail(res,e.message==='Request too large'?413:400,e.message||'Request failed')}
}
(async()=>{await fsp.mkdir(ROOT,{recursive:true});http.createServer((req,res)=>{respond(req,res).catch(e=>{console.error(e);if(!res.headersSent)fail(res,500,'Local companion error')})}).listen(PORT,'127.0.0.1',()=>{console.log(`OPEN companion: http://127.0.0.1:${PORT}`);console.log(`Workspace: ${ROOT}`);console.log(`Session key: ${TOKEN}`);console.log('Keep this terminal open. The key is shown only here; never post or commit it.')})})();
