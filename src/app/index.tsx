import { useRef, useState } from "react"
import { Button } from "react-native"
import { SearchBarCommands } from "react-native-screens"
import { Stack } from "expo-router"
import { CastleIcon } from "lucide-react-native"

import { DomainSearch } from "#/components/domain-search"
import { EmptyState } from "#/components/empty-state"
import { TypeaheadSearch } from "#/components/typeahead-search"
import { ScrollView } from "#/components/views"

export default function Index() {
  const ref = useRef<SearchBarCommands>(null)
  const [searchText, setSearchText] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  const hasSearchQuery = searchText.length > 1

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
            onSearchButtonPress: (evt) =>
              ref.current?.setText(evt.nativeEvent.text.toLocaleLowerCase()),
            placement: "stacked",
            autoCapitalize: "none",
          },
        }}
      />
      {isFocused ? (
        <TypeaheadSearch
          input={searchText.toLocaleLowerCase()}
          onPressSuggestion={(suggestion) => {
            setSearchText(suggestion)
            ref.current?.setText(suggestion)
            ref.current?.blur()
          }}
        />
      ) : hasSearchQuery ? (
        <DomainSearch input={searchText.toLocaleLowerCase()} />
      ) : (
        <WelcomeEmptyState onGetStarted={() => ref.current?.focus()} />
      )}
    </ScrollView>
  )
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
