import {
  ActivityIndicator,
  Alert,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"
import { Redirect, Stack, useRouter } from "expo-router"
import * as SecureStore from "expo-secure-store"
import { Agent } from "@atproto/api"
import { useTheme } from "@react-navigation/native"
import { useMutation, useQuery } from "@tanstack/react-query"

import { Button } from "#/components/button"
import { useSheetCloseButton } from "#/components/header-buttons"
import { ScrollView, Text } from "#/components/views"
import { useAccounts } from "#/lib/accounts"
import { showActionSheet } from "#/lib/action-sheet"
import { useIdentityQuery } from "#/lib/agent"

import { useAgent } from "./_layout"

export default function ManageKeysScreen() {
  const agent = useAgent()
  const headerRight = useSheetCloseButton("Done", "bold")

  if (!agent || !agent.sessionManager.did) {
    return <Redirect href="/" />
  }

  return (
    <>
      <Stack.Screen options={{ headerRight }} />
      <KeyManagement did={agent.sessionManager.did} agent={agent} />
    </>
  )
}

function KeyManagement({ did, agent }: { did: string; agent: Agent }) {
  const theme = useTheme()
  const router = useRouter()
  const accounts = useAccounts()

  const account = accounts?.find((acc) => acc.did === did)

  const { data: identity } = useIdentityQuery(did)

  const { data: recommendedCredentials } = useQuery({
    queryKey: ["recommended-did-creds", did],
    queryFn: async () => {
      const res =
        await agent.com.atproto.identity.getRecommendedDidCredentials()
      return res.data
    },
  })

  const { mutate: addKey, isPending: isAddingKey } = useMutation({
    mutationFn: async () => {
      await agent.com.atproto.identity.requestPlcOperationSignature()
    },
    onSuccess: () => router.push(`/account/${did}/add-key`),
  })

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {identity && recommendedCredentials ? (
        <>
          {identity?.plcData.rotationKeys?.map((key, i) => (
            <View
              style={[styles.card, { backgroundColor: theme.colors.card }]}
              key={key}
            >
              <View style={styles.row}>
                <Text style={styles.bold}>Key #{i + 1}</Text>

                {account?.localKeys.includes(key) && (
                  <TouchableOpacity
                    onPress={async () => {
                      const choice = await showActionSheet({
                        options: [{ item: "Retrieve key" }],
                      })
                      if (choice?.item === "Retrieve key") {
                        Alert.alert(
                          "Be careful with your keys",
                          "You are about to retrieve your private key. This can be really dangerous if anyone else gets their hands on it! Make sure you know what you're doing.",
                          [
                            {
                              text: "Continue",
                              style: "destructive",
                              onPress: () => {
                                const priv = SecureStore.getItem(
                                  key.replace("did:key:", ""),
                                  {
                                    requireAuthentication: !__DEV__,
                                  },
                                )
                                if (priv) {
                                  Share.share({ message: priv })
                                } else {
                                  Alert.alert("Cannot find key!")
                                }
                              },
                            },
                            {
                              text: "Cancel",
                              style: "cancel",
                            },
                          ],
                        )
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      <Text style={styles.badgeText} color="white">
                        Stored on device
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                {recommendedCredentials.rotationKeys?.includes(key) && (
                  <View
                    style={[styles.badge, { borderColor: theme.colors.border }]}
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
          {identity && identity.plcData.rotationKeys.length < 10 && (
            <Button
              title="Add additional key"
              onPress={() => addKey()}
              loading={isAddingKey}
            />
          )}
        </>
      ) : (
        <View style={styles.spinner}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  spinner: {
    flex: 1,
    paddingTop: 200,
    alignItems: "center",
  },
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  badgeText: {
    fontWeight: 500,
    fontSize: 12,
    lineHeight: 14,
  },
})
