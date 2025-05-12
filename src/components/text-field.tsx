import {
  StyleSheet,
  TextInput,
  TextInputProps,
  useColorScheme,
  View,
  ViewProps,
} from "react-native"
import { useTheme } from "@react-navigation/native"

import { useTextColor } from "./views"

export function TextField({
  style,
  ...props
}: TextInputProps & { ref?: React.Ref<TextInput> }) {
  const scheme = useColorScheme() || "default"
  const theme = useTheme()
  const primary = useTextColor("primary")
  const tertiary = useTextColor("tertiary")

  return (
    <TextInput
      style={[
        styles.textInput,
        {
          color: primary,
          backgroundColor: theme.colors.card,
        },
        style,
      ]}
      {...props}
      keyboardAppearance={scheme}
      placeholderTextColor={tertiary}
      hitSlop={20}
    />
  )
}

export function InputGroup({ style, ...props }: ViewProps) {
  return <View style={[styles.inputGroup, style]} {...props} />
}

const styles = StyleSheet.create({
  inputGroup: {
    gap: 4,
    borderRadius: 12,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  textInput: {
    fontSize: 16,
    padding: 14,
    borderRadius: 4,
    borderCurve: "continuous",
  },
})
