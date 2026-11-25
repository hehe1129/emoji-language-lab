import {useState} from 'react';
export function useNavigation(){
 const [screen,setScreen]=useState('welcome');
 const [levelId,setLevelId]=useState('01');
 const go=(screen:string,levelId?:string)=>{if(levelId)setLevelId(levelId);setScreen(screen);};
 return {screen,setScreen,levelId,setLevelId,go};
}
