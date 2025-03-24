import { StyleSheet, TouchableHighlight, View } from "react-native"
import { useTheme } from "@react-navigation/native"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { SearchIcon } from "lucide-react-native"

import { ScrollView, Text, useTextColor } from "#/components/views"
import { typeaheadSchema } from "#/lib/schemas"

export function TypeaheadSearch({
  input,
  onPressSuggestion,
}: {
  input: string
  onPressSuggestion: (suggestion: string) => void
}) {
  const primary = useTextColor("primary")
  const tertiary = useTextColor("tertiary")
  const theme = useTheme()

  const results = useQuery({
    queryKey: ["typeahead", input],
    queryFn: async () => {
      const res = await fetch(`/api/typeahead?q=${input}`)
      const data = await res.json()
      return typeaheadSchema.parse(data)
    },
    placeholderData: keepPreviousData,
  })

  let content

  if (input.length < 3) {
    content = null
  } else {
    switch (results.status) {
      case "pending": {
        content = (
          <Text style={styles.resultText} color="tertiary">
            Searching...
          </Text>
        )
        break
      }
      case "error": {
        content = (
          <Text style={styles.resultText} color="primary">
            Error: {results.error.message}
          </Text>
        )
        break
      }
      case "success": {
        content = (
          <View style={styles.typeaheadContainer}>
            {results.data.typeaheadSuggestions
              .filter((s, i, a) => a.indexOf(s) === i)
              .map((suggestion) => (
                <TouchableHighlight
                  key={suggestion.domainName}
                  onPress={() => onPressSuggestion(suggestion.domainName)}
                >
                  <View
                    style={[
                      styles.suggestionOuter,
                      { backgroundColor: theme.colors.background },
                    ]}
                  >
                    <View
                      style={[
                        styles.suggestionInner,
                        { borderColor: tertiary },
                      ]}
                    >
                      <SearchIcon size={16} color={primary} />
                      <Text
                        style={styles.suggestionText}
                        color="primary"
                        numberOfLines={1}
                      >
                        {suggestion.domainName}
                      </Text>
                    </View>
                  </View>
                </TouchableHighlight>
              ))}
          </View>
        )
        break
      }
    }
  }

  return <ScrollView keyboardDismissMode="interactive">{content}</ScrollView>
}

const styles = StyleSheet.create({
  resultText: {
    flex: 1,
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
  },
  typeaheadContainer: {
    flex: 1,
  },
  suggestionOuter: {
    paddingLeft: 20,
  },
  suggestionInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionText: {
    fontSize: 16,
  },
})
