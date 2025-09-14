import { StyleSheet } from "react-native"
import { Link, Stack } from "expo-router"

import { Button } from "#/components/button"
import { ScrollView } from "#/components/views"
import { useAccount } from "#/lib/accounts"
import { useProfileQuery } from "#/lib/queries"

export default function AccountScreen() {
  const { did } = useAccount()
  const { data: profile } = useProfileQuery(did)

  return (
    <>
      <Stack.Screen options={{ title: profile?.handle ?? "" }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Link href={`/account/${did}/keys`} asChild>
          <Button title="Keys" />
        </Link>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
  },
})
