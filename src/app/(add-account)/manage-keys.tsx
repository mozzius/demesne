import { ActivityIndicator, StyleSheet, View } from "react-native"
import { Redirect } from "expo-router"
import { Agent } from "@atproto/api"
import { useTheme } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"

import { Button } from "#/components/button"
import { ScrollView, Text } from "#/components/views"
import { useIdentityQuery } from "#/lib/agent"

import { useAgent } from "./_layout"

export default function ManageKeysScreen() {
  const agent = useAgent()

  if (!agent || !agent.sessionManager.did) {
    return <Redirect href="/(add-account)/login" />
  }

  return <KeyManagement did={agent.sessionManager.did} agent={agent} />
}

function KeyManagement({ did, agent }: { did: string; agent: Agent }) {
  const theme = useTheme()

  const { data: identity } = useIdentityQuery(did)

  const { data: recommendedCredentials } = useQuery({
    queryKey: ["recommended-did-creds", did],
    queryFn: async () => {
      const res =
        await agent.com.atproto.identity.getRecommendedDidCredentials()
      return res.data
    },
  })
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {identity && recommendedCredentials ? (
        <>
          {identity?.plcData.rotationKeys?.map((key, i) => (
            <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <View style={styles.row}>
                <Text style={styles.bold}>Key #{i + 1}</Text>

                {recommendedCredentials.rotationKeys?.includes(key) && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text style={styles.badgeText}>PDS key</Text>
                  </View>
                )}
              </View>
              <View style={[styles.key, { borderColor: theme.colors.border }]}>
                <Text>{key}</Text>
              </View>
            </View>
          ))}
          <Button title="Add additional key" />
        </>
      ) : (
        <ActivityIndicator />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
  },
  card: {
    padding: 12,
    borderRadius: 12,
    borderCurve: "continuous",
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  bold: {
    fontWeight: 500,
  },
  key: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    borderCurve: "continuous",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderCurve: "continuous",
  },
  badgeText: {
    color: "white",
    fontWeight: 500,
    fontSize: 12,
    lineHeight: 14,
  },
})
