export const ONBOARDING_VERSION = '1';

export function onboardingStorageKey(userId: string | number, role: string) {
  return `manteca:onboarding:${userId}:${role}`;
}
