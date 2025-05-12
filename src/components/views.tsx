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

export function ScrollView(props: AnimatedScrollViewProps) {
  return (
    <Animated.ScrollView
      contentInsetAdjustmentBehavior="automatic"
      {...props}
    />
  )
}

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

export function Text({
  color: colorProp = "primary",
  style,
  ...props
}: TextProps & {
  color?: "primary" | "secondary" | "tertiary" | "accent" | (string & {})
}) {
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
  return <RNText style={styleWithColor} {...props} />
}
