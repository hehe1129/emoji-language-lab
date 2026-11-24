export const emoji = {
 cat:['1f431','小猫'], moon:['1f319','月亮'], stars:['1f31f','星星'], bed:['1f6cf','床'], sleep:['1f4a4','睡觉'], house:['1f3e0','家'], cloud:['2601','云'], sparkles:['2728','闪光'], rain:['1f327','雨'], umbrella:['2614','雨伞'], steps:['1f463','脚印'], bus:['1f68c','公交车'], heart:['2764','爱心'], wave:['1f44b','挥手'], rocket:['1f680','火箭'], sunrise:['1f305','日出'], earth:['1f30f','地球'], eyes:['1f440','眼睛'], person:['1f9d1','人'], smile:['1f600','笑脸'], gift:['1f381','礼物'], friends:['1f46b','朋友'], sun:['2600','太阳'], flower:['1f33c','花'], dove:['1f54a','鸽子'],
} as const;
export type EmojiId = keyof typeof emoji;
export type Level = {id:string; name:string; prompt:string; limit:number; requires:string|null; assets:EmojiId[]; x:number;y:number; motif:EmojiId; branch:string};
export const levels:Level[] = [
 {id:'01',name:'夜晚的梦',prompt:'小猫在夜晚进入了梦乡。',limit:6,requires:null,assets:['cat','moon','stars','bed','sleep','cloud','sparkles'],x:16,y:50,motif:'cat',branch:'起点'},
 {id:'02',name:'回家的路',prompt:'下雨了，我想回家。',limit:6,requires:'01',assets:['rain','umbrella','house','person','steps','bus','heart'],x:49,y:25,motif:'umbrella',branch:'日常的诗'},
 {id:'03',name:'月面日出',prompt:'我想去月球上看一场日出。',limit:8,requires:'01',assets:['moon','rocket','sunrise','stars','earth','eyes','sparkles','person'],x:49,y:75,motif:'rocket',branch:'远方的想象'},
 {id:'04',name:'分享快乐',prompt:'我把快乐分享给了朋友。',limit:8,requires:'02',assets:['smile','gift','friends','heart','sun','wave','sparkles','person'],x:82,y:25,motif:'gift',branch:'日常的诗'},
 {id:'05',name:'温柔世界',prompt:'我希望世界变得更加温柔。',limit:10,requires:'03',assets:['earth','heart','dove','flower','friends','sun','smile','sparkles','person'],x:82,y:75,motif:'earth',branch:'远方的想象'},
];
export const levelById=(id:string)=>levels.find(l=>l.id===id);
export const successors=(id:string)=>levels.filter(l=>l.requires===id);
export const unlocked=(completed:string[],id:string)=>{const l=levelById(id);return !!l&&(!l.requires||completed.includes(l.requires));};
export function validateSequence(levelId:unknown,sequence:unknown):string|null {
 const l=levels.find(l=>l.id===levelId);
 if(!l)return '关卡不存在';
 if(!Array.isArray(sequence)||sequence.length<1||sequence.length>l.limit)return `请使用 1–${l.limit} 个 Emoji`;
 if(!sequence.every(id=>l.assets.includes(id)))return '包含本关未提供的素材';
 return null;
}
