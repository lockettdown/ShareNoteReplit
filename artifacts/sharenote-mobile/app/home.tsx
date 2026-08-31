// This screen is superseded by the (tabs) layout.
// Redirect any stale navigations to the tab root.
import { Redirect } from 'expo-router';

export default function HomeRedirect() {
  return <Redirect href="/(tabs)" />;
}
