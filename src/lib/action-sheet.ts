import { useCallback, useRef } from "react"
import { ActionSheetIOS, findNodeHandle, View } from "react-native"

type Option = {
  item: string
  destructive?: boolean
  disabled?: boolean
}

export function useActionSheet() {
  const ref = useRef<View>(null)

  const show = useCallback<typeof showActionSheet>(
    (args) =>
      showActionSheet({
        anchor: findNodeHandle(ref.current ?? null) ?? undefined,
        ...args,
      }),
    [ref],
  )

  return [ref, show] as const
}

export function showActionSheet<T extends Option>({
  options,
  title,
  message,
  includeCancel = true,
  anchor,
}: {
  title?: string
  message?: string
  options: T[]
  includeCancel?: boolean
  anchor?: number
}): Promise<T | undefined> {
  const items = options.map((op) => op.item)
  let cancelButtonIndex: number | undefined
  if (includeCancel) {
    cancelButtonIndex = options.length
    items.push("Cancel")
  }
  return new Promise((resolve) =>
    ActionSheetIOS.showActionSheetWithOptions(
      {
        anchor,
        title,
        message,
        options: items,
        cancelButtonIndex,
        destructiveButtonIndex: options
          .map((item, i) => (item.destructive ? i : null))
          .filter((op) => op !== null),
        disabledButtonIndices: options
          .map((item, i) => (item.disabled ? i : null))
          .filter((op) => op !== null),
      },
      (index) => {
        if (index === undefined) {
          return resolve(undefined)
        } else {
          return resolve(options[index])
        }
      },
    ),
  )
}
