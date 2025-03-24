import { createContext, useContext, useState } from "react"
import PQueue from "p-queue"

const PQueueContext = createContext<PQueue | null>(null)

export function Provider({ children }: { children: React.ReactNode }) {
  const [queue] = useState(() => new PQueue({ concurrency: 5 }))
  return (
    <PQueueContext.Provider value={queue}>{children}</PQueueContext.Provider>
  )
}

export function usePQueue() {
  const ctx = useContext(PQueueContext)
  if (!ctx) {
    throw new Error("usePQueue must be used within a PQueueProvider")
  }
  return ctx
}
