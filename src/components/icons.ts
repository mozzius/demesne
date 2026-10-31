import { Icon } from "@expo/ui"

/**
 * Cross-platform icon names: SF Symbols on iOS, Material Symbols on Android.
 */
export const Icons = {
  castle: Icon.select({
    ios: "building.columns",
    android: import("@expo/material-symbols/castle.xml"),
  }),
  key: Icon.select({
    ios: "key.fill",
    android: import("@expo/material-symbols/key.xml"),
  }),
  database: Icon.select({
    ios: "externaldrive.fill",
    android: import("@expo/material-symbols/database.xml"),
  }),
  chevron: Icon.select({
    ios: "chevron.right",
    android: import("@expo/material-symbols/chevron_right.xml"),
  }),
}
