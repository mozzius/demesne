import "react-native-get-random-values"

import { useColorScheme } from "react-native"
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { AccountProvider } from "#/lib/accounts"

export const unstable_settings = {
  initialRouteName: "index",
}

const queryClient = new QueryClient()

export default function RootLayout() {
  const scheme = useColorScheme()

  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <AccountProvider>
          <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
            <Stack.Screen
              name="index"
              options={{ title: "My accounts", headerLargeTitleEnabled: true }}
            />
            <Stack.Screen
              name="account/[did]/index"
              options={{ title: "", headerLargeTitleEnabled: true }}
            />
            <Stack.Screen
              name="account/[did]/backup"
              options={{ title: "Backups", headerLargeTitleEnabled: true }}
            />
            <Stack.Screen
              name="account/[did]/keys"
              options={{ headerShown: false, presentation: "modal" }}
            />
            <Stack.Screen
              name="login"
              options={{ title: "Sign in", presentation: "modal" }}
            />
          </Stack>
        </AccountProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
