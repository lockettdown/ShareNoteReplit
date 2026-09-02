import colors from '@/constants/colors';

/**
 * Returns the ShareNote design tokens.
 *
 * The app intentionally uses the attachment-matched light palette on every
 * route so the lavender dashboard scheme stays consistent across devices.
 */
export function useColors() {
  return { ...colors.light, radius: colors.radius };
}
