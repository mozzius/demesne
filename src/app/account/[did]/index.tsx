import { useMemo } from "react"
import { StyleSheet } from "react-native"
import { useLocales } from "expo-localization"
import { Stack, useRouter } from "expo-router"
import { FieldGroup, Host, Icon, ListItem, Text } from "@expo/ui"
import { dequal } from "dequal"

import { NativeAccessory } from "#/components/accessory"
import { Icons } from "#/components/icons"
import { useAccountActions, WithCurrentAccount } from "#/lib/accounts"
import { useAuditLogQuery, type AuditRecord } from "#/lib/plc"
import { useProfileQuery } from "#/lib/queries"

export default function AccountScreen() {
  return (
    <WithCurrentAccount>
      {(account) => <AccountDetails did={account.did} />}
    </WithCurrentAccount>
  )
}

function AccountDetails({ did }: { did: string }) {
  const router = useRouter()
  const { removeAccount } = useAccountActions()
  const { data: profile } = useProfileQuery(did)
  const audit = useAuditLogQuery(did)

  const [locale] = useLocales()
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale?.languageTag, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale],
  )

  const entries = useMemo(() => {
    if (!audit.data) return []
    const byCid = new Map(audit.data.map((record) => [record.cid, record]))
    return audit.data.toReversed().map((record) => ({
      record,
      changes: describeOperation(
        record,
        record.operation.prev ? byCid.get(record.operation.prev) : undefined,
      ),
    }))
  }, [audit.data])

  return (
    <>
      <Stack.Screen options={{ title: profile?.handle ?? "" }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="ellipsis" accessibilityLabel="More">
          <Stack.Toolbar.MenuAction
            icon="rectangle.portrait.and.arrow.right"
            destructive
            onPress={() => {
              router.dismissTo("/")
              void removeAccount(did)
            }}
          >
            Remove account
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      <Host style={styles.flex}>
        <FieldGroup>
          <FieldGroup.Section>
            <NavRow
              icon={Icons.key}
              title="Rotation keys"
              onPress={() => router.push(`/account/${did}/keys`)}
            />
            <NavRow
              icon={Icons.database}
              title="Repo backups"
              onPress={() => router.push(`/account/${did}/backup`)}
            />
          </FieldGroup.Section>
          <FieldGroup.Section title="Audit log">
            {audit.isPending ? (
              <ListItem>Loading…</ListItem>
            ) : audit.isError ? (
              <ListItem onPress={() => audit.refetch()}>
                Failed to fetch audit log. Tap to retry.
              </ListItem>
            ) : (
              entries.map(({ record, changes }) => (
                <ListItem key={record.cid}>
                  <Text textStyle={{ fontWeight: "600" }}>
                    {(record.nullified ? "[Nullified] " : "") +
                      changes.map((c) => c.title).join(", ")}
                  </Text>
                  <ListItem.Supporting>
                    {[
                      formatter.format(new Date(record.createdAt)),
                      ...changes.flatMap((c) => (c.detail ? [c.detail] : [])),
                    ].join("\n")}
                  </ListItem.Supporting>
                </ListItem>
              ))
            )}
          </FieldGroup.Section>
        </FieldGroup>
      </Host>
    </>
  )
}

function NavRow({
  icon,
  title,
  onPress,
}: {
  icon: React.ComponentProps<typeof Icon>["name"]
  title: string
  onPress: () => void
}) {
  return (
    <ListItem onPress={onPress}>
      <ListItem.Leading>
        <NativeAccessory>
          <Icon name={icon} size={20} />
        </NativeAccessory>
      </ListItem.Leading>
      {title}
      <ListItem.Trailing>
        <NativeAccessory>
          <Icon name={Icons.chevron} size={14} color="gray" />
        </NativeAccessory>
      </ListItem.Trailing>
    </ListItem>
  )
}

type Change = { title: string; detail?: string }

function describeOperation(record: AuditRecord, prev?: AuditRecord): Change[] {
  const op = record.operation
  if (op.type === "plc_tombstone") return [{ title: "Identity tombstoned" }]
  if (op.type === "create" || !prev) return [{ title: "Identity created" }]

  const prevOp = prev.operation
  if (prevOp.type !== "plc_operation") return [{ title: "Identity updated" }]

  const changes: Change[] = []
  for (const key of op.rotationKeys) {
    if (!prevOp.rotationKeys.includes(key)) {
      changes.push({ title: "Rotation key added", detail: key })
    }
  }
  for (const key of prevOp.rotationKeys) {
    if (!op.rotationKeys.includes(key)) {
      changes.push({ title: "Rotation key removed", detail: key })
    }
  }
  if (!dequal(op.alsoKnownAs, prevOp.alsoKnownAs)) {
    changes.push({
      title: "Handle changed",
      detail: `${formatAka(prevOp.alsoKnownAs)} → ${formatAka(op.alsoKnownAs)}`,
    })
  }
  if (!dequal(op.verificationMethods, prevOp.verificationMethods)) {
    changes.push({
      title: "Signing key changed",
      detail: op.verificationMethods.atproto,
    })
  }
  if (!dequal(op.services, prevOp.services)) {
    changes.push({
      title: "PDS changed",
      detail: op.services?.atproto_pds?.endpoint,
    })
  }
  return changes.length > 0 ? changes : [{ title: "No changes" }]
}

function formatAka(alsoKnownAs: string[]) {
  return alsoKnownAs.map((aka) => aka.replace("at://", "@")).join(", ")
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
})
