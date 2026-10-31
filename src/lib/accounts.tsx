import { createContext, use, useEffect, useMemo, useState } from "react"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Agent, CredentialSession, type AtpSessionData } from "@atproto/api"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import { z } from "zod"

const ASYNC_STORAGE_KEY = "demesne-accounts"
const ACCOUNTS_QUERY_KEY = ["accounts"] as const

const StoredAccountSchema = z.object({
  did: z.string(),
  serviceUrl: z.string(),
  localKeys: z.array(z.string()),
  session: z.custom<AtpSessionData>().optional(),
})

type StoredAccount = z.infer<typeof StoredAccountSchema>

export type Account = {
  did: string
  serviceUrl: string
  localKeys: string[]
  agent?: Agent
}

export type SignedInAccount = Required<Account>

type AccountActions = {
  createSession: (args: {
    service: URL
    identifier: string
    password: string
    authFactorToken?: string
  }) => Promise<void>
  resumeSession: (did: string) => Promise<void>
  removeAccount: (did: string) => Promise<void>
  saveKey: (did: string, key: string) => Promise<void>
}

const AccountsContext = createContext<Account[] | undefined>(undefined)
const AccountActionsContext = createContext<AccountActions | null>(null)

async function loadAccounts() {
  const data = await AsyncStorage.getItem(ASYNC_STORAGE_KEY)
  return StoredAccountSchema.array().parse(JSON.parse(data || "[]"))
}

/**
 * Applies `update` to the latest stored accounts (not a render-time snapshot,
 * so concurrent updates such as session refreshes don't clobber each other),
 * then persists the result.
 */
async function updateAccounts(
  queryClient: QueryClient,
  update: (accounts: StoredAccount[]) => StoredAccount[],
) {
  const current =
    queryClient.getQueryData<StoredAccount[]>(ACCOUNTS_QUERY_KEY) ??
    (await loadAccounts())
  const next = update(current)
  queryClient.setQueryData(ACCOUNTS_QUERY_KEY, next)
  await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(next))
}

function createPersistedSession(
  service: URL,
  did: () => string | undefined,
  queryClient: QueryClient,
) {
  return new CredentialSession(service, undefined, (evt, data) => {
    const accountDid = data?.did ?? did()
    if (!accountDid) return
    if (evt === "create" || evt === "update") {
      if (!data) return
      void updateAccounts(queryClient, (accounts) =>
        accounts.map((acc) =>
          acc.did === accountDid ? { ...acc, session: data } : acc,
        ),
      )
    } else if (evt === "expired") {
      void updateAccounts(queryClient, (accounts) =>
        accounts.map((acc) =>
          acc.did === accountDid ? { ...acc, session: undefined } : acc,
        ),
      )
    }
  })
}

export function AccountProvider({ children }: { children?: React.ReactNode }) {
  const [agents, setAgents] = useState<Record<string, Agent>>({})
  const queryClient = useQueryClient()

  const { data: accounts } = useQuery({
    queryKey: ACCOUNTS_QUERY_KEY,
    queryFn: loadAccounts,
    staleTime: Infinity,
  })

  const value = useMemo(
    () =>
      accounts?.map(({ did, serviceUrl, localKeys }) => ({
        did,
        serviceUrl,
        localKeys,
        agent: agents[did],
      })),
    [accounts, agents],
  )

  const actions = useMemo<AccountActions>(
    () => ({
      createSession: async ({
        service,
        identifier,
        password,
        authFactorToken,
      }) => {
        let did: string | undefined
        const session = createPersistedSession(service, () => did, queryClient)
        const res = await session.login({
          identifier,
          password,
          authFactorToken,
        })
        if (!res.success) throw new Error("Sign in failed")

        const { didDoc: _, ...sessionData } = res.data
        did = sessionData.did

        await updateAccounts(queryClient, (accounts) => {
          const existing = accounts.find((acc) => acc.did === did)
          const updated: StoredAccount = {
            did: sessionData.did,
            serviceUrl: service.toString(),
            localKeys: existing?.localKeys ?? [],
            session: session.session,
          }
          return existing
            ? accounts.map((acc) => (acc.did === did ? updated : acc))
            : [...accounts, updated]
        })
        setAgents((prev) => ({
          ...prev,
          [sessionData.did]: new Agent(session),
        }))
      },

      resumeSession: async (did) => {
        const stored =
          queryClient.getQueryData<StoredAccount[]>(ACCOUNTS_QUERY_KEY)
        const account = stored?.find((acc) => acc.did === did)
        if (!account) throw new Error("Cannot find account to resume")
        if (!account.session) throw new Error("Account has no saved session")

        const session = createPersistedSession(
          new URL(account.serviceUrl),
          () => did,
          queryClient,
        )
        await session.resumeSession(account.session)
        setAgents((prev) => ({ ...prev, [did]: new Agent(session) }))
      },

      removeAccount: async (did) => {
        setAgents(({ [did]: _, ...rest }) => rest)
        await updateAccounts(queryClient, (accounts) =>
          accounts.filter((acc) => acc.did !== did),
        )
      },

      saveKey: async (did, key) => {
        await updateAccounts(queryClient, (accounts) =>
          accounts.map((acc) =>
            acc.did === did
              ? { ...acc, localKeys: [...acc.localKeys, key] }
              : acc,
          ),
        )
      },
    }),
    [queryClient],
  )

  return (
    <AccountsContext value={value}>
      <AccountActionsContext value={actions}>{children}</AccountActionsContext>
    </AccountsContext>
  )
}

export function useAccounts() {
  return use(AccountsContext)
}

export function useAccountActions() {
  const actions = use(AccountActionsContext)
  if (!actions) {
    throw new Error("useAccountActions must be used inside <AccountProvider>")
  }
  return actions
}

/**
 * The signed-in account for the `[did]` route param, or `undefined` if it
 * isn't signed in. Screens should redirect home when this is `undefined`.
 */
export function useCurrentAccount(): SignedInAccount | undefined {
  const { did } = useLocalSearchParams<{ did: string }>()
  const accounts = useAccounts()
  const account = accounts?.find((acc) => acc.did === did)
  if (!account?.agent) return undefined
  return account as SignedInAccount
}

/**
 * Renders `children` with the signed-in account for the `[did]` route param.
 * If that account isn't signed in (e.g. it was removed or its session
 * expired), navigates back to the account list instead.
 */
export function WithCurrentAccount({
  children,
}: {
  children: (account: SignedInAccount) => React.ReactNode
}) {
  const account = useCurrentAccount()
  const router = useRouter()

  useEffect(() => {
    if (!account) router.dismissTo("/")
  }, [account, router])

  return account ? children(account) : null
}
