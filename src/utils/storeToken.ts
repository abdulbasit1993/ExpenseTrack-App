import * as Keychain from 'react-native-keychain';

const REFRESH_TOKEN_SERVICE = 'com.expensetrack.refresh-token';

export async function storeRefreshToken(refreshToken: string): Promise<void> {
  await Keychain.setGenericPassword('refresh-token', refreshToken, {
    service: REFRESH_TOKEN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getRefreshToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({
    service: REFRESH_TOKEN_SERVICE,
  });

  return credentials ? credentials.password : null;
}

export async function removeRefreshToken(): Promise<void> {
  await Keychain.resetGenericPassword({
    service: REFRESH_TOKEN_SERVICE,
  });
}
