import { forwardRef, useMemo } from "react"
import {
  Text as RNText,
  TextProps,
  type FlatList as RNFlatList,
} from "react-native"
import Animated, {
  AnimatedScrollViewProps,
  FlatListPropsWithLayout,
} from "react-native-reanimated"
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

function FlatListInner<T extends any>(
  props: FlatListPropsWithLayout<T>,
  ref: React.ForwardedRef<RNFlatList<T>>,
) {
  return (
    <Animated.FlatList<T>
      ref={ref}
      contentInsetAdjustmentBehavior="automatic"
      {...props}
    />
  )
}

export const FlatList = forwardRef(FlatListInner) as <T = any>(
  props: FlatListPropsWithLayout<T> & {
    ref?: React.ForwardedRef<RNFlatList<T>>
  },
) => React.ReactElement

export function useTextColor(
  color: "primary" | "secondary" | "tertiary" | "accent",
) {
  const theme = useTheme()
  let colorValue = theme.colors.text
  if (color === "secondary") {
    colorValue = theme.dark ? "#999" : "#777"
  } else if (color === "tertiary") {
    colorValue = theme.dark ? "#666" : "#aaa"
  } else if (color === "accent") {
    colorValue = theme.colors.primary
  }
  return colorValue
}

export const Text = forwardRef<
  RNText,
  TextProps & {
    color?: "primary" | "secondary" | "tertiary" | "accent" | (string & {})
  }
>(({ color: colorProp = "primary", style, ...props }, ref) => {
  const isColorThemed =
    colorProp === "primary" ||
    colorProp === "secondary" ||
    colorProp === "tertiary" ||
    colorProp === "accent"
  let color = useTextColor(
    isColorThemed
      ? (colorProp as "primary" | "secondary" | "tertiary" | "accent")
      : "primary",
  )
  if (!isColorThemed) color = colorProp
  const styleWithColor = useMemo(() => {
    return [{ color }, style]
  }, [color, style])
  return <RNText ref={ref} style={styleWithColor} {...props} />
})
