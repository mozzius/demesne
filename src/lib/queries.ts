import type { AppBskyActorGetProfiles } from "@atproto/api"
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useAccounts } from "./accounts"
import { publicAgent } from "./agent"

export function useAccountProfilesQuery() {
  const accounts = useAccounts()
  const dids = accounts?.map((x) => x.did) ?? []

  return useQuery({
    queryKey: ["get-profiles", dids],
    queryFn: async () => {
      const res = await publicAgent.getProfiles({ actors: dids })
      return res.data
    },
    enabled: dids.length > 0,
    placeholderData: keepPreviousData,
  })
}

export function useProfileQuery(did: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ["get-profile", did],
    queryFn: async () => {
      const res = await publicAgent.getProfile({ actor: did })
      return res.data
    },
    initialData: () => {
      const cached =
        queryClient.getQueriesData<AppBskyActorGetProfiles.OutputSchema>({
          queryKey: ["get-profiles"],
        })
      for (const [, data] of cached) {
        const profile = data?.profiles.find((p) => p.did === did)
        if (profile) return profile
      }
    },
  })
}
