import { useColorScheme } from "react-native"
import { Stack } from "expo-router"
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { coolLargeTitleEffect } from "#/components/header"

export const unstable_settings = {
  initialRouteName: "index",
}

const queryClient = new QueryClient()

export default function RootLayout() {
  const scheme = useColorScheme()

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              title: "Demesne",
              ...coolLargeTitleEffect,
            }}
          />
          <Stack.Screen
            name="(add-account)"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
