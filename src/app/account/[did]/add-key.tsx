import { useState } from "react"
import { StyleSheet, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import * as SecureStore from "expo-secure-store"
import { Secp256k1Keypair } from "@atproto/crypto"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import base64 from "base64-js"

import { Button } from "#/components/button"
import { InputGroup, TextField } from "#/components/text-field"
import { ScrollView, Text } from "#/components/views"
import { useSaveKey } from "#/lib/accounts"
import { useIdentityQuery } from "#/lib/agent"

import { useAgent } from "./_layout"

export default function AddKeyScreen() {
  const agent = useAgent()
  const router = useRouter()
  const [token, setToken] = useState("")
  const queryClient = useQueryClient()
  const { did } = useLocalSearchParams<{ did: string }>()
  const { data: identity } = useIdentityQuery(did)
  const saveKey = useSaveKey()

  const { mutate: createKey, isPending: isCreating } = useMutation({
    mutationFn: async () => {
      if (!agent) throw new Error("no agent")
      if (!identity) throw new Error("no plcData")
      if (!token) throw new Error("no token")

      const key = await Secp256k1Keypair.create({ exportable: true })
      const pubkey = key.did()
      const privkey = base64.fromByteArray(await key.export())

      SecureStore.setItemAsync(pubkey, privkey)

      const rotationKeys = [pubkey, ...identity.plcData.rotationKeys]

      const signedOp = await agent.com.atproto.identity.signPlcOperation({
        rotationKeys,
        token: token.trim(),
      })

      await agent.com.atproto.identity.submitPlcOperation({
        operation: signedOp.data.operation,
      })

      return pubkey
    },
    onSuccess: (key) => {
      saveKey(did, key)
      queryClient.invalidateQueries({ queryKey: ["identity"] })
      router.dismiss()
    },
  })

  return (
    <ScrollView>
      <View style={styles.container}>
        <Text color="secondary" style={styles.info}>
          A code has been sent to your email. Enter it here.
        </Text>
        <InputGroup>
          <TextField
            placeholder="Email token"
            value={token}
            onChangeText={setToken}
          />
        </InputGroup>
        <Button
          title="Create new key"
          disabled={!token || !identity}
          onPress={() => createKey()}
          loading={isCreating}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
    justifyContent: "space-between",
    gap: 12,
  },
  info: {
    paddingHorizontal: 12,
    flex: 1,
    textAlign: "center",
  },
})
