import { useState } from "react"
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native"
import { Image } from "expo-image"
import { Link, useRouter } from "expo-router"
import { AppBskyActorDefs } from "@atproto/api"
import { useTheme } from "@react-navigation/native"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { CastleIcon } from "lucide-react-native"

import { Button } from "#/components/button"
import { EmptyState } from "#/components/empty-state"
import { ScrollView, Text } from "#/components/views"
import {
  Account,
  useAccounts,
  useRemoveAccount,
  useResumeSession,
} from "#/lib/accounts"
import { showActionSheet } from "#/lib/action-sheet"
import { publicAgent } from "#/lib/agent"

export default function IndexScreen() {
  const accounts = useAccounts()

  const dids = accounts?.map((x) => x.did) ?? []
  const { data: profiles } = useQuery({
    queryKey: ["get-profiles", dids],
    queryFn: async () => {
      const res = await publicAgent.getProfiles({ actors: dids })
      return res.data
    },
    placeholderData: keepPreviousData,
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
              <AccountCard
                key={account.did}
                account={account}
                profile={profile}
              />
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

function AccountCard({
  account,
  profile,
}: {
  account: Account
  profile?: AppBskyActorDefs.ProfileViewDetailed
}) {
  const theme = useTheme()
  const router = useRouter()
  const resumeSession = useResumeSession()
  const removeAccount = useRemoveAccount()
  const [isResuming, setIsResuming] = useState(false)

  return (
    <Pressable
      style={[styles.card, { backgroundColor: theme.colors.card }]}
      onPress={async () => {
        if (account.agent) {
          router.navigate(`/account/${account.did}/manage-keys`)
        } else {
          setIsResuming(true)
          try {
            await resumeSession(account.did)
            router.navigate(`/account/${account.did}/manage-keys`)
          } catch (err) {
            console.error(err)
            router.navigate(
              profile ? `/login?handle=${profile.handle}` : "/login",
            )
          } finally {
            setIsResuming(false)
          }
        }
      }}
      onLongPress={async () => {
        if (
          await showActionSheet({
            options: [
              {
                item: "Remove account",
                destructive: true,
              },
            ],
          })
        ) {
          removeAccount(account.did)
        }
      }}
    >
      {profile ? (
        <View style={styles.profileRow}>
          <Image style={styles.avi} source={profile.avatar} />
          <Text style={styles.handle} numberOfLines={1}>
            {profile.handle}
          </Text>
          {isResuming && <ActivityIndicator size="small" />}
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
      <View style={[styles.line, { borderColor: theme.colors.border }]} />
      <Text color="secondary">{account.did}</Text>
    </Pressable>
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
    flex: 1,
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
