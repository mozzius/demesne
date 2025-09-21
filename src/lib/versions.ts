import { Platform } from "react-native"

const iOSMajorVersion =
  Platform.OS === "ios" ? Number(Platform.Version.split(".")[0]) : 0

export const isIOS26 = iOSMajorVersion >= 26
