import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { useFonts } from 'expo-font';
import { Redirect, Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AppStateProvider, useAppState } from '@/context/AppState';
import { SubscriptionProvider, useSubscription } from '@/lib/revenuecat';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { authUser, hasFamily, isAuthLoading, isFamilyStateLoading } = useAppState();
  const { hasAccess, isLoading: isSubscriptionLoading } = useSubscription();

  useEffect(() => {
    if (isAuthLoading || isFamilyStateLoading || isSubscriptionLoading || !authUser || !hasFamily || hasAccess) return;
    if (pathname !== '/subscription') {
      router.replace('/subscription');
    }
  }, [authUser, hasAccess, hasFamily, isAuthLoading, isFamilyStateLoading, isSubscriptionLoading, pathname, router]);

  if (
    !isAuthLoading
    && !isFamilyStateLoading
    && authUser
    && !hasFamily
    && pathname !== '/'
    && pathname !== '/create-family'
    && pathname !== '/sign-in'
  ) {
    return <Redirect href="/" />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="create-family" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="profile-select" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="add-event" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="add-task" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="subscription" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Montserrat_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppStateProvider>
          <QueryClientProvider client={queryClient}>
            <SubscriptionProvider>
              <GestureHandlerRootView>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </SubscriptionProvider>
          </QueryClientProvider>
        </AppStateProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
