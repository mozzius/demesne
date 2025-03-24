import { StyleSheet, View } from "react-native"
import { useQuery } from "@tanstack/react-query"

import { Text } from "#/components/views"
import { checkDomainsSchema } from "#/lib/schemas"
import { useTldList } from "#/lib/tld-list"

export function DomainSearch({ input }: { input: string }) {
  const tldList = useTldList()

  const sanitizedInput = sanitizeInput(input)

  const results = useQuery({
    queryKey: ["search", "domain", sanitizedInput],
    enabled: tldList.length > 0,
    queryFn: async () => {
      let q = ""
      const allMatches = tldList.filter((tld) => sanitizedInput.endsWith(tld))
      const longestTld = allMatches.reduce(
        (acc, tld) => (acc.length > tld.length ? acc : tld),
        "",
      )
      if (longestTld) {
        q = sanitizedInput
          .slice(0, (longestTld.length + 1) * -1)
          .replace(/\./g, "-")
          .concat("." + longestTld)
      } else {
        q = sanitizedInput.replace(/\./g, "-") + ".com"
      }
      const res = await fetch(`/api/check-domains?q=${q}`)
      const data = await res.json()
      return checkDomainsSchema.parse(data)
    },
  })

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
        <View style={styles.resultsContainer}>
          <Text>{JSON.stringify(results.data, null, 2)}</Text>
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
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
})

function sanitizeInput(input: string): string {
  // Trim leading and trailing whitespace first
  const trimmed = input.trim()

  // Replace sequences of invalid characters with a single hyphen
  // Domain names can only contain letters, numbers, and hyphens (not at start/end)
  const sanitized = trimmed
    .toLowerCase()
    // Replace spaces and special chars with hyphens
    .replace(/[^a-z0-9.]/g, "-")
    // Replace multiple consecutive hyphens with a single hyphen
    .replace(/-+/g, "-")
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, "")

  return sanitized
}
