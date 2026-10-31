import { useEffect, useRef, useState } from "react"
import { StyleSheet } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { XRPCError } from "@atproto/api"
import { FieldGroup, Host, Text, TextInput, type TextInputRef } from "@expo/ui"
import { useMutation } from "@tanstack/react-query"

import { ActionRow } from "#/components/rows"
import { SheetCloseButton } from "#/components/sheet-close-button"
import { useAccountActions } from "#/lib/accounts"
import { useIdentityQuery } from "#/lib/plc"

export default function LoginScreen() {
  const { handle } = useLocalSearchParams<{ handle?: string }>()
  const router = useRouter()
  const { createSession } = useAccountActions()

  const [identifier, setIdentifier] = useState(handle ?? "")
  const [password, setPassword] = useState("")
  const [authFactorToken, setAuthFactorToken] = useState("")
  const passwordRef = useRef<TextInputRef>(null)

  const debouncedIdentifier = useDebouncedValue(identifier.trim(), 500)
  const isDebouncing = identifier.trim() !== debouncedIdentifier

  const identity = useIdentityQuery(debouncedIdentifier, {
    enabled:
      debouncedIdentifier.startsWith("did:") ||
      isProbablyHandle(debouncedIdentifier),
  })

  const login = useMutation({
    mutationFn: async (pds: string) =>
      await createSession({
        service: new URL(pds),
        identifier: identifier.trim(),
        password,
        authFactorToken: authFactorToken.trim() || undefined,
      }),
    onSuccess: () => router.dismiss(),
  })

  const needsAuthFactor = isAuthFactorRequired(login.error)
  const canSubmit =
    !isDebouncing && !!identity.data && password.length > 0 && !login.isPending

  const submit = () => {
    if (canSubmit && identity.data) login.mutate(identity.data.pds)
  }

  return (
    <>
      <SheetCloseButton label="Cancel" />
      <Host style={styles.flex}>
        <FieldGroup>
          <FieldGroup.Section>
            <TextInput
              placeholder="Bluesky handle"
              defaultValue={handle}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              returnKeyType="next"
              onChangeText={setIdentifier}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextInput
              ref={passwordRef}
              placeholder="Password"
              autoComplete="password"
              secureTextEntry
              returnKeyType="go"
              onChangeText={setPassword}
              onSubmitEditing={submit}
            />
            {needsAuthFactor && (
              <TextInput
                placeholder="Sign-in code from your email"
                autoComplete="one-time-code"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                returnKeyType="go"
                onChangeText={setAuthFactorToken}
                onSubmitEditing={submit}
              />
            )}
            <FieldGroup.SectionFooter>
              <LoginStatus
                isResolving={isDebouncing || identity.isLoading}
                pds={identity.data?.pds}
                resolveError={identity.isError}
                loginError={needsAuthFactor ? null : login.error}
              />
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>
          <FieldGroup.Section>
            <ActionRow
              title="Sign in"
              onPress={submit}
              disabled={!canSubmit}
              loading={login.isPending}
            />
            {identity.isError && (
              <ActionRow
                title="Retry finding PDS"
                onPress={() => identity.refetch()}
              />
            )}
          </FieldGroup.Section>
        </FieldGroup>
      </Host>
    </>
  )
}

function LoginStatus({
  isResolving,
  pds,
  resolveError,
  loginError,
}: {
  isResolving: boolean
  pds?: string
  resolveError: boolean
  loginError: Error | null
}) {
  if (loginError) {
    return (
      <Text textStyle={{ color: "red" }}>{describeLoginError(loginError)}</Text>
    )
  }
  if (resolveError) {
    return <Text textStyle={{ color: "red" }}>Could not find your PDS</Text>
  }
  if (pds) {
    return <Text>{`PDS found: ${prettyPds(pds)}`}</Text>
  }
  if (isResolving) {
    return <Text>Searching for PDS…</Text>
  }
  return <Text>Enter your handle to find your PDS</Text>
}

function isAuthFactorRequired(error: Error | null) {
  return error instanceof XRPCError && error.error === "AuthFactorTokenRequired"
}

function describeLoginError(error: Error) {
  if (error instanceof XRPCError) {
    if (error.error === "AuthenticationRequired") {
      return "Wrong handle or password"
    }
    if (error.error === "AccountTakedown") {
      return "This account has been taken down"
    }
    if (error.message) return error.message
  }
  return "Could not sign you in"
}

function prettyPds(pds: string) {
  try {
    const { hostname } = new URL(pds)
    // Bluesky-hosted PDSes all sit behind bsky.social
    if (hostname.endsWith(".host.bsky.network")) {
      return `bsky.social (${hostname.split(".", 1)[0]})`
    }
    return hostname
  } catch {
    return pds
  }
}

const HANDLE_REGEX =
  /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/

function isProbablyHandle(identifier: string) {
  return HANDLE_REGEX.test(identifier)
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timeout)
  }, [value, delayMs])
  return debounced
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
})
