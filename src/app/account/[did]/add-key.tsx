import { useState } from "react"
import { StyleSheet, View } from "react-native"

import { Button } from "#/components/button"
import { InputGroup, TextField } from "#/components/text-field"
import { ScrollView, Text } from "#/components/views"

export default function AddKeyScreen() {
  const [token, setToken] = useState("")

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
        <Button title="Create new key" disabled={!token} />
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
