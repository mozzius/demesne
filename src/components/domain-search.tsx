import { useMemo } from "react"
import { StyleSheet, View } from "react-native"
import { useTheme } from "@react-navigation/native"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { FrownIcon, SmileIcon } from "lucide-react-native"

import { FlatList, ScrollView, Text, useTextColor } from "#/components/views"
import { usePQueue } from "#/lib/p-queue"
import { checkDomainsSchema, getDomainPriceSchema } from "#/lib/schemas"
import { useTldList } from "#/lib/tld-list"

export function DomainSearch({ input }: { input: string }) {
  const tldList = useTldList()

  const sanitizedInput = sanitizeInput(input)

  const headline = useMemo(() => {
    const allMatches = tldList.filter((tld) =>
      sanitizedInput.endsWith("." + tld),
    )
    const longestTld = allMatches.reduce(
      (acc, tld) => (acc.length > tld.length ? acc : tld),
      "",
    )
    if (longestTld) {
      return {
        tld: longestTld,
        sld: sanitizedInput
          .slice(0, (longestTld.length + 1) * -1)
          .replace(/\./g, "-"),
        others: tldList.filter((tld) => tld !== longestTld),
      }
    } else {
      return {
        tld: "com",
        sld: sanitizedInput.replace(/\./g, "-"),
        others: tldList.filter((tld) => tld !== "com"),
      }
    }
  }, [sanitizedInput, tldList])

  const results = useInfiniteQuery({
    queryKey: ["search", "domain", sanitizedInput],
    enabled: tldList.length > 0,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const domains = []
      if (pageParam === 0) {
        domains.push(`${headline.sld}.${headline.tld}`)
      }
      const page = headline.others.slice(pageParam, pageParam + 10)
      domains.push(page.map((tld) => `${headline.sld}.${tld}`))
      const res = await fetch(`/api/check-domains?q=${domains.join(",")}`)
      const data = await res.json()
      return checkDomainsSchema.parse(data)
    },
    getNextPageParam: (page, _, param) =>
      page.domains.length > 0 ? param + page.domains.length : undefined,
  })

  const handleEndReached = () => {
    if (!results.isFetchingNextPage) {
      results.fetchNextPage()
    }
  }

  const data = useMemo(
    () => results.data?.pages.flatMap((page) => page.domains) ?? [],
    [results.data],
  )

  if (data.length > 0) {
    return (
      <FlatList
        contentContainerStyle={styles.resultsContainer}
        data={data}
        renderItem={({ item }) => (
          <ResultCard
            key={item.Domain}
            domain={item.Domain}
            available={item.Available}
          />
        )}
        keyExtractor={keyExtractor}
        onEndReached={handleEndReached}
        onEndReachedThreshold={1.5}
      />
    )
  }

  switch (results.status) {
    case "pending":
      return (
        <ScrollView>
          <Text style={styles.resultText} color="tertiary">
            Searching...
          </Text>
        </ScrollView>
      )
    case "error":
      return (
        <ScrollView>
          <Text style={styles.resultText} color="primary">
            Error: {results.error.message}
          </Text>
        </ScrollView>
      )
    case "success":
  }
}

function keyExtractor(item: { Domain: string }) {
  return item.Domain
}

function ResultCard({
  domain,
  available,
}: {
  domain: string
  available: boolean
}) {
  const theme = useTheme()
  const secondary = useTextColor("secondary")
  const pqueue = usePQueue()

  const { data: price } = useQuery({
    queryKey: ["price", domain],
    enabled: available,
    queryFn: async () => {
      const response = await pqueue.add(() =>
        fetch(`/api/get-domain-price/?q=${domain}`),
      )
      if (!response) throw new Error("Failed to fetch domain price")
      const data = await response.json()
      return getDomainPriceSchema.parse(data)
    },
    select: ({ register, renew }) =>
      // find lowest Duration
      ({
        register: register.reduce(
          (lowest, curr) => (lowest.Duration < curr.Duration ? lowest : curr),
          register[0],
        ),
        renew: renew.reduce(
          (lowest, curr) => (lowest.Duration < curr.Duration ? lowest : curr),
          renew[0],
        ),
      }),
  })

  return (
    <View style={[styles.resultCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.firstRow}>
        <Text style={styles.domainText}>{domain}</Text>
        <Text
          style={styles.priceText}
          color={available ? "primary" : "secondary"}
        >
          {available && price
            ? formatCurrency(price.register.YourPrice, price.register.Currency)
            : "—"}
        </Text>
      </View>
      {available ? (
        <View style={styles.secondRow}>
          <View style={styles.iconGroup}>
            <SmileIcon size={14} color={theme.colors.primary} />
            <Text style={styles.secondaryText} color={theme.colors.primary}>
              Available!
            </Text>
          </View>
          {price && (
            <Text style={styles.renewText} color="secondary">
              renews at{" "}
              {formatCurrency(price.renew.YourPrice, price.renew.Currency)}/
              {formatPeriod(price.renew.DurationType)}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.iconGroup}>
          <FrownIcon size={14} color={secondary} />
          <Text style={styles.secondaryText} color="secondary">
            Taken
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  resultText: {
    flex: 1,
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
  },
  resultsContainer: {
    paddingTop: 8,
    paddingHorizontal: 16,
    gap: 12,
    borderCurve: "continuous",
  },
  resultCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  domainText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "right",
  },
  firstRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  secondRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  secondaryText: {
    fontSize: 14,
  },
  renewText: {
    fontSize: 14,
    textAlign: "right",
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

function formatCurrency(price: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  })
  return formatter.format(price)
}

function formatPeriod(duration: string) {
  switch (duration) {
    case "MONTH":
      return "mo"
    case "YEAR":
      return "yr"
    default:
      return "??"
  }
}
