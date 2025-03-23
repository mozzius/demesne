import { forwardRef, useMemo } from "react"
import { Text as RNText, TextProps } from "react-native"
import Animated, { AnimatedScrollViewProps } from "react-native-reanimated"
import { useTheme } from "@react-navigation/native"

export const ScrollView = forwardRef<
  Animated.ScrollView,
  AnimatedScrollViewProps
>((props, ref) => {
  return (
    <Animated.ScrollView
      ref={ref}
      contentInsetAdjustmentBehavior="automatic"
      {...props}
    />
  )
})

export function useTextColor(color: "primary" | "secondary" | "tertiary") {
  const theme = useTheme()
  let colorValue = theme.colors.text
  if (color === "secondary") {
    colorValue = theme.dark ? "#999" : "#777"
  } else if (color === "tertiary") {
    colorValue = theme.dark ? "#666" : "#aaa"
  }
  return colorValue
}

export const Text = forwardRef<
  RNText,
  TextProps & {
    color?: "primary" | "secondary" | "tertiary"
  }
>(({ color: colorProp = "primary", style, ...props }, ref) => {
  const color = useTextColor(colorProp)
  const styleWithColor = useMemo(() => {
    return [{ color }, style]
  }, [color, style])
  return <RNText ref={ref} style={styleWithColor} {...props} />
})
