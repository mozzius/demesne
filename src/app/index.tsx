import { Link } from "expo-router"
import { CastleIcon } from "lucide-react-native"

import { Button } from "#/components/button"
import { EmptyState } from "#/components/empty-state"
import { ScrollView } from "#/components/views"

export default function Index() {
  return <WelcomeEmptyState />
}

function WelcomeEmptyState() {
  return (
    <ScrollView>
      <EmptyState
        icon={CastleIcon}
        text="Welcome to Demesne!"
        subText="Keep your PLC keys close to home"
      >
        <Link asChild href="/login">
          <Button title="Add account" />
        </Link>
      </EmptyState>
    </ScrollView>
  )
}
