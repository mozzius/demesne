import { useColorScheme } from "react-native"
import { Stack } from "expo-router"
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { coolLargeTitleEffect, coolTitleEffect } from "#/components/header"
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
          <Stack>
            <Stack.Screen
              name="index"
              options={{
                title: "My Accounts",
                ...coolLargeTitleEffect,
              }}
            />
            <Stack.Screen
              name="account/[did]"
              options={{
                headerShown: false,
                presentation: "modal",
              }}
            />
            <Stack.Screen
              name="login"
              options={{
                title: "Sign in",
                presentation: "modal",
                ...coolTitleEffect,
              }}
            />
          </Stack>
        </AccountProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
