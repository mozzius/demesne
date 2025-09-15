import { useMemo } from "react"
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  View,
} from "react-native"
import {
  Directory,
  DirectoryInfo,
  File,
  FileInfo,
  Paths,
} from "expo-file-system"
import { useLocales } from "expo-localization"
import { CredentialSession } from "@atproto/api"
import { useTheme } from "@react-navigation/native"
import { useMutation, useQuery } from "@tanstack/react-query"
import { DatabaseIcon } from "lucide-react-native"

import { Button } from "#/components/button"
import { EmptyState } from "#/components/empty-state"
import { ScrollView, Text } from "#/components/views"
import { useAccount } from "#/lib/accounts"
import { useActionSheet } from "#/lib/action-sheet"

export default function BackupScreen() {
  const { did, agent } = useAccount()

  const { data: backups, refetch } = useQuery({
    queryKey: ["backups", did],
    queryFn: () => {
      const dir = new Directory(Paths.document, did, "backups")
      if (!dir.exists) {
        return []
      }
      const list = dir.list()
      const listWithInfo = list.map((file) => ({ file, info: file.info() }))
      listWithInfo.sort(sortByTime)
      return listWithInfo
    },
  })

  const { mutate: downloadCar, isPending } = useMutation({
    mutationFn: async () => {
      const dir = new Directory(Paths.document, did, "backups")
      if (!dir.exists) {
        dir.create({ intermediates: true, idempotent: true })
      }

      const url = `${(agent.sessionManager as CredentialSession).serviceUrl}xrpc/com.atproto.sync.getRepo?did=${did}`
      return await File.downloadFileAsync(
        url,
        new File(
          Paths.document,
          did,
          "backups",
          new Date().toISOString() + ".car",
        ),
      )
    },
    onSettled: () => refetch(),
    onError: (error) => console.error(error),
  })

  const [locale] = useLocales()
  const formatter = useMemo(() => {
    return new Intl.NumberFormat(locale.languageTag, {
      notation: "compact",
      style: "unit",
      unit: "megabyte",
      unitDisplay: "short",
    })
  }, [locale])

  return (
    <ScrollView>
      {backups ? (
        <View style={styles.container}>
          {backups.length === 0 ? (
            <EmptyState icon={DatabaseIcon} text="No backups yet">
              <Button
                title="Create a backup"
                onPress={() => downloadCar()}
                loading={isPending}
              />
            </EmptyState>
          ) : (
            <>
              <Button
                title="New backup"
                onPress={() => downloadCar()}
                loading={isPending}
              />
              {backups.map((backup) => (
                <BackupCard
                  key={backup.file.uri}
                  backup={backup}
                  refetch={refetch}
                  formatter={formatter}
                />
              ))}
            </>
          )}
        </View>
      ) : (
        <View style={styles.spinner}>
          <ActivityIndicator />
        </View>
      )}
    </ScrollView>
  )
}

function BackupCard({
  backup,
  refetch,
  formatter,
}: {
  backup: { file: File | Directory; info: FileInfo | DirectoryInfo }
  refetch: () => void
  formatter: Intl.NumberFormat
}) {
  const theme = useTheme()
  const [ref, showActionSheet] = useActionSheet()

  return (
    <Pressable
      ref={ref}
      key={backup.file.uri}
      style={[styles.card, { backgroundColor: theme.colors.card }]}
      onPress={() => Share.share({ url: backup.file.uri, title: "repo.car" })}
      onLongPress={async () => {
        const action = await showActionSheet({
          options: [{ item: "Delete backup", destructive: true }] as const,
        })
        if (action?.item === "Delete backup") {
          backup.file.delete()
          refetch()
        }
      }}
    >
      <Text style={{ fontWeight: 500 }}>{backup.file.name}</Text>
      {typeof backup.file.size === "number" && (
        <Text color="secondary">
          {formatter.format(Math.round(backup.file.size / (1000 * 1000)))}
        </Text>
      )}
    </Pressable>
  )
}

function sortByTime(a: { info: FileInfo }, b: { info: FileInfo }) {
  return (
    (b.info.creationTime ?? b.info.modificationTime ?? 0) -
    (a.info.creationTime ?? a.info.modificationTime ?? 0)
  )
}

const styles = StyleSheet.create({
  spinner: {
    flex: 1,
    paddingTop: 200,
    alignContent: "center",
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  card: {
    padding: 12,
    borderRadius: 12,
    borderCurve: "continuous",
    gap: 4,
  },
  line: {
    width: "100%",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
