import React from 'react';
import {AbsoluteFill,Easing,Img,interpolate,staticFile,useCurrentFrame} from 'remotion';
import {AppScreen} from './AppScreen';

type Screen = 'calendar'|'tasks'|'groceries';
const scrollDistance: Record<Screen,number> = {calendar:350,tasks:220,groceries:260};

export const PovPromo = ({screen}: {screen:Screen}) => {
 const frame=useCurrentFrame();
 return <AbsoluteFill style={{background:'#d8c5a7',overflow:'hidden'}}>
  <div style={{position:'absolute',width:2560,height:1440,left:0,top:0,scale:interpolate(frame,[0,143],[1.025,1.065],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)}),translate:`${interpolate(frame,[0,143],[-10,12],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)})}px ${interpolate(frame,[0,143],[7,-7],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)})}px`}}>
   <Img src={staticFile('pov-phone-base.png')} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'fill'}} />
   <div style={{position:'absolute',left:1039,top:182,width:459,height:973,borderRadius:42,overflow:'hidden',background:'#f4efff'}}>
    <div style={{width:393,height:852,scale:459/393,transformOrigin:'top left'}}>
     <AppScreen screen={screen} scroll={interpolate(frame,[0,28,112,143],[0,0,scrollDistance[screen],scrollDistance[screen]],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.32,.02,.18,1)})}/>
    </div>
   </div>
   <Img src={staticFile('pov-phone-foreground.png')} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'fill'}} />
  </div>
  <AbsoluteFill style={{pointerEvents:'none',background:'radial-gradient(ellipse at 50% 48%,transparent 55%,rgba(62,39,19,.16) 100%)'}} />
 </AbsoluteFill>;
};
