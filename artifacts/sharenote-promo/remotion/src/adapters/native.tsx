import React,{createContext,useContext,useRef,useLayoutEffect,forwardRef} from 'react';
import {ScrollView as WebScrollView} from 'react-native-web';
export * from 'react-native-web';
export const ScrollPosition = createContext(0);
export const ScrollView = forwardRef((props:any,forwarded:any)=>{
 const ref=useRef<any>(null);const position=useContext(ScrollPosition);
 useLayoutEffect(()=>{if(!props.horizontal && ref.current){ref.current.scrollTo({y:position,animated:false});}},[position,props.horizontal]);
 const nextProps=props.horizontal||position===0?props:{...props,contentContainerStyle:[props.contentContainerStyle,{transform:`translateY(-${position}px)`}]};
 return <WebScrollView {...nextProps} ref={(node:any)=>{ref.current=node;if(typeof forwarded==='function')forwarded(node);else if(forwarded)forwarded.current=node;}}/>;
});
