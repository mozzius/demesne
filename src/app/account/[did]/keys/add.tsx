import { useState } from "react"
import { Alert, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { Secp256k1Keypair } from "@atproto/crypto"
import { FieldGroup, Host, Text, TextInput } from "@expo/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import base64 from "base64-js"

import { ActionRow } from "#/components/rows"
import {
  useAccountActions,
  WithCurrentAccount,
  type SignedInAccount,
} from "#/lib/accounts"
import { storePrivateKey } from "#/lib/keys"
import { useIdentityQuery } from "#/lib/plc"

export default function AddKeyScreen() {
  return (
    <WithCurrentAccount>
      {(account) => <AddKeyForm account={account} />}
    </WithCurrentAccount>
  )
}

function AddKeyForm({ account: { did, agent } }: { account: SignedInAccount }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { saveKey } = useAccountActions()
  const { data: identity } = useIdentityQuery(did)
  const [token, setToken] = useState("")

  const createKey = useMutation({
    mutationFn: async () => {
      if (!identity) throw new Error("Identity not loaded yet")

      const keypair = await Secp256k1Keypair.create({ exportable: true })
      const publicKey = keypair.did()
      const privateKey = base64.fromByteArray(await keypair.export())

      // Make sure the private key is safely stored *before* it's added to
      // the identity, so we can never end up with a key we don't have.
      await storePrivateKey(publicKey, privateKey)
      await saveKey(did, publicKey)

      const signed = await agent.com.atproto.identity.signPlcOperation({
        rotationKeys: [publicKey, ...identity.plcData.rotationKeys],
        token: token.trim(),
      })
      await agent.com.atproto.identity.submitPlcOperation({
        operation: signed.data.operation,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["identity"] })
      await queryClient.invalidateQueries({ queryKey: ["audit", did] })
      router.back()
    },
    onError: (err) => {
      console.error(err)
      Alert.alert("Could not add key", err.message)
    },
  })

  const submit = () => {
    if (token.trim() && identity && !createKey.isPending) createKey.mutate()
  }

  return (
    <Host style={styles.flex}>
      <FieldGroup>
        <FieldGroup.Section>
          <TextInput
            placeholder="Confirmation code"
            autoComplete="one-time-code"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="go"
            onChangeText={setToken}
            onSubmitEditing={submit}
          />
          <FieldGroup.SectionFooter>
            <Text>
              Your PDS has emailed you a code to confirm this change. Enter it
              here.
            </Text>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>
        <FieldGroup.Section>
          <ActionRow
            title="Create key"
            onPress={submit}
            disabled={!token.trim() || !identity}
            loading={createKey.isPending}
          />
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
})
