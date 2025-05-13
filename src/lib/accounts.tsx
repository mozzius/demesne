import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { Agent, CredentialSession } from "@atproto/api"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

const ASYNC_STORAGE_KEY = "demesne-accounts"

const AccountSchema = z.object({
  did: z.string(),
  serviceUrl: z.string(),
  localKeys: z.array(z.string()),
  session: z.any(),
})

export type Account = {
  did: string
  serviceUrl: string
  localKeys: string[]
  agent?: Agent
}

const AccountContext = createContext<Account[] | undefined>(undefined)
const CreateSessionContext = createContext<
  (service: URL, identifier: string, password: string) => Promise<void>
>(() => Promise.resolve())
const ResumeSessionContext = createContext<(did: string) => Promise<void>>(() =>
  Promise.resolve(),
)
const RemoveAccountContext = createContext<(did: string) => void>(() => {})

export function AccountProvider({ children }: { children?: React.ReactNode }) {
  const [agents, setAgents] = useState<Record<string, Agent>>({})
  const queryClient = useQueryClient()

  const { data: accounts, error } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const data = await AsyncStorage.getItem(ASYNC_STORAGE_KEY)
      return AccountSchema.array().parse(JSON.parse(data || "[]"))
    },
  })

  useEffect(() => {
    if (error) console.error(error)
  }, [error])

  const value = useMemo(() => {
    if (!accounts) return undefined
    return accounts.map(({ did, serviceUrl, localKeys }) => {
      const agent = agents[did]
      return {
        did,
        serviceUrl,
        localKeys,
        agent,
      }
    })
  }, [accounts, agents])

  const createSession = useCallback(
    async (service: URL, identifier: string, password: string) => {
      if (!accounts) throw new Error("account data not yet loaded")

      const session = new CredentialSession(service)
      const res = await session.login({
        identifier,
        password,
      })
      if (!res.success) throw new Error("Sign in failed")

      const agent = new Agent(session)
      const { didDoc: _, ...sessionData } = res.data
      const did = sessionData.did

      setAgents((oldAgents) => ({ ...oldAgents, [did]: agent }))

      let newAccountData
      const existing = accounts.find((acc) => acc.did === did)
      if (existing) {
        newAccountData = accounts.map((acc) => {
          if (acc.did === did) {
            return {
              ...acc,
              serviceUrl: service.toString(),
              session: sessionData,
            }
          } else {
            return acc
          }
        })
      } else {
        newAccountData = [
          ...accounts,
          {
            did,
            serviceUrl: service.toString(),
            localKeys: [],
            session: sessionData,
          },
        ]
      }
      queryClient.setQueryData(["accounts"], newAccountData)
      await AsyncStorage.setItem(
        ASYNC_STORAGE_KEY,
        JSON.stringify(newAccountData),
      )
    },
    [accounts, queryClient],
  )

  const resumeSession = useCallback(
    async (did: string) => {
      if (!accounts) throw new Error("account data not yet loaded")
      const account = accounts.find((acc) => acc.did === did)
      if (!account) throw new Error("cannot find account to resume session for")
      if (!account.session) throw new Error("account has no saved session")
      const session = new CredentialSession(new URL(account.serviceUrl))
      const res = await session.resumeSession(account.session)

      if (!res.success) throw new Error("session resume failed")

      setAgents((oldAgents) => ({ ...oldAgents, [did]: new Agent(session) }))
    },
    [accounts],
  )

  const removeAccount = useCallback(
    async (did: string) => {
      if (!accounts) throw new Error("account data not yet loaded")

      const newAccountData = accounts.filter((acc) => acc.did !== did)

      queryClient.setQueryData(["accounts"], newAccountData)
      await AsyncStorage.setItem(
        ASYNC_STORAGE_KEY,
        JSON.stringify(newAccountData),
      )
    },
    [accounts, queryClient],
  )

  return (
    <AccountContext value={value}>
      <CreateSessionContext value={createSession}>
        <ResumeSessionContext value={resumeSession}>
          <RemoveAccountContext value={removeAccount}>
            {children}
          </RemoveAccountContext>
        </ResumeSessionContext>
      </CreateSessionContext>
    </AccountContext>
  )
}

export function useAccounts() {
  return use(AccountContext)
}

export function useCreateSession() {
  return use(CreateSessionContext)
}

export function useResumeSession() {
  return use(ResumeSessionContext)
}

export function useRemoveAccount() {
  return use(RemoveAccountContext)
}
