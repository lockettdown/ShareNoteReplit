type RevenueCatBypassOptions = {
  isDevelopment: boolean;
  flag: string | undefined;
  platform: string;
  executionEnvironment?: string;
};

export function isRevenueCatBypassEnabled({
  isDevelopment,
  flag,
  platform,
  executionEnvironment,
}: RevenueCatBypassOptions) {
  if (flag?.trim().toLowerCase() !== 'true') return false;

  return isDevelopment || platform === 'web' || executionEnvironment === 'storeClient';
}
