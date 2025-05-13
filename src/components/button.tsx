import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  View,
} from "react-native"
import { useTheme } from "@react-navigation/native"

import { Text } from "./views"

export function Button({
  title,
  style,
  loading,
  disabled,
  ...props
}: Omit<PressableProps, "children"> & { title: string; loading?: boolean }) {
  const theme = useTheme()
  return (
    <Pressable
      style={(state) => [
        styles.button,
        { backgroundColor: theme.colors.primary },
        disabled && styles.disabled,
        state.hovered && styles.hovered,
        state.pressed && styles.pressed,
        typeof style === "function" ? style(state) : style,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      <Text color="white" style={styles.text}>
        {title}
      </Text>
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color="white" />
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderCurve: "continuous",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: 500,
    textAlign: "center",
  },
  disabled: {
    filter: [{ brightness: 0.75 }],
  },
  hovered: {
    filter: [{ brightness: 1.05 }],
  },
  pressed: {
    filter: [{ brightness: 1.1 }],
  },
  loading: {
    height: 0,
    justifyContent: "center",
  },
})
