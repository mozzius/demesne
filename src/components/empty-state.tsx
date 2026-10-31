import { Column, Host, Icon, Text, type IconName } from "@expo/ui"

export function EmptyState({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: IconName
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <Host style={{ flex: 1 }}>
      <Column
        alignment="center"
        spacing={16}
        style={{ paddingHorizontal: 32, paddingTop: 160 }}
      >
        <Icon name={icon} size={56} color="gray" />
        <Column alignment="center" spacing={6}>
          <Text textStyle={{ fontSize: 22, fontWeight: "bold" }}>{title}</Text>
          {subtitle ? (
            <Text
              textStyle={{ fontSize: 16, color: "gray", textAlign: "center" }}
            >
              {subtitle}
            </Text>
          ) : null}
        </Column>
        {children}
      </Column>
    </Host>
  )
}
