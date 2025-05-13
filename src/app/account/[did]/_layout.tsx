import { createContext, use } from "react"
import { Platform } from "react-native"
import { SystemBars } from "react-native-edge-to-edge"
import { Redirect, Stack, useLocalSearchParams } from "expo-router"
import { Agent } from "@atproto/api"

import { coolTitleEffect } from "#/components/header"
import { useAccounts } from "#/lib/accounts"

const AgentContext = createContext<Agent | null>(null)

export default function AddAccountLayout() {
  const { did } = useLocalSearchParams<{ did: string }>()
  const accounts = useAccounts()

  const agent = accounts?.find((acc) => acc.did === did)?.agent

  if (!agent) {
    return <Redirect href="../" />
  }

  if (accounts)
    return (
      <>
        {Platform.OS === "ios" && <SystemBars style={{ statusBar: "light" }} />}
        <AgentContext value={agent}>
          <Stack screenOptions={coolTitleEffect}>
            <Stack.Screen
              name="manage-keys"
              options={{
                title: "Manage keys",
              }}
            />
            <Stack.Screen
              name="add-key"
              options={{
                title: "Add rotation key",
                presentation: "formSheet",
                sheetAllowedDetents: [0.5],
                sheetGrabberVisible: true,
              }}
            />
          </Stack>
        </AgentContext>
      </>
    )
}

export function useAgent() {
  return use(AgentContext)
}
