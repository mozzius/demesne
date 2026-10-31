import { Platform } from "react-native"
import { Host, RNHostView } from "@expo/ui"

/*
 * `ListItem` leading/trailing slots differ per platform: iOS wraps slot
 * content in an `RNHostView` (so it expects React Native views), while
 * Android renders it straight into the Compose tree (so it expects @expo/ui
 * components). These wrappers make either kind of content work everywhere.
 */

/** Slot content made of React Native views, e.g. an `<Image>`. */
export function RNAccessory({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "android") {
    return (
      <RNHostView matchContents>
        <>{children}</>
      </RNHostView>
    )
  }
  return <>{children}</>
}

/** Slot content made of @expo/ui components, e.g. an `<Icon>`. */
export function NativeAccessory({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "ios") {
    return <Host matchContents>{children}</Host>
  }
  return <>{children}</>
}
