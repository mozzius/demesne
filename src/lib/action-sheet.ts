import { ActionSheetIOS } from "react-native"

type Option = {
  item: string
  destructive?: boolean
  disabled?: boolean
}

export function showActionSheet<T extends Option>({
  options,
  title,
  message,
  includeCancel = true,
}: {
  title?: string
  message?: string
  options: T[]
  includeCancel?: boolean
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
