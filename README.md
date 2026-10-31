# Demesne

PLC key management app for iOS and Android. Very much WIP!

Sign in to your Bluesky account, then add a rotation key that lives in this
device's secure storage, so you can recover your identity even if your PDS
disappears. You can also browse your PLC audit log and download backups of
your repo.

## Development

Built with Expo SDK 58, Expo Router, and [`@expo/ui`](https://docs.expo.dev/versions/latest/sdk/ui/)
for native SwiftUI / Jetpack Compose layouts.

```sh
pnpm install
pnpm ios       # or: pnpm android
```

Needs a development build (`expo-dev-client`), since it uses native modules
like `expo-secure-store`.

```sh
pnpm typecheck
pnpm lint
```
