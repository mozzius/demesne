import * as SecureStore from "expo-secure-store"

const options: SecureStore.SecureStoreOptions = {
  requireAuthentication: !__DEV__,
}

function storageKey(didKey: string) {
  return didKey.replace("did:key:", "")
}

export async function storePrivateKey(didKey: string, privateKey: string) {
  await SecureStore.setItemAsync(storageKey(didKey), privateKey, options)
}

export async function getPrivateKey(didKey: string) {
  return await SecureStore.getItemAsync(storageKey(didKey), options)
}
