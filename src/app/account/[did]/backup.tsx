import { useMemo } from "react"
import { ActivityIndicator, Alert, Share, StyleSheet, View } from "react-native"
import { Directory, File, Paths } from "expo-file-system"
import { useLocales } from "expo-localization"
import { Button, FieldGroup, Host, ListItem, Text } from "@expo/ui"
import { useMutation, useQuery } from "@tanstack/react-query"

import { EmptyState } from "#/components/empty-state"
import { Icons } from "#/components/icons"
import { ActionRow } from "#/components/rows"
import { WithCurrentAccount, type SignedInAccount } from "#/lib/accounts"

export default function BackupScreen() {
  return (
    <WithCurrentAccount>
      {(account) => <Backups account={account} />}
    </WithCurrentAccount>
  )
}

function backupDirectory(did: string) {
  return new Directory(Paths.document, did, "backups")
}

function Backups({
  account: { did, serviceUrl },
}: {
  account: SignedInAccount
}) {
  const backups = useQuery({
    queryKey: ["backups", did],
    queryFn: () => {
      const dir = backupDirectory(did)
      if (!dir.exists) return []
      return dir
        .list()
        .filter((entry): entry is File => entry instanceof File)
        .map((file) => ({ file, info: file.info() }))
        .sort(
          (a, b) =>
            (b.info.creationTime ?? b.info.modificationTime ?? 0) -
            (a.info.creationTime ?? a.info.modificationTime ?? 0),
        )
    },
  })

  const createBackup = useMutation({
    mutationFn: async () => {
      const dir = backupDirectory(did)
      dir.create({ intermediates: true, idempotent: true })

      const url = new URL("/xrpc/com.atproto.sync.getRepo", serviceUrl)
      url.searchParams.set("did", did)

      const name = new Date().toISOString().replaceAll(":", "-") + ".car"
      return await File.downloadFileAsync(url.toString(), new File(dir, name))
    },
    onSettled: () => backups.refetch(),
    onError: (err) => {
      console.error(err)
      Alert.alert("Backup failed", err.message)
    },
  })

  const [locale] = useLocales()
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale?.languageTag, {
        style: "unit",
        unit: "megabyte",
        unitDisplay: "short",
        maximumFractionDigits: 1,
      }),
    [locale],
  )

  if (!backups.data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    )
  }

  if (backups.data.length === 0) {
    return (
      <EmptyState
        icon={Icons.database}
        title="No backups yet"
        subtitle="Download a copy of your repo to keep on this device"
      >
        <Button
          label={createBackup.isPending ? "Backing up…" : "Create a backup"}
          disabled={createBackup.isPending}
          onPress={() => createBackup.mutate()}
        />
      </EmptyState>
    )
  }

  const confirmDelete = (file: File) =>
    Alert.alert("Delete backup?", file.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          file.delete()
          void backups.refetch()
        },
      },
    ])

  const showOptions = (file: File) =>
    Alert.alert(file.name, undefined, [
      {
        text: "Share",
        onPress: () => Share.share({ url: file.uri, title: file.name }),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => confirmDelete(file),
      },
      { text: "Cancel", style: "cancel" },
    ])

  return (
    <Host style={styles.flex}>
      <FieldGroup>
        <FieldGroup.Section>
          <ActionRow
            title="New backup"
            onPress={() => createBackup.mutate()}
            loading={createBackup.isPending}
          />
        </FieldGroup.Section>
        <FieldGroup.Section title="Saved backups">
          {backups.data.map(({ file }) => (
            <ListItem key={file.uri} onPress={() => showOptions(file)}>
              <Text>{file.name}</Text>
              <ListItem.Supporting>
                {formatter.format(file.size / 1_000_000)}
              </ListItem.Supporting>
            </ListItem>
          ))}
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
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
