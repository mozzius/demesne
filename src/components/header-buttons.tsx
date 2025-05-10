import { useCallback } from "react"
import { StyleSheet, TouchableOpacity, View } from "react-native"
import { Link, useRouter } from "expo-router"

import { Text } from "./views"

export function useSheetCloseButton(title?: string, bold?: "bold") {
  const router = useRouter()

  return useCallback(() => {
    if (router.canDismiss()) {
      return (
        <View style={styles.buttons}>
          <Link asChild dismissTo href="..">
            <TouchableOpacity accessibilityLabel="Close sheet">
              <Text
                color="accent"
                style={[styles.textButton, bold && styles.bold]}
              >
                {title ?? "Close"}
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      )
    } else {
      return null
    }
  }, [router, title])
}

const styles = StyleSheet.create({
  buttons: {
    flexDirection: "row",
  },
  textButton: {
    fontSize: 16,
  },
  bold: {
    fontWeight: 600,
  },
})
