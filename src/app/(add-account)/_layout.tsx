import { createContext, use, useState } from "react"
import { Platform } from "react-native"
import { SystemBars } from "react-native-edge-to-edge"
import { Stack } from "expo-router"
import { Agent } from "@atproto/api"

import { coolTitleEffect } from "#/components/header"

export const unstable_settings = {
  initialRouteName: "login",
}

const AgentContext = createContext<Agent | null>(null)
const SetAgentContext = createContext<(agent: Agent) => void>(() => {})

export default function AddAccountLayout() {
  const [agent, setAgent] = useState<Agent | null>(null)

  return (
    <>
      {Platform.OS === "ios" && <SystemBars style={{ statusBar: "light" }} />}
      <AgentContext value={agent}>
        <SetAgentContext value={setAgent}>
          <Stack screenOptions={coolTitleEffect}>
            <Stack.Screen
              name="login"
              options={{
                title: "Add account",
              }}
            />
            <Stack.Screen
              name="manage-keys"
              options={{
                title: "Manage keys",
              }}
            />
          </Stack>
        </SetAgentContext>
      </AgentContext>
    </>
  )
}

export function useAgent() {
  return use(AgentContext)
}

export function useSetAgent() {
  return use(SetAgentContext)
}
