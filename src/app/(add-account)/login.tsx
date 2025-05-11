import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  TextInput as RNTextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native"
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
} from "react-native-reanimated"
import {
  useSafeAreaFrame,
  useSafeAreaInsets,
} from "react-native-safe-area-context"
import { Stack, useRouter } from "expo-router"
import { useHeaderHeight } from "@react-navigation/elements"
import { useTheme } from "@react-navigation/native"
import { useMutation, useQuery } from "@tanstack/react-query"
import { CircleCheckIcon, XIcon } from "lucide-react-native"

import { Button } from "#/components/button"
import { useSheetCloseButton } from "#/components/header-buttons"
import { ScrollView, Text, useTextColor } from "#/components/views"
import { createAgentWithSession, useIdentityQuery } from "#/lib/agent"

import { useSetAgent } from "./_layout"

export default function LoginScreen() {
  const headerLeft = useSheetCloseButton("Cancel")
  const headerHeight = useHeaderHeight()
  const router = useRouter()
  const setAgent = useSetAgent()
  const theme = useTheme()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const frame = useSafeAreaFrame()
  const insets = useSafeAreaInsets()

  const debouncedIdentifier = useDebouncedValue(identifier, 500)
  const isDebouncing = identifier !== debouncedIdentifier

  const {
    isLoading,
    data: identity,
    isError,
    refetch: retryResolution,
  } = useIdentityQuery(debouncedIdentifier, {
    enabled:
      debouncedIdentifier.startsWith("did:") ||
      isProbablyHandle(debouncedIdentifier),
  })

  const {
    isPending: isLoginPending,
    mutate: loginMutate,
    isError: isLoginError,
  } = useMutation({
    mutationKey: ["login", identifier, password],
    mutationFn: async ({ pds }: { pds: string }) => {
      return await createAgentWithSession(new URL(pds), identifier, password)
    },
    onSuccess: (agent) => {
      setAgent(agent)
      router.push("/(add-account)/manage-keys")
      setIdentifier("")
      setPassword("")
    },
  })

  const topUnsafeArea = insets.top + 10 + headerHeight

  return (
    <>
      <Stack.Screen options={{ headerLeft }} />
      <ScrollView
        contentContainerStyle={{
          minHeight: frame.height - topUnsafeArea - insets.bottom,
        }}
      >
        {/* todo: use rnkc for smooth animation */}
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
          keyboardVerticalOffset={topUnsafeArea + 8}
        >
          <LayoutAnimationConfig skipExiting skipEntering>
            <View style={styles.container}>
              <View style={styles.inputGroup}>
                <TextInput
                  placeholder="Handle"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoFocus
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCorrect={false}
                />
                {(isLoading || identity || isError) && (
                  <Animated.View
                    layout={LinearTransition}
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={[
                      styles.handleResolutionCard,
                      {
                        backgroundColor: isError
                          ? theme.colors.notification
                          : theme.colors.primary,
                      },
                    ]}
                  >
                    <HandleResolutionStatus
                      isLoading={isLoading}
                      data={identity}
                      isError={isError}
                      retry={retryResolution}
                    />
                  </Animated.View>
                )}
                <Animated.View layout={LinearTransition}>
                  <TextInput
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </Animated.View>
                {isLoginError && (
                  <Animated.View
                    layout={LinearTransition}
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={[
                      styles.handleResolutionCard,
                      { backgroundColor: theme.colors.notification },
                    ]}
                  >
                    <XIcon color="white" size={20} />
                    <Text color="white" style={styles.handleResolutionText}>
                      Could not log you in. Wrong password?
                    </Text>
                  </Animated.View>
                )}
              </View>
              <View>
                <Button
                  onPress={() =>
                    identity &&
                    loginMutate({
                      pds: identity.pds,
                    })
                  }
                  title="Next"
                  disabled={
                    isDebouncing ||
                    isLoginPending ||
                    !identity ||
                    password.length < 1
                  }
                />
              </View>
            </View>
          </LayoutAnimationConfig>
        </KeyboardAvoidingView>
      </ScrollView>
    </>
  )
}

function TextInput({ style, ...props }: React.PropsWithRef<TextInputProps>) {
  const scheme = useColorScheme() || "default"
  const theme = useTheme()
  const primary = useTextColor("primary")
  const tertiary = useTextColor("tertiary")

  return (
    <RNTextInput
      style={[
        styles.textInput,
        {
          color: primary,
          backgroundColor: theme.colors.card,
        },
        style,
      ]}
      {...props}
      keyboardAppearance={scheme}
      placeholderTextColor={tertiary}
    />
  )
}

function HandleResolutionStatus({
  isLoading,
  isError,
  data,
  retry,
}: {
  isLoading: boolean
  data?: { pds: string }
  isError: boolean
  retry: () => void
}) {
  if (data) {
    let prettyUrl = data.pds
    try {
      const urlp = new URL(data.pds)
      prettyUrl = urlp.hostname
      if (urlp.hostname.endsWith(".host.bsky.network")) {
        const mushroom = urlp.hostname.split(".", 1)[0]
        prettyUrl = "🦋 " + mushroom[0].toLocaleUpperCase() + mushroom.slice(1)
      }
    } catch {}
    return (
      <>
        <CircleCheckIcon color="white" size={20} />
        <Text
          color="white"
          style={styles.handleResolutionText}
          numberOfLines={1}
        >
          PDS found: {prettyUrl}
        </Text>
      </>
    )
  }
  if (isLoading) {
    return (
      <>
        <ActivityIndicator size="small" color="white" />
        <Text color="white" style={styles.handleResolutionText}>
          Searching for PDS...
        </Text>
      </>
    )
  }
  if (isError) {
    return (
      <>
        <XIcon color="white" size={20} />
        <Text color="white" style={styles.handleResolutionText}>
          Could not find PDS
        </Text>
        <TouchableOpacity onPress={retry}>
          <Text color="white" style={styles.handleResolutionText}>
            Retry
          </Text>
        </TouchableOpacity>
      </>
    )
  }
}

const VALIDATE_REGEX =
  /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/

function isProbablyHandle(identifier: string) {
  identifier = identifier.trim()
  return (
    !!identifier &&
    identifier.includes(".") &&
    VALIDATE_REGEX.test(identifier) &&
    !identifier.startsWith("-") &&
    !identifier.endsWith("-")
  )
}

// Trailing debounce
function useDebouncedValue<T>(val: T, delayMs: number): T {
  const [prev, setPrev] = useState(val)

  useEffect(() => {
    const timeout = setTimeout(() => setPrev(val), delayMs)
    return () => clearTimeout(timeout)
  }, [val, delayMs])

  return prev
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    justifyContent: "space-between",
  },
  inputGroup: {
    gap: 4,
    borderRadius: 12,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  textInput: {
    fontSize: 16,
    padding: 14,
    borderRadius: 4,
    borderCurve: "continuous",
  },
  handleResolutionCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderRadius: 4,
    borderCurve: "continuous",
  },
  handleResolutionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: 500,
  },
  inputAccessoryView: {
    paddingHorizontal: 20,
  },
})
