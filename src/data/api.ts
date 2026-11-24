import {fresh,type Session,type Pending,type Work} from './session';
import {validateSequence,unlocked} from '../config';
async function request(path:string,options:RequestInit={}):Promise<any>{const res=await fetch('/api/'+path,{...options,headers:{'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(15000)});let body:any;try{body=await res.json();}catch{throw new Error('服务未返回有效数据，请稍后重试');}if(!res.ok)throw new Error(body.error||'连接失败，请重试');return body;}
export async function detectMode():Promise<'local'|'public'>{
 const r=await fetch('/api/status',{signal:AbortSignal.timeout(8000)});
 if(r.headers.get('content-type')?.includes('application/json')){const b:any=await r.json();if(b.mode==='public')return 'public';if(b.mode==='local')return 'local';throw new Error(b.error||'公共作品库暂不可用');}
 // Vite's static dev server has no API. Only localhost is allowed to enter demo implicitly.
 if(['localhost','127.0.0.1'].includes(location.hostname))return 'local';
 throw new Error('公共作品服务尚未配置，请联系现场工作人员');
}
export async function begin(mode:Session['mode']){if(mode==='local')return fresh(mode);const b=await request('sessions',{method:'POST',body:'{}'});return fresh(mode,b.id,b.token);}
const localWorks=():Work[]=>JSON.parse(localStorage.getItem('emoji-language-lab.local-works.v1')||'[]');
export async function listWorks(levelId:string,page:number,mode:Session['mode']):Promise<{works:Work[];total:number}>{
 if(mode==='public')return request(`works?level=${levelId}&page=${page}`);
 const all=localWorks().filter(w=>w.levelId===levelId);return {works:all.slice((page-1)*6,page*6),total:all.length};
}
export async function saveWork(s:Session,p:Pending):Promise<Work>{
 if(s.mode==='public')return request('works',{method:'POST',headers:{Authorization:`Bearer ${s.token}`},body:JSON.stringify({...p,sessionId:s.id})});
 const error=validateSequence(p.levelId,p.sequence);if(error)throw new Error(error);
 if(!unlocked(s.completed,p.levelId))throw new Error('请先完成前置关卡');
 const all=localWorks();const prior=all.find(w=>w.id===p.id);if(prior)return prior;
 const w={...p,createdAt:new Date().toISOString()};localStorage.setItem('emoji-language-lab.local-works.v1',JSON.stringify([w,...all]));return w;
}
export async function recover(s:Session):Promise<Work[]>{if(s.mode==='local')return s.works;return (await request(`sessions?id=${s.id}`,{headers:{Authorization:`Bearer ${s.token}`}})).works;}
