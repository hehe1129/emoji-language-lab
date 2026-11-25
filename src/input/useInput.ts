import {useEffect,useRef,useState} from 'react';
import type {EmojiId} from '../config';
import {gestureConfig} from './gesture';
import type {Drag} from './rules';
type Actions={drop:(d:Drag,index:number)=>void;remove:(d:Drag)=>void;cancel:()=>void};
export function useInput(actions:Actions){
 const ref=useRef(actions);ref.current=actions;
 const [ghost,setGhost]=useState<{id:EmojiId;x:number;y:number}|null>(null);
 const [insert,setInsert]=useState<number|null>(null);
 useEffect(()=>{
  let hold:{drag:Drag|null;target:HTMLElement;x:number;y:number;at:number;moved:boolean;gesture:boolean}|null=null;
  let suppressPoint:{x:number;y:number;at:number}|null=null;
  const cancel=()=>{hold=null;setGhost(null);setInsert(null);ref.current.cancel();};
  const slot=(x:number,y:number)=>{
   const el=document.elementFromPoint(x,y);if(!el?.closest('[data-sequence]'))return null;
   const items=Array.from(document.querySelectorAll<HTMLElement>('[data-item]'));
   return items.findIndex(item=>{const r=item.getBoundingClientRect();return y<r.top||y<=r.bottom&&x<r.left+r.width/2;})<0?items.length:items.findIndex(item=>{const r=item.getBoundingClientRect();return y<r.top||y<=r.bottom&&x<r.left+r.width/2;});
  };
  const down=(e:PointerEvent)=>{
   if(e.button!==0||hold)return;
   const target=(e.target as HTMLElement).closest<HTMLElement>('[data-asset],[data-item],button,a');if(!target||target.matches(':disabled,[aria-disabled=true]'))return;
   const id=target.dataset.asset||target.dataset.emoji;
   const drag:Drag|null=target.hasAttribute('data-asset')?{kind:'asset',id:id as EmojiId}:target.hasAttribute('data-item')?{kind:'item',id:id as EmojiId,index:Number(target.dataset.item)}:null;
   if(drag)e.preventDefault();
   hold={drag,target,x:e.clientX,y:e.clientY,at:performance.now(),moved:false,gesture:e.pointerType==='gesture'};
  };
  const move=(e:PointerEvent)=>{if(!hold)return;const distance=Math.hypot(e.clientX-hold.x,e.clientY-hold.y);if(distance>gestureConfig.dragPx)hold.moved=true;
   if(hold.drag&&hold.moved){e.preventDefault();if(e.pointerType!=='gesture'){try{document.documentElement.setPointerCapture(e.pointerId);}catch{}}setGhost({id:hold.drag.id,x:e.clientX,y:e.clientY});setInsert(slot(e.clientX,e.clientY));}
  };
  const up=(e:PointerEvent)=>{
   if(!hold)return;const h=hold;hold=null;setGhost(null);setInsert(null);
   if(h.drag&&h.moved){suppressPoint={x:e.clientX,y:e.clientY,at:performance.now()};const hit=document.elementFromPoint(e.clientX,e.clientY);if(hit?.closest('[data-trash]'))ref.current.remove(h.drag);else{const index=slot(e.clientX,e.clientY);if(index!==null)ref.current.drop(h.drag,index);}return;}
   if(h.gesture&&Math.hypot(e.clientX-h.x,e.clientY-h.y)<=gestureConfig.stableClickPx&&performance.now()-h.at>=gestureConfig.clickMinMs){
    const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('button,a');if(target===h.target)h.target.click();
   }
  };
  const click=(e:MouseEvent)=>{if(suppressPoint&&performance.now()-suppressPoint.at<150&&Math.hypot(e.clientX-suppressPoint.x,e.clientY-suppressPoint.y)<3){suppressPoint=null;e.stopPropagation();e.preventDefault();}};
  const nativeDrag=(e:DragEvent)=>{if((e.target as HTMLElement).closest('[data-item],[data-asset]'))e.preventDefault();};
  document.addEventListener('pointerdown',down);document.addEventListener('pointermove',move,{passive:false});document.addEventListener('pointerup',up);document.addEventListener('click',click,true);
  document.addEventListener('dragstart',nativeDrag);document.addEventListener('pointercancel',cancel);window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',cancel);window.addEventListener('emoji-input-cancel',cancel);
  return ()=>{document.removeEventListener('pointerdown',down);document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);document.removeEventListener('click',click,true);document.removeEventListener('dragstart',nativeDrag);document.removeEventListener('pointercancel',cancel);window.removeEventListener('blur',cancel);document.removeEventListener('visibilitychange',cancel);window.removeEventListener('emoji-input-cancel',cancel);};
 },[]);
 return {ghost,insert};
}
