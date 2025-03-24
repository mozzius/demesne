import { StyleSheet, TouchableHighlight, View } from "react-native"
import { useTheme } from "@react-navigation/native"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { SearchIcon } from "lucide-react-native"

import { Text, useTextColor } from "#/components/views"
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

  if (input.length < 3) {
    return null
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
                    styles.suggestion,
                    {
                      borderColor: tertiary,
                      backgroundColor: theme.colors.background,
                    },
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
              </TouchableHighlight>
            ))}
        </View>
      )
  }
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
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  suggestionText: {
    fontSize: 16,
  },
})
