import * as Keychain from 'react-native-keychain';

export async function storeJwtToken(token: string) {
  try {
    await Keychain.setGenericPassword('jwt', token, {
      service: 'com.expensetrack.jwt',
    });

    console.log('Token stored successfully');
  } catch (error) {
    console.error('Error storing token: ', error);
  }
}

export async function getJwtToken() {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: 'com.expensetrack.jwt',
    });
    if (credentials) {
      console.log('Token retrieved successfully');
      return credentials.password;
    } else {
      console.log('No token found');
      return null;
    }
  } catch (error) {
    console.error('Error getting token: ', error);
    return null;
  }
}

export async function removeJwtToken() {
  try {
    await Keychain.resetGenericPassword({
      service: 'com.expensetrack.jwt',
    });
    console.log('Token removed successfully');
    return true;
  } catch (error) {
    console.error('Error removing token: ', error);
    return false;
  }
}
