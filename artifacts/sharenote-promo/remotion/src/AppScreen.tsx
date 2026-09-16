import React, {useEffect,useState} from 'react';
import {delayRender,continueRender} from 'remotion';
import Calendar from '../../../sharenote-mobile/app/(tabs)/calendar';
import Tasks from '../../../sharenote-mobile/app/(tabs)/tasks';
import Groceries from '../../../sharenote-mobile/app/(tabs)/groceries';
import TabLayout from '../../../sharenote-mobile/app/(tabs)/_layout';
import {ScrollPosition} from './adapters/native';
import {ScreenContext} from './adapters/router';
export const AppScreen = ({screen,scroll=0}: {screen:'calendar'|'tasks'|'groceries';scroll?:number}) => {
 const [handle] = useState(() => delayRender('Loading actual app fonts'));
 useEffect(() => {Promise.all(['Feather','Inter_400Regular','Inter_500Medium','Inter_600SemiBold','Inter_700Bold','Montserrat_700Bold'].map(font=>document.fonts.load(`16px "${font}"`))).then(()=>continueRender(handle));},[handle]);
 return <ScrollPosition.Provider value={scroll}><ScreenContext.Provider value={{name:screen,screen:screen==='calendar'?<Calendar/>:screen==='tasks'?<Tasks/>:<Groceries/>}}><TabLayout/></ScreenContext.Provider></ScrollPosition.Provider>;
};
