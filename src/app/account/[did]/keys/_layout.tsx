import { Platform } from "react-native"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"

export default function KeysLayout() {
  return (
    <>
      {/* iOS page sheets sit on a dimmed backdrop, so use light status bar text */}
      {Platform.OS === "ios" && <StatusBar style="light" />}
      <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
        <Stack.Screen name="index" options={{ title: "Rotation keys" }} />
        <Stack.Screen name="add" options={{ title: "Add rotation key" }} />
      </Stack>
    </>
  )
}
