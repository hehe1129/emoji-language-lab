export const gestureConfig={pinchOn:0.29,pinchOff:0.47,debounceMs:85,smoothing:0.34,lostMs:260,stableClickPx:34,clickMinMs:120,dragPx:12,margin:0.12};
export type Point={x:number;y:number;z?:number};
export class GestureMachine {
 active=false;pinched=false;candidate=false;since=0;lastSeen=0;x=0.5;y=0.5;needsOpen=true;
 reset(){this.active=false;this.pinched=false;this.candidate=false;this.needsOpen=true;this.since=0;}
 update(points:Point[]|undefined,time:number){
  if(!points){if(time-this.lastSeen>gestureConfig.lostMs){const cancelled=this.active||this.pinched;this.reset();return {cancelled,active:false,x:this.x,y:this.y,pinched:false,edge:''};}return null;}
  this.lastSeen=time;
  const distance=(a:number,b:number)=>Math.hypot(points[a].x-points[b].x,points[a].y-points[b].y);
  const ratio=distance(4,8)/Math.max(distance(5,17),0.02);
  const open=[8,12,16,20].filter((tip,i)=>distance(tip,0)>distance([6,10,14,18][i],0)*1.12).length>=3&&ratio>gestureConfig.pinchOff;
  if(this.needsOpen){if(!open)return {cancelled:false,active:false,x:this.x,y:this.y,pinched:false,edge:''};this.needsOpen=false;this.active=true;}
  const c=gestureConfig;const map=(v:number)=>Math.max(0,Math.min(1,(v-c.margin)/(1-c.margin*2)));
  this.x+=(map(1-points[9].x)-this.x)*c.smoothing;this.y+=(map(points[9].y)-this.y)*c.smoothing;
  const desired=this.pinched?ratio<c.pinchOff:ratio<c.pinchOn;
  let edge='';if(desired!==this.candidate){this.candidate=desired;this.since=time;}
  if(desired!==this.pinched&&time-this.since>=c.debounceMs){this.pinched=desired;edge=desired?'down':'up';}
  return {cancelled:false,active:this.active,x:this.x,y:this.y,pinched:this.pinched,edge};
 }
}
