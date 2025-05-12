import { ConfigContext, ExpoConfig } from "expo/config"

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Demesne",
  slug: "demesne",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/demesne.png",
  scheme: "demesne",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    bundleIdentifier: "dev.mozzius.demesne",
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    edgeToEdgeEnabled: true,
    adaptiveIcon: {
      foregroundImage: "./assets/images/demesne-nobg.png",
      backgroundColor: "#4DA5C1",
    },
  },
  web: {
    bundler: "metro",
    output: "server",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    [
      "expo-router",
      {
        origin:
          process.env.NODE_ENV === "development"
            ? "http://localhost:8081"
            : "https://demesne.expo.app",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/demesne-nobg.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#4DA5C1",
      },
    ],
    [
      "expo-secure-store",
      {
        configureAndroidBackup: true,
        faceIDPermission:
          "Allow Demesne to access your Face ID biometric data.",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: "c7f815ec-d876-40cf-91c0-5e4f19f17000",
    },
  },
})
