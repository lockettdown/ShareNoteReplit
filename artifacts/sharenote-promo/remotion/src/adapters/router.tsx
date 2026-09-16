import React, {createContext,useContext} from 'react';
export const ScreenContext = createContext<{name:string;screen:React.ReactNode}>({name:'calendar',screen:null});
export const useRouter = () => ({push:()=>{},replace:()=>{},back:()=>{}});
export const Redirect = () => null;
const Screen = () => null;
const TabShell = ({children,screenOptions}:any) => {
 const current = useContext(ScreenContext);
 return <div style={{width:'100%',height:'100%',position:'relative',display:'flex',flexDirection:'column'}}><div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column'}}>{current.screen}</div><div style={{position:'absolute',bottom:0,left:0,right:0,height:84,background:screenOptions.tabBarStyle.backgroundColor,borderTop:`1px solid ${screenOptions.tabBarStyle.borderTopColor}`,display:'flex',paddingBottom:24,boxSizing:'border-box'}}>{React.Children.toArray(children).map((child:any)=>{const opts=child.props.options;const active=child.props.name===current.name;const color=active?screenOptions.tabBarActiveTintColor:screenOptions.tabBarInactiveTintColor;return <div key={child.props.name} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,color,fontFamily:'system-ui',fontSize:12}}>{opts.tabBarIcon({color})}<span>{opts.title}</span></div>})}</div></div>
};
export const Tabs = Object.assign(TabShell,{Screen});
