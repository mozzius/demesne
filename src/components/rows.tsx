import { ActivityIndicator, Platform } from "react-native"
import { useTheme } from "expo-router"
import { ListItem, Text } from "@expo/ui"

import { RNAccessory } from "./accessory"

/**
 * A tappable row styled as an action (tinted text), for use inside a
 * `FieldGroup.Section`.
 */
export function ActionRow({
  title,
  onPress,
  destructive,
  disabled,
  loading,
}: {
  title: string
  onPress: () => void
  destructive?: boolean
  disabled?: boolean
  loading?: boolean
}) {
  const theme = useTheme()
  const inactive = disabled || loading
  const color = inactive
    ? "gray"
    : destructive
      ? theme.colors.notification
      : theme.colors.primary

  return (
    <ListItem
      onPress={inactive ? undefined : onPress}
      trailing={
        loading ? (
          <RNAccessory>
            <ActivityIndicator size="small" />
          </RNAccessory>
        ) : undefined
      }
    >
      <Text textStyle={{ color: String(color) }}>{title}</Text>
    </ListItem>
  )
}

/** A monospace font family that exists on every platform. */
export const monospace = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "ui-monospace, monospace",
})
