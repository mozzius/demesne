import { ActivityIndicator, StyleSheet, View } from "react-native"
import { Image } from "expo-image"
import { Link } from "expo-router"
import { useTheme } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import { CastleIcon } from "lucide-react-native"

import { Button } from "#/components/button"
import { EmptyState } from "#/components/empty-state"
import { ScrollView, Text } from "#/components/views"
import { useAccounts } from "#/lib/accounts"
import { publicAgent } from "#/lib/agent"

export default function IndexScreen() {
  const theme = useTheme()

  const accounts = useAccounts()

  const dids = accounts?.map((x) => x.did) ?? []
  const { data: profiles } = useQuery({
    queryKey: ["get-profiles", dids],
    queryFn: async () => {
      const res = await publicAgent.getProfiles({ actors: dids })
      return res.data
    },
  })

  return (
    <ScrollView>
      {!accounts ? (
        <View style={styles.spinner}>
          <ActivityIndicator />
        </View>
      ) : accounts.length > 0 ? (
        <View style={styles.container}>
          {accounts.map((account) => {
            const profile = profiles?.profiles.find(
              (p) => p.did === account.did,
            )
            return (
              <View
                key={account.did}
                style={[styles.card, { backgroundColor: theme.colors.card }]}
              >
                {profile ? (
                  <View style={styles.profileRow}>
                    <Image style={styles.avi} source={profile.avatar} />
                    <Text style={styles.handle}>{profile.handle}</Text>
                  </View>
                ) : (
                  <View
                    style={{
                      height: 16,
                      width: 150,
                      backgroundColor: theme.colors.background,
                      borderRadius: 4,
                      marginVertical: 2,
                    }}
                  />
                )}
                <View
                  style={[styles.line, { borderColor: theme.colors.border }]}
                />
                <Text color="secondary">{account.did}</Text>
              </View>
            )
          })}
          <Link asChild href="/login">
            <Button title="Add another account" />
          </Link>
        </View>
      ) : (
        <EmptyState
          icon={CastleIcon}
          text="Welcome to Demesne!"
          subText="Keep your PLC keys close to home"
        >
          <Link asChild href="/login">
            <Button title="Add account" />
          </Link>
        </EmptyState>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  spinner: {
    flex: 1,
    paddingTop: 200,
    alignContent: "center",
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
  line: {
    width: "100%",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avi: {
    height: 20,
    width: 20,
    borderRadius: 6,
    borderCurve: "continuous",
  },
  handle: {
    fontSize: 16,
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
