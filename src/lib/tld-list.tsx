import { createContext, useContext } from "react"
import { useQuery } from "@tanstack/react-query"

const TldListContext = createContext<string[] | null>(null)

export function Provider({ children }: { children: React.ReactNode }) {
  const { data = [] } = useQuery({
    queryKey: ["tld-list"],
    queryFn: async () => {
      const response = await fetch("/api/get-tld-list")
      return await response.json()
    },
    staleTime: Infinity,
  })

  return (
    <TldListContext.Provider value={data}>{children}</TldListContext.Provider>
  )
}

export function useTldList() {
  const ctx = useContext(TldListContext)
  if (!ctx) {
    throw new Error("useTldList must be used within a TldListProvider")
  }
  return ctx
}
