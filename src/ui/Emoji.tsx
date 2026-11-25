import {emoji,type EmojiId} from '../config';
export function Emoji({id,className=''}:{id:EmojiId;className?:string}){const e=emoji[id];return e?<img className={'emoji '+className} draggable={false} src={'/emoji/'+e[0]+'.svg'} alt={e[1]}/>:<span>未知素材</span>;}
export function Sequence({ids}:{ids:EmojiId[]}){return <div className="work-sequence">{ids.map((id,i)=><Emoji id={id} key={i}/>)}</div>;}
