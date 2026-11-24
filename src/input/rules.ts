import type {EmojiId} from '../config';
export type Drag={kind:'asset';id:EmojiId}|{kind:'item';index:number;id:EmojiId};
export function place(sequence:EmojiId[],drag:Drag,index:number,limit:number):EmojiId[]{
 if(drag.kind==='asset'&&sequence.length>=limit)return sequence;
 const next=[...sequence];let target=Math.max(0,Math.min(index,next.length));
 if(drag.kind==='item'){if(drag.index<0||drag.index>=next.length)return sequence;next.splice(drag.index,1);if(drag.index<target)target--;}
 next.splice(target,0,drag.id);return next;
}
export function remove(sequence:EmojiId[],drag:Drag){return drag.kind==='item'?sequence.filter((_,i)=>i!==drag.index):sequence;}
