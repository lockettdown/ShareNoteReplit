import React from 'react';
import glyphs from './Feather.json';
export const Feather = ({name, size=24, color='#000'}: {name:string;size?:number;color?:string}) => <span style={{fontFamily:'Feather',fontSize:size,color,lineHeight:1,display:'inline-block',width:size,height:size,textAlign:'center',fontWeight:400}}>{String.fromCodePoint((glyphs as Record<string,number>)[name] ?? 32)}</span>;
