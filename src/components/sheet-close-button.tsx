import { Platform } from "react-native"
import { Stack, useRouter } from "expo-router"

/**
 * Adds a close button to the header of a modal screen. Renders nothing when
 * the screen can't be dismissed (for example, when deep-linked into).
 */
export function SheetCloseButton({
  placement = "left",
  label = "Close",
}: {
  placement?: "left" | "right"
  label?: string
}) {
  const router = useRouter()
  if (!router.canDismiss()) return null

  return (
    <Stack.Toolbar placement={placement}>
      <Stack.Toolbar.Button
        icon={Platform.OS === "ios" ? "xmark" : undefined}
        accessibilityLabel={label}
        onPress={() => router.dismiss()}
      >
        {Platform.OS === "ios" ? undefined : label}
      </Stack.Toolbar.Button>
    </Stack.Toolbar>
  )
}
