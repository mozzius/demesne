import { Redirect } from "expo-router"
import { Agent } from "@atproto/api"
import { useQuery } from "@tanstack/react-query"

import { ScrollView } from "#/components/views"
import { DidDocument } from "#/lib/agent"

import { useAgent } from "./_layout"

export default function ManageKeysScreen() {
  const agent = useAgent()

  if (!agent || !agent.sessionManager.did) {
    return <Redirect href="/(add-account)/login" />
  }

  return <KeyManagement did={agent.sessionManager.did} agent={agent} />
}

function KeyManagement({ did, agent }: { did: string; agent: Agent }) {
  const { data: identity } = useQuery({
    queryKey: ["identity", did],
    queryFn: async () => {
      const res = await agent.com.atproto.identity.resolveIdentity()
      return {
        did: res.data.did,
        handle: res.data.handle,
        didDoc: res.data.didDoc as DidDocument,
      }
    },
  })

  const { data: keys } = useQuery({
    queryKey: ["rotation-keys", did],
    queryFn: async () => {
      const res =
        await agent.com.atproto.identity.getRecommendedDidCredentials()
      return res.data.rotationKeys
    },
  })
  return <ScrollView></ScrollView>
}
