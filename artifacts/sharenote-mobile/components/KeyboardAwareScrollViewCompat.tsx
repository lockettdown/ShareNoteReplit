import React from 'react';
import { Platform, ScrollView, ScrollViewProps } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller';

// Omit children from the library Props to avoid the React 18 ↔ 19 ReactNode
// type intersection (react-native-keyboard-controller uses @types/react@18,
// while this workspace uses React 19 which adds `bigint` to ReactNode).
type Props = Omit<KeyboardAwareScrollViewProps & ScrollViewProps, 'children'> & {
  children?: React.ReactNode;
};

export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = 'handled',
  ...props
}: Props) {
  if (Platform.OS === 'web') {
    return (
      <ScrollView
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        {...props}
      >
        {children}
      </ScrollView>
    );
  }
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...props}
    >
      {children as any}
    </KeyboardAwareScrollView>
  );
}
