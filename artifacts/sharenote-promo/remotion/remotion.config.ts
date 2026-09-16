import {Config} from '@remotion/cli/config';
import path from 'node:path';
const mobile = path.resolve('../..', 'sharenote-mobile');
const adapter = (name: string) => path.resolve('src/adapters', name);
Config.setRspack(true);
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setConcurrency(4);
Config.overrideBundlerConfig((config) => ({
 ...config,
 resolve: {...config.resolve, alias: {...config.resolve?.alias,
  'react-native$': adapter('native.tsx'),
  'react-native-web$': path.join(mobile, 'node_modules/react-native-web'),
  'react$': path.resolve('node_modules/react'),
  'react-dom$': path.resolve('node_modules/react-dom'),
  'react/jsx-runtime$': path.resolve('node_modules/react/jsx-runtime.js'),
  'react/jsx-dev-runtime$': path.resolve('node_modules/react/jsx-dev-runtime.js'),
  'react-native-safe-area-context$': adapter('safe-area.ts'),
  '@expo/vector-icons$': adapter('icons.tsx'),
  'expo-haptics$': adapter('haptics.ts'),
  'expo-router$': adapter('router.tsx'),
  '@/context/AppState$': adapter('state.ts'),
  '@': mobile,
 }},
 module: {...config.module, rules: [...(config.module?.rules ?? []), {test: /\.(jpe?g|png)$/, type: 'asset/resource'}]},
}));
