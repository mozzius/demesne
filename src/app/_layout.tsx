import { useColorScheme } from "react-native"
import { Stack } from "expo-router"
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { Provider as PQueueProvider } from "#/lib/p-queue"
import { Provider as TldListProvider } from "#/lib/tld-list"

const coolLargeTitleEffect = {
  headerLargeTitle: true,
  headerShadowVisible: true,
  headerLargeTitleShadowVisible: false,
  headerTransparent: true,
  headerBlurEffect: "systemChromeMaterial",
  headerLargeStyle: {
    backgroundColor: "transparent",
  },
} as const

const queryClient = new QueryClient()

export default function RootLayout() {
  const scheme = useColorScheme()

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
        <TldListProvider>
          <PQueueProvider>
            <Stack>
              <Stack.Screen
                name="index"
                options={{
                  title: "Demesne",
                  ...coolLargeTitleEffect,
                }}
              />
            </Stack>
          </PQueueProvider>
        </TldListProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
