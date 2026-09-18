import React from 'react';
import {AbsoluteFill,Img,interpolate,useCurrentFrame,staticFile} from 'remotion';
import {AppScreen} from './AppScreen';
export const Promo = ({screen}: {screen:'calendar'|'tasks'|'groceries'}) => {
 const frame=useCurrentFrame();
 return <AbsoluteFill style={{background:'#cfc5b3',overflow:'hidden'}}>
  <Img src={staticFile(`home-${screen}.png`)} style={{position:'absolute',width:2720,height:1530,left:-80,top:-45,objectFit:'cover',filter:'blur(20px)',scale:interpolate(frame,[0,143],[1,1.035]),translate:`${interpolate(frame,[0,143],[-12,12])}px 0px`}} />
  <AbsoluteFill style={{background:'linear-gradient(100deg,rgba(251,239,215,.28),rgba(40,31,23,.08))'}} />
  <div style={{position:'absolute',left:1010,top:150,width:540,height:1140,perspective:4000,translate:`${interpolate(frame,[0,143],[-24,24])}px ${interpolate(frame,[0,143],[6,-6])}px`,scale:interpolate(frame,[0,143],[.985,1.025])}}>
   <div style={{position:'absolute',inset:0,borderRadius:76,background:'linear-gradient(105deg,#efe9dc 0%,#575550 2%,#1b1b1b 5%,#252526 95%,#b3aea3 98%,#343332 100%)',boxShadow:'36px 42px 64px rgba(26,20,13,.32), 8px 12px 18px rgba(26,20,13,.35)',transform:`rotateY(${interpolate(frame,[0,143],[-7,-2])}deg) rotateZ(${interpolate(frame,[0,143],[-1.2,-.3])}deg)`,padding:13,overflow:'hidden'}}>
    <div style={{position:'absolute',left:-3,top:255,width:5,height:70,background:'#b5afa2',borderRadius:2}} />
    <div style={{width:514,height:1114,borderRadius:63,overflow:'hidden',position:'relative',background:'#f4efff'}}>
     <div style={{width:393,height:852,scale:514/393,transformOrigin:'top left'}}><AppScreen screen={screen} scroll={screen==='calendar'?interpolate(frame,[0,36,108,143],[0,0,350,350],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}):0}/></div>
     <div style={{position:'absolute',top:15,left:184,width:145,height:36,borderRadius:22,background:'#111',boxShadow:'inset 1px 1px 3px #333'}}><div style={{position:'absolute',right:12,top:10,width:16,height:16,borderRadius:8,background:'radial-gradient(circle at 45% 40%,#27364a,#090d13 70%)'}} /></div>
     <div style={{position:'absolute',bottom:12,left:180,width:154,height:5,background:'#25232b',borderRadius:4}} />
    </div>
   </div>
  </div>
  <AbsoluteFill style={{pointerEvents:'none',background:'radial-gradient(ellipse at 50% 44%,transparent 47%,rgba(43,29,16,.19) 100%)'}} />
 </AbsoluteFill>
};
