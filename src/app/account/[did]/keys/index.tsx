import { ActivityIndicator, Alert, Share, StyleSheet, View } from "react-native"
import { useRouter } from "expo-router"
import { FieldGroup, Host, ListItem, Text } from "@expo/ui"
import { useMutation, useQuery } from "@tanstack/react-query"

import { ActionRow, monospace } from "#/components/rows"
import { SheetCloseButton } from "#/components/sheet-close-button"
import { WithCurrentAccount, type SignedInAccount } from "#/lib/accounts"
import { getPrivateKey } from "#/lib/keys"
import { useIdentityQuery } from "#/lib/plc"

/** The PLC spec allows at most 5 rotation keys. */
const MAX_ROTATION_KEYS = 5

export default function ManageKeysScreen() {
  return (
    <>
      <SheetCloseButton placement="right" label="Done" />
      <WithCurrentAccount>
        {(account) => <KeyList account={account} />}
      </WithCurrentAccount>
    </>
  )
}

function KeyList({ account }: { account: SignedInAccount }) {
  const { did, agent, localKeys } = account
  const router = useRouter()
  const { data: identity } = useIdentityQuery(did)

  const { data: recommended } = useQuery({
    queryKey: ["recommended-did-creds", did],
    queryFn: async () => {
      const res =
        await agent.com.atproto.identity.getRecommendedDidCredentials()
      return res.data
    },
  })

  const requestSignature = useMutation({
    mutationFn: () => agent.com.atproto.identity.requestPlcOperationSignature(),
    onSuccess: () => router.push(`/account/${did}/keys/add`),
    onError: (err) => Alert.alert("Could not request a code", err.message),
  })

  if (!identity || !recommended) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  const rotationKeys = identity.plcData.rotationKeys

  return (
    <Host style={styles.flex}>
      <FieldGroup>
        {rotationKeys.map((key, i) => {
          const isLocal = localKeys.includes(key)
          const isPds = !!recommended.rotationKeys?.includes(key)
          return (
            <FieldGroup.Section
              key={key}
              title={i === 0 ? "Key #1 (highest priority)" : `Key #${i + 1}`}
            >
              <ListItem>
                <Text textStyle={{ fontSize: 13, fontFamily: monospace }}>
                  {key}
                </Text>
                {(isLocal || isPds) && (
                  <ListItem.Supporting>
                    {isLocal ? "Stored on this device" : "Managed by your PDS"}
                  </ListItem.Supporting>
                )}
              </ListItem>
              {isLocal && (
                <ActionRow
                  title="Export private key"
                  onPress={() => exportPrivateKey(key)}
                />
              )}
            </FieldGroup.Section>
          )
        })}
        {rotationKeys.length < MAX_ROTATION_KEYS && (
          <FieldGroup.Section>
            <ActionRow
              title="Add a rotation key"
              onPress={() => requestSignature.mutate()}
              loading={requestSignature.isPending}
            />
            <FieldGroup.SectionFooter>
              <Text>
                Creates a new key on this device and adds it to your identity
                with top priority, so you can recover your account even if your
                PDS disappears. Your PDS will email you a confirmation code.
              </Text>
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>
        )}
      </FieldGroup>
    </Host>
  )
}

function exportPrivateKey(key: string) {
  Alert.alert(
    "Be careful with your keys",
    "Anyone with this private key can take control of your identity. Only export it if you know what you're doing.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Export",
        style: "destructive",
        onPress: async () => {
          try {
            const privateKey = await getPrivateKey(key)
            if (privateKey) {
              await Share.share({ message: privateKey })
            } else {
              Alert.alert("Key not found on this device")
            }
          } catch (err) {
            console.error(err)
            Alert.alert("Could not read the key")
          }
        },
      },
    ],
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
})
