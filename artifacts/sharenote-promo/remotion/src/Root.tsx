import './index.css';
import React from 'react';
import {Composition,Still} from 'remotion';
import {Promo} from './Promo';
import {PovPromo} from './PovPromo';
import {AppScreen} from './AppScreen';
export const RemotionRoot = () => <>
 {(['calendar','tasks','groceries'] as const).map(screen=><React.Fragment key={screen}>
  <Composition id={screen==='groceries'?'GroceryList':screen==='calendar'?'Calendar':'Tasks'} component={Promo} durationInFrames={144} fps={24} width={2560} height={1440} defaultProps={{screen}} />
  <Still id={'Capture'+screen} component={AppScreen} width={393} height={852} defaultProps={{screen}} />
 </React.Fragment>)}
 {(['calendar','tasks','groceries'] as const).map(screen=><Composition key={'pov-'+screen} id={screen==='groceries'?'GroceryListPOV':screen==='calendar'?'CalendarPOV':'TasksPOV'} component={PovPromo} durationInFrames={144} fps={24} width={2560} height={1440} defaultProps={{screen}} />)}
</>;
