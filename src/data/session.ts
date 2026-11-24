import type {EmojiId} from '../config';
export type Work={id:string;levelId:string;sequence:EmojiId[];createdAt:string};
export type Pending={id:string;levelId:string;sequence:EmojiId[]};
export type Session={id:string;token:string;mode:'local'|'public';completed:string[];works:Work[];drafts:Record<string,EmojiId[]>;pending:Record<string,Pending>;screen:string;levelId:string};
const KEY='emoji-language-lab.session.v1';
export function fresh(mode:Session['mode'],id=crypto.randomUUID(),token=crypto.randomUUID()):Session{return {id,token,mode,completed:[],works:[],drafts:{},pending:{},screen:'map',levelId:'01'};}
export function restore():Session|null{try{const s=JSON.parse(localStorage.getItem(KEY)||'null');return s&&typeof s.id==='string'&&typeof s.token==='string'&&['local','public'].includes(s.mode)&&Array.isArray(s.completed)&&s.drafts&&s.pending&&Array.isArray(s.works)?s:null;}catch{return null;}}
export function persist(s:Session){localStorage.setItem(KEY,JSON.stringify(s));}
export function recordSaved(s:Session,w:Work):Session{const drafts={...s.drafts},pending={...s.pending};delete drafts[w.levelId];delete pending[w.levelId];return {...s,completed:[...new Set([...s.completed,w.levelId])],works:s.works.some(x=>x.id===w.id)?s.works:[...s.works,w],drafts,pending};}
export function clearSession(){localStorage.removeItem(KEY);}
