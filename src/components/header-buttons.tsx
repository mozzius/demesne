import { useCallback } from "react"
import { Pressable, StyleSheet, TouchableOpacity, View } from "react-native"
import { Link, useRouter } from "expo-router"
import { useTheme } from "@react-navigation/native"
import { XIcon } from "lucide-react-native"

import { isIOS26 } from "#/lib/versions"

import { Text } from "./views"

export function useSheetCloseButton(title?: string, bold?: "bold") {
  const router = useRouter()
  const theme = useTheme()

  return useCallback(() => {
    if (router.canDismiss()) {
      return (
        <View style={styles.buttons}>
          <Link asChild dismissTo href="..">
            {isIOS26 ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Close sheet"
                style={{
                  width: 37,
                  height: 37,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <XIcon size={24} color={theme.colors.text} />
              </Pressable>
            ) : (
              <TouchableOpacity accessibilityLabel="Close sheet">
                <Text
                  color="accent"
                  style={[styles.textButton, bold && styles.bold]}
                >
                  {title ?? "Close"}
                </Text>
              </TouchableOpacity>
            )}
          </Link>
        </View>
      )
    } else {
      return null
    }
  }, [router, title, bold])
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
