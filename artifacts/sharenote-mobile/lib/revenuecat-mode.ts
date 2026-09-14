export function isRevenueCatBypassEnabled(isDevelopment: boolean, flag: string | undefined) {
  return isDevelopment && flag?.trim().toLowerCase() === 'true';
}