import {useEffect,useRef,useState} from 'react';
import {GestureMachine} from './gesture';
type Props={enabled:boolean;onClose:()=>void;onStatus:(s:string)=>void};
export function Camera({enabled,onClose,onStatus}:Props){
 const video=useRef<HTMLVideoElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const [cursor,setCursor]=useState<{x:number;y:number;pinched:boolean}|null>(null);
 useEffect(()=>{
  if(!enabled)return;
  let disposed=false,stream:MediaStream|undefined,landmarker:import('@mediapipe/tasks-vision').HandLandmarker|undefined,frame=0,busy=false;
  const machine=new GestureMachine();let target:Element|null=null,lastTime=-1,lastStatus='';
  const status=(s:string)=>{if(s!==lastStatus){lastStatus=s;onStatus(s);}};
  const cancel=()=>{machine.reset();target=null;setCursor(null);window.dispatchEvent(new Event('emoji-input-cancel'));};
  const pointer=(type:string,x:number,y:number)=>{(document.elementFromPoint(x,y)||document.body).dispatchEvent(new PointerEvent(type,{bubbles:true,clientX:x,clientY:y,pointerType:'gesture',pointerId:99,button:0,buttons:type==='pointerup'?0:1}));};
  const tick=()=>{
   if(disposed)return;
   if(!document.hidden&&document.hasFocus()&&landmarker&&video.current&&video.current.readyState>=2&&video.current.currentTime!==lastTime&&!busy){
    busy=true;lastTime=video.current.currentTime;
    try{
     const now=performance.now(),result=landmarker.detectForVideo(video.current,now),points=result.landmarks[0];
     const ctx=canvas.current?.getContext('2d');if(ctx&&canvas.current){ctx.clearRect(0,0,240,150);if(points){ctx.fillStyle='#a6f2b0';points.forEach(p=>{ctx.beginPath();ctx.arc(p.x*240,p.y*150,2.5,0,Math.PI*2);ctx.fill();});}}
     const s=machine.update(points,now);
     if(s?.cancelled){cancel();status('未检测到手 · 张开手掌重新激活');}
     else if(s?.active){
      const x=s.x*innerWidth,y=s.y*innerHeight;setCursor({x,y,pinched:s.pinched});status(s.pinched?'正在抓取 · 松开放置':'手势已就绪 · 捏合并松开以点击');
      if(s.edge==='down'){target=document.elementFromPoint(x,y);pointer('pointerdown',x,y);}
      else if(s.edge==='up'){pointer('pointerup',x,y);target=null;}
      else if(s.pinched&&target)pointer('pointermove',x,y);
     }else if(!points||!s?.active){status('请张开手掌，激活光标');setCursor(null);}
    }catch{cancel();status('识别异常 · 请关闭后重新启用摄像头');}finally{busy=false;}
   }
   frame=requestAnimationFrame(tick);
  };
  const start=async()=>{
   status('正在连接摄像头…');
   try{
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('此浏览器或连接不支持摄像头，请使用 HTTPS');
    stream=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,facingMode:'user'},audio:false});
    if(disposed){stream.getTracks().forEach(t=>t.stop());return;}
    stream.getVideoTracks()[0].onended=()=>{cancel();status('摄像头已断开 · 请关闭后重新连接');};
    if(video.current){video.current.srcObject=stream;await video.current.play();}
    status('正在加载本地手势模型…');
    const {FilesetResolver,HandLandmarker}=await import('@mediapipe/tasks-vision');
    const vision=await FilesetResolver.forVisionTasks('/vision/wasm');
    landmarker=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'/vision/hand_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:0.6,minHandPresenceConfidence:0.6,minTrackingConfidence:0.6});
    if(disposed){landmarker.close();return;}tick();
   }catch(e){stream?.getTracks().forEach(t=>t.stop());cancel();status(e instanceof DOMException&&e.name==='NotAllowedError'?'摄像头权限未开启 · 仍可使用鼠标':e instanceof DOMException&&e.name==='NotFoundError'?'没有找到摄像头 · 请连接设备':e instanceof DOMException&&e.name==='NotReadableError'?'摄像头被占用 · 请关闭其他使用摄像头的应用':`摄像头或识别资源加载失败 · 关闭后重试${e instanceof Error?'：'+e.message:''}`);}
  };
  window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',cancel);start();
  return ()=>{disposed=true;cancelAnimationFrame(frame);stream?.getTracks().forEach(t=>t.stop());landmarker?.close();cancel();window.removeEventListener('blur',cancel);document.removeEventListener('visibilitychange',cancel);};
 },[enabled]);
 if(!enabled)return null;
 return <><aside className="camera-preview"><video ref={video} muted playsInline/><canvas width="240" height="150" ref={canvas}/><button onClick={onClose} aria-label="关闭摄像头">关闭摄像头</button><small>画面仅在此设备处理</small></aside>{cursor&&<div className={'gesture-cursor '+(cursor.pinched?'grabbing':'')} style={{left:cursor.x,top:cursor.y}}/>}</>;
}
