import { StyleSheet, View } from "react-native"
import { type LucideIcon } from "lucide-react-native"

import { Text, useTextColor } from "#/components/views"

export function EmptyState({
  icon: Icon,
  text = "Nothing here",
  subText,
  children,
}: {
  icon: LucideIcon
  text: string
  subText?: string
  children?: React.ReactNode
}) {
  const color = useTextColor("tertiary")
  return (
    <View style={styles.container}>
      <Icon size={64} color={color} />
      <View style={styles.textContainer}>
        <Text style={styles.text} color="primary">
          {text}
        </Text>
        {subText && (
          <Text style={styles.subText} color="secondary">
            {subText}
          </Text>
        )}
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    paddingTop: "30%",
  },
  textContainer: {
    maxWidth: 300,
    textAlign: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    maxWidth: 300,
    textAlign: "center",
  },
  subText: {
    fontSize: 16,
    maxWidth: 300,
    textAlign: "center",
  },
})
