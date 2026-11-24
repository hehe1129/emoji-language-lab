import {mkdir,writeFile,cp} from 'node:fs/promises';
await mkdir('public/vision',{recursive:true});
await cp('node_modules/@mediapipe/tasks-vision/wasm','public/vision/wasm',{recursive:true});
async function download(url,path){const r=await fetch(url);if(!r.ok)throw new Error(`${r.status}: ${url}`);await writeFile(path,new Uint8Array(await r.arrayBuffer()));console.log(`Saved ${path}`);}
await download('https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task','public/vision/hand_landmarker.task');
await mkdir('public/fonts',{recursive:true});
for(const weight of [400,500,600]){
 const css=await (await fetch(`https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@${weight}`,{headers:{'User-Agent':'Mozilla/5.0'}})).text();
 const urls=[...css.matchAll(/url\((https:[^)]+)\)/g)];
 if(!urls.length)throw new Error('Font URL missing');
 await download(urls.at(-1)[1],`public/fonts/plex-${weight}.ttf`);
}
await download('https://raw.githubusercontent.com/IBM/plex/master/LICENSE.txt','public/fonts/OFL.txt');
await download('https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/LICENSE','public/vision/LICENSE.txt');
