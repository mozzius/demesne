import { Fragment, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native"
import Animated, { LinearTransition } from "react-native-reanimated"
import { useLocales } from "expo-localization"
import { Link, Stack } from "expo-router"
import { useTheme } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import { dequal } from "dequal"
import difference from "lodash.difference"
import { ArrowRightIcon, DatabaseIcon, KeyRoundIcon } from "lucide-react-native"

import { ScrollView, Text, useTextColor } from "#/components/views"
import { useAccount } from "#/lib/accounts"
import { useProfileQuery } from "#/lib/queries"

export type AuditRecord = {
  did: string
  operation:
    | {
        type: "create"
        signingKey: string
        recoveryKey: string
        handle: string
        service: string
        prev: string | null
        sig: string
      }
    | {
        type: "plc_operation"
        sig: string
        prev: string
        services: any
        alsoKnownAs: string[]
        rotationKeys: string[]
        verificationMethods: {
          atproto: string
        }
      }
    | {
        type: "plc_tombstone"
        sig: string
        prev: string
      }
  cid: string
  nullified: boolean
  createdAt: string
}

export default function AccountScreen() {
  const { did } = useAccount()
  const { data: profile, refetch: refetchProfile } = useProfileQuery(did)
  const [isPTR, setIsPTR] = useState(false)
  const theme = useTheme()

  const [locale] = useLocales()
  const formatter = useMemo(() => {
    return new Intl.DateTimeFormat(locale.languageTag, {
      dateStyle: "short",
      timeStyle: "short",
    })
  }, [locale])

  const {
    data: audit,
    isPending,
    isError,
    refetch: refetchAudit,
  } = useQuery({
    queryKey: ["audit", did],
    queryFn: async () => {
      const res = await fetch(`https://plc.directory/${did}/log/audit`)
      if (!res.ok) throw new Error("Failed to fetch audit log")
      return (await res.json()) as AuditRecord[]
    },
  })

  const refresh = async () => {
    setIsPTR(true)
    await Promise.all([refetchProfile, refetchAudit])
    try {
    } finally {
      setIsPTR(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: profile?.handle ?? "" }} />
      <ScrollView
        contentContainerStyle={[styles.container]}
        refreshControl={
          <RefreshControl refreshing={isPTR} onRefresh={refresh} />
        }
      >
        <View style={styles.cardRow}>
          <Link
            href={`/account/${did}/keys`}
            style={[
              styles.card,
              { backgroundColor: theme.dark ? "#15803d" : "#10b981" },
            ]}
          >
            <View style={styles.cardContent}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#a7f3d0" }]}
              >
                <KeyRoundIcon
                  color={theme.dark ? "#15803d" : "#10b981"}
                  size={16}
                />
              </View>
              <Text color="white" style={styles.cardText}>
                Keys
              </Text>
            </View>
          </Link>
          <Link
            href={`/account/${did}`}
            onPress={(evt) => {
              evt.preventDefault()
              Alert.alert("Coming soon!")
            }}
            style={[
              styles.card,
              { backgroundColor: theme.dark ? "#7e22ce" : "#a855f7" },
            ]}
          >
            <View style={styles.cardContent}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#e9d5ff" }]}
              >
                <DatabaseIcon
                  color={theme.dark ? "#7e22ce" : "#a855f7"}
                  size={20}
                />
              </View>
              <Text color="white" style={styles.cardText}>
                Repo backup
              </Text>
            </View>
          </Link>
        </View>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card, overflow: "hidden" },
          ]}
          layout={LinearTransition.duration(150)}
        >
          <View
            style={[styles.auditHeader, { borderColor: theme.colors.border }]}
          >
            <Text style={styles.cardText}>Audit log</Text>
          </View>
          {audit ? (
            audit
              .toReversed()
              .map((entry, i) => (
                <AuditEntry
                  key={entry.cid}
                  record={entry}
                  last={i === audit.length}
                  formatter={formatter}
                  prev={audit.find((a) => a.cid === entry.operation.prev)}
                />
              ))
          ) : isPending ? (
            <ActivityIndicator
              style={{ paddingVertical: 16, marginHorizontal: "auto" }}
            />
          ) : isError ? (
            <Text color="secondary">Failed to fetch audit log</Text>
          ) : null}
        </Animated.View>
      </ScrollView>
    </>
  )
}

function AuditEntry({
  record,
  last,
  formatter,
  prev,
}: {
  record: AuditRecord
  prev?: AuditRecord
  last: boolean
  formatter: Intl.DateTimeFormat
}) {
  const theme = useTheme()

  return (
    <View
      style={[
        styles.auditEntry,
        { borderColor: theme.colors.border },
        last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 4,
        }}
      >
        <Text color="secondary" style={{ fontWeight: 500 }}>
          {record.nullified && <Text color="primary">[Nullified] </Text>}
          {record.operation.type}
        </Text>
        <Text color="tertiary" style={{ textAlign: "right" }}>
          {formatter.format(new Date(record.createdAt))}
        </Text>
      </View>
      {record.operation.type === "plc_operation" && (
        <PlcOpDiff operation={record.operation} prev={prev?.operation} />
      )}
    </View>
  )
}

function PlcOpDiff({
  operation,
  prev,
}: {
  operation: Extract<AuditRecord["operation"], { type: "plc_operation" }>
  prev?: AuditRecord["operation"]
}) {
  const tertiary = useTextColor("tertiary")

  if (!prev) {
    return (
      <>
        <Text>Initial operation</Text>
        <Text color="tertiary">{JSON.stringify(operation, null, 2)}</Text>
      </>
    )
  } else if (prev.type !== "plc_operation") {
    return <Text>TODO: prev was not a plc_operation</Text>
  }

  const addedKeys = difference(operation.rotationKeys, prev.rotationKeys)
  const removedKeys = difference(prev.rotationKeys, operation.rotationKeys)

  // TODO: handle multiple alsoKnownAs
  const handleChanged = operation.alsoKnownAs[0] !== prev.alsoKnownAs[0]

  const servicesChanged = !dequal(prev.services, operation.services)

  return (
    <>
      {addedKeys.map((key) => (
        <Fragment key={key}>
          <Text color="primary">Rotation key added</Text>
          <Text color="tertiary">{key}</Text>
        </Fragment>
      ))}
      {removedKeys.map((key) => (
        <Fragment key={key}>
          <Text color="primary">Rotation key removed</Text>
          <Text color="tertiary">{key}</Text>
        </Fragment>
      ))}
      {handleChanged && (
        <>
          <Text color="primary">Handle changed</Text>
          <Text color="tertiary">
            {prev.alsoKnownAs[0]}{" "}
            <ArrowRightIcon
              color={tertiary}
              size={12}
              style={{ translateY: 2 }}
            />{" "}
            {operation.alsoKnownAs[0]}
          </Text>
        </>
      )}
      {servicesChanged && (
        <>
          <Text color="primary">Services changed</Text>
          <Text color="tertiary">
            {JSON.stringify(operation.services, null, 2)}
          </Text>
        </>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  cardRow: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  card: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderCurve: "continuous",
  },
  cardContent: {
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 80,
  },
  iconContainer: {
    borderRadius: 999,
    width: 28,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    fontWeight: 500,
    fontSize: 16,
  },
  auditHeader: {
    paddingTop: 2,
    paddingBottom: 10,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  auditEntry: {
    paddingVertical: 8,
  },
})
