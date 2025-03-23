import { useRef, useState } from "react"
import { Button, StyleSheet, View } from "react-native"
import { SearchBarCommands } from "react-native-screens"
import { Stack } from "expo-router"
import {
  keepPreviousData,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query"
import { CastleIcon } from "lucide-react-native"

import { EmptyState } from "#/components/empty-state"
import { ScrollView, Text } from "#/components/views"

export default function Index() {
  const ref = useRef<SearchBarCommands>(null)
  const [searchText, setSearchText] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  const hasSearchQuery = searchText.length > 1

  const results = useQuery({
    queryKey: ["search", searchText],
    enabled: hasSearchQuery,
    queryFn: async () => {
      const res = await fetch(`/search?q=${searchText}`)
      const data = await res.json()
      return data
    },
    placeholderData: keepPreviousData,
  })

  return (
    <ScrollView>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            ref,
            placeholder: "Find your next domain",
            onChangeText: (evt) => setSearchText(evt.nativeEvent.text),
            onFocus: () => setIsFocused(true),
            onBlur: () => setIsFocused(false),
            placement: "stacked",
            autoCapitalize: "none",
          },
        }}
      />
      {isFocused || hasSearchQuery ? (
        <SearchResults input={searchText} results={results} />
      ) : (
        <WelcomeEmptyState onGetStarted={() => ref.current?.focus()} />
      )}
    </ScrollView>
  )
}

function SearchResults({
  input,
  results,
}: {
  input: string
  results: UseQueryResult<any>
}) {
  if (input.length < 2) {
    return (
      <Text style={styles.resultText} color="tertiary">
        Start typing...
      </Text>
    )
  }
  switch (results.status) {
    case "pending":
      return (
        <Text style={styles.resultText} color="tertiary">
          Searching...
        </Text>
      )
    case "error":
      return (
        <Text style={styles.resultText} color="primary">
          Error: {results.error.message}
        </Text>
      )
    case "success":
      return (
        <Text style={styles.resultText} color="primary">
          Results: {JSON.stringify(results.data)}
        </Text>
      )
  }
}

function WelcomeEmptyState({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <EmptyState
      icon={CastleIcon}
      text="Welcome to Demesne!"
      subText="Your next domain awaits you."
    >
      <Button title="Get started" onPress={onGetStarted} />
    </EmptyState>
  )
}

const styles = StyleSheet.create({
  resultText: {
    flex: 1,
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
  },
})
