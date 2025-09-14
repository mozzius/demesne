import { Platform } from "react-native"
import { SystemBars } from "react-native-edge-to-edge"
import { Stack } from "expo-router"

import { coolTitleEffect } from "#/components/header"

export default function KeysLayout() {
  return (
    <>
      {Platform.OS === "ios" && <SystemBars style={{ statusBar: "light" }} />}
      <Stack screenOptions={coolTitleEffect}>
        <Stack.Screen
          name="index"
          options={{
            title: "Manage keys",
          }}
        />
        <Stack.Screen
          name="add"
          options={{
            title: "Add rotation key",
            presentation: "formSheet",
            sheetAllowedDetents: [0.5],
            sheetGrabberVisible: true,
          }}
        />
      </Stack>
    </>
  )
}
