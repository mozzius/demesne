import {
  ActivityIndicator,
  Alert,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"
import { Stack, useRouter } from "expo-router"
import * as SecureStore from "expo-secure-store"
import { useTheme } from "@react-navigation/native"
import { useMutation, useQuery } from "@tanstack/react-query"

import { Button } from "#/components/button"
import { useSheetCloseButton } from "#/components/header-buttons"
import { ScrollView, Text } from "#/components/views"
import { useAccount } from "#/lib/accounts"
import { useActionSheet } from "#/lib/action-sheet"
import { useIdentityQuery } from "#/lib/agent"

export default function ManageKeysScreen() {
  const { did, agent, localKeys } = useAccount()
  const headerRight = useSheetCloseButton("Done", "bold")
  const router = useRouter()

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
    onSuccess: () => router.push(`/account/${did}/keys/add`),
  })

  return (
    <>
      <Stack.Screen options={{ headerRight }} />
      <ScrollView contentContainerStyle={styles.container}>
        {identity && recommendedCredentials ? (
          <>
            {identity?.plcData.rotationKeys?.map((key, i) => (
              <RotationKeyCard
                key={key}
                rotationKey={key}
                index={i}
                isLocalKey={localKeys.includes(key)}
                isPDSKey={!!recommendedCredentials.rotationKeys?.includes(key)}
              />
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
    </>
  )
}

function RotationKeyCard({
  rotationKey: key,
  index,
  isLocalKey,
  isPDSKey,
}: {
  rotationKey: string
  index: number
  isLocalKey: boolean
  isPDSKey: boolean
}) {
  const theme = useTheme()
  const [ref, showActionSheet] = useActionSheet()

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <View style={styles.row}>
        <Text style={styles.bold}>Key #{index + 1}</Text>

        {isLocalKey && (
          <TouchableOpacity
            ref={ref}
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
              style={[styles.badge, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={styles.badgeText} color="white">
                Stored on device
              </Text>
            </View>
          </TouchableOpacity>
        )}
        {isPDSKey && (
          <View style={[styles.badge, { borderColor: theme.colors.border }]}>
            <Text style={styles.badgeText}>PDS key</Text>
          </View>
        )}
      </View>
      <View style={[styles.key, { borderColor: theme.colors.border }]}>
        <Text>{key}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  spinner: {
    flex: 1,
    paddingTop: 200,
    alignItems: "center",
  },
  container: {
    paddingHorizontal: 16,
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
