import {levelById,validateSequence} from '../../src/config';
interface Env {DB:D1Database;DEMO_MODE?:string}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const digest=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,'0')).join('');
const validId=(s:unknown):s is string=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const asWork=(row:any)=>({id:row.id,levelId:row.level_id,sequence:JSON.parse(row.sequence),createdAt:row.created_at});
export const onRequest:PagesFunction<Env>=async({request,env})=>{
 const u=new URL(request.url),path=u.pathname.slice(5),method=request.method;
 if(path==='status'&&method==='GET'){
  if(env.DEMO_MODE==='true')return json({mode:'local'});
  if(!env.DB)return json({error:'公共作品库尚未绑定 D1'},503);
  try{await env.DB.prepare('SELECT id FROM sessions LIMIT 1').all();return json({mode:'public'});}catch{return json({error:'作品库尚未初始化或暂不可用'},503);}
 }
 if(!['GET','POST'].includes(method))return json({error:'作品仅支持读取与新增，不能修改或删除'},405);
 if(!env.DB)return json({error:'作品库未连接'},503);
 try{
  if(path==='sessions'&&method==='POST'){
   const id=crypto.randomUUID(),token=crypto.randomUUID()+crypto.randomUUID();
   await env.DB.prepare('INSERT INTO sessions (id,token_hash) VALUES (?,?)').bind(id,await digest(token)).run();return json({id,token},201);
  }
  if(path==='works'&&method==='GET'){
   const id=u.searchParams.get('level'),page=Number(u.searchParams.get('page')||1);
   if(!levelById(id||'')||!Number.isSafeInteger(page)||page<1||page>100000)return json({error:'无效关卡或页码'},400);
   const [count,rows]=await env.DB.batch([env.DB.prepare('SELECT COUNT(*) AS total FROM works WHERE level_id=?').bind(id),env.DB.prepare('SELECT id,level_id,sequence,created_at FROM works WHERE level_id=? ORDER BY created_at DESC,id DESC LIMIT 6 OFFSET ?').bind(id,(page-1)*6)]);
   return json({total:(count.results[0] as any).total,works:rows.results.map(asWork)});
  }
  if((path==='works'&&method==='POST')||(path==='sessions'&&method==='GET')){
   let body:any={};
   if(method==='POST'){if(Number(request.headers.get('content-length')||0)>4096)return json({error:'提交内容过大'},413);const raw=await request.text();if(raw.length>4096)return json({error:'提交内容过大'},413);try{body=JSON.parse(raw);}catch{return json({error:'无效 JSON'},400);}}
   const sessionId=method==='GET'?u.searchParams.get('id'):body.sessionId;
   const token=request.headers.get('Authorization')?.replace(/^Bearer /,'');
   if(!validId(sessionId)||!token||token.length>200)return json({error:'匿名会话无效，请重新开始体验'},401);
   const session=await env.DB.prepare('SELECT id FROM sessions WHERE id=? AND token_hash=?').bind(sessionId,await digest(token)).first();
   if(!session)return json({error:'匿名会话验证失败'},401);
   if(method==='GET'){const rows=await env.DB.prepare('SELECT id,level_id,sequence,created_at FROM works WHERE session_id=? ORDER BY created_at,id').bind(sessionId).all();return json({works:rows.results.map(asWork)});}
   if(!validId(body.id))return json({error:'无效提交 ID'},400);
   const error=validateSequence(body.levelId,body.sequence);if(error)return json({error},400);
   const old=await env.DB.prepare('SELECT * FROM works WHERE id=?').bind(body.id).first<any>();
   if(old){if(old.session_id!==sessionId||old.level_id!==body.levelId||old.sequence!==JSON.stringify(body.sequence))return json({error:'提交 ID 已用于另一份作品'},409);return json(asWork(old));}
   const level=levelById(body.levelId)!;
   // Conditional insert checks prerequisite in the same statement. UNIQUE id makes retries atomic.
   await env.DB.prepare('INSERT INTO works (id,level_id,sequence,session_id) SELECT ?,?,?,? WHERE ? IS NULL OR EXISTS (SELECT 1 FROM works WHERE session_id=? AND level_id=?) ON CONFLICT(id) DO NOTHING').bind(body.id,body.levelId,JSON.stringify(body.sequence),sessionId,level.requires,sessionId,level.requires).run();
   const saved=await env.DB.prepare('SELECT * FROM works WHERE id=?').bind(body.id).first<any>();
   if(!saved)return json({error:'请先提交前置关卡作品'},403);
   if(saved.session_id!==sessionId||saved.level_id!==body.levelId||saved.sequence!==JSON.stringify(body.sequence))return json({error:'提交 ID 冲突'},409);
   return json(asWork(saved),201);
  }
  return json({error:'接口不存在'},404);
 }catch(e){console.error('API failure',e instanceof Error?e.message:'unknown');return json({error:'保存服务暂时不可用，草稿已保留，请重试'},503);}
};
