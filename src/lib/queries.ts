import { AppBskyActorGetProfiles } from "@atproto/api"
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
    placeholderData: keepPreviousData,
  })
}

export function useProfileQuery(actor: string) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: ["get-profile", actor],
    queryFn: async () => {
      const res = await publicAgent.getProfile({ actor })
      return res.data
    },
    initialData: () => {
      const allProfiles =
        queryClient.getQueriesData<AppBskyActorGetProfiles.OutputSchema>({
          queryKey: ["get-profiles"],
        })
      for (const [, query] of allProfiles) {
        if (!query) continue
        for (const account of query.profiles) {
          // I guess actor could be handle or did? consider locking down to did
          if (account.did === actor || account.handle === actor) {
            return account
          }
        }
      }
    },
  })
}
