import { isIOS26 } from "#/lib/versions"

export const coolTitleEffect = isIOS26
  ? {
      headerTransparent: true,
    }
  : ({
      headerShadowVisible: true,
      headerTransparent: true,
      headerBlurEffect: "systemChromeMaterial",
      headerLargeStyle: {
        backgroundColor: "transparent",
      },
    } as const)

export const coolLargeTitleEffect = isIOS26
  ? {
      headerLargeTitle: true,
      headerTransparent: true,
    }
  : ({
      headerLargeTitle: true,
      headerShadowVisible: true,
      headerLargeTitleShadowVisible: false,
      headerTransparent: true,
      headerBlurEffect: "systemChromeMaterial",
      headerLargeStyle: {
        backgroundColor: "transparent",
      },
    } as const)
