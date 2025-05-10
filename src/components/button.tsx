import { Pressable, PressableProps, StyleSheet } from "react-native"
import { useTheme } from "@react-navigation/native"

import { Text } from "./views"

export function Button({
  title,
  style,
  ...props
}: Omit<PressableProps, "children"> & { title: string }) {
  const theme = useTheme()
  return (
    <Pressable
      style={(state) => [
        styles.button,
        { backgroundColor: theme.colors.primary },
        props.disabled && styles.disabled,
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      <Text color="white" style={styles.text}>
        {title}
      </Text>
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
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: 500,
    textAlign: "center",
  },
  disabled: {
    filter: [{ brightness: 0.75 }],
  },
})
