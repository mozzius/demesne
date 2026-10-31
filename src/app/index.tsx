import { useState } from "react"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import type { AppBskyActorDefs } from "@atproto/api"
import { Button, FieldGroup, Host, Icon, ListItem, Row } from "@expo/ui"

import { NativeAccessory, RNAccessory } from "#/components/accessory"
import { EmptyState } from "#/components/empty-state"
import { Icons } from "#/components/icons"
import { ActionRow } from "#/components/rows"
import { useAccountActions, useAccounts, type Account } from "#/lib/accounts"
import { useAccountProfilesQuery } from "#/lib/queries"

export default function IndexScreen() {
  const router = useRouter()
  const accounts = useAccounts()
  const { data: profiles } = useAccountProfilesQuery()

  if (!accounts) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    )
  }

  if (accounts.length === 0) {
    return (
      <EmptyState
        icon={Icons.castle}
        title="Welcome to Demesne!"
        subtitle="Keep your PLC keys close to home"
      >
        <Button label="Add account" onPress={() => router.push("/login")} />
      </EmptyState>
    )
  }

  return (
    <Host style={styles.flex}>
      <FieldGroup>
        <FieldGroup.Section>
          {accounts.map((account) => (
            <AccountRow
              key={account.did}
              account={account}
              profile={profiles?.profiles.find((p) => p.did === account.did)}
            />
          ))}
        </FieldGroup.Section>
        <FieldGroup.Section>
          <ActionRow
            title="Add another account"
            onPress={() => router.push("/login")}
          />
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  )
}

function AccountRow({
  account,
  profile,
}: {
  account: Account
  profile?: AppBskyActorDefs.ProfileViewDetailed
}) {
  const router = useRouter()
  const { resumeSession } = useAccountActions()
  const [isResuming, setIsResuming] = useState(false)

  const open = async () => {
    if (account.agent) {
      router.push(`/account/${account.did}`)
      return
    }
    setIsResuming(true)
    try {
      await resumeSession(account.did)
      router.push(`/account/${account.did}`)
    } catch (err) {
      console.error(err)
      router.push(
        profile
          ? { pathname: "/login", params: { handle: profile.handle } }
          : "/login",
      )
    } finally {
      setIsResuming(false)
    }
  }

  return (
    <ListItem onPress={isResuming ? undefined : open}>
      <ListItem.Leading>
        <RNAccessory>
          <Image style={styles.avatar} source={profile?.avatar} />
        </RNAccessory>
      </ListItem.Leading>
      {profile?.handle ?? account.did}
      <ListItem.Supporting>{account.did}</ListItem.Supporting>
      <ListItem.Trailing>
        {isResuming ? (
          <RNAccessory>
            <ActivityIndicator size="small" />
          </RNAccessory>
        ) : (
          <NativeAccessory>
            <Row spacing={8} alignment="center">
              {account.localKeys.length > 0 && (
                <Icon
                  name={Icons.key}
                  size={16}
                  accessibilityLabel="Has a key stored on this device"
                />
              )}
              <Icon name={Icons.chevron} size={14} color="gray" />
            </Row>
          </NativeAccessory>
        )}
      </ListItem.Trailing>
    </ListItem>
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
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#8884",
  },
})
