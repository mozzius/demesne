import { useQuery } from "@tanstack/react-query"

import { publicAgent } from "./agent"

const PLC_DIRECTORY = "https://plc.directory"

export type PlcData = {
  did: string
  verificationMethods?: Record<string, string>
  rotationKeys: string[]
  alsoKnownAs: string[]
  services?: Record<string, { type: string; endpoint: string } | undefined>
}

type PlcOperation = {
  type: "plc_operation"
  sig: string
  prev: string | null
  services: PlcData["services"]
  alsoKnownAs: string[]
  rotationKeys: string[]
  verificationMethods: Record<string, string>
}

export type AuditRecord = {
  did: string
  operation:
    | PlcOperation
    | {
        type: "create"
        signingKey: string
        recoveryKey: string
        handle: string
        service: string
        prev: string | null
        sig: string
      }
    | {
        type: "plc_tombstone"
        sig: string
        prev: string
      }
  cid: string
  nullified: boolean
  createdAt: string
}

export type { PlcOperation }

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request to ${url} failed: ${res.status}`)
  return (await res.json()) as T
}

/**
 * Resolves a handle or did:plc to its PLC data and PDS endpoint.
 */
export function useIdentityQuery(
  identifier: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["identity", identifier],
    queryFn: async () => {
      let did: string
      if (identifier.startsWith("did:plc:")) {
        did = identifier
      } else if (identifier.startsWith("did:")) {
        throw new Error("Only did:plc identities are supported")
      } else {
        const res = await publicAgent.resolveHandle({ handle: identifier })
        did = res.data.did
      }

      const plcData = await fetchJson<PlcData>(`${PLC_DIRECTORY}/${did}/data`)
      const pds = plcData.services?.atproto_pds?.endpoint
      if (!pds) throw new Error("Found DID doc, but it had no associated PDS")

      return { did, plcData, pds }
    },
    enabled: enabled && !!identifier,
  })
}

export function useAuditLogQuery(did: string) {
  return useQuery({
    queryKey: ["audit", did],
    queryFn: () =>
      fetchJson<AuditRecord[]>(`${PLC_DIRECTORY}/${did}/log/audit`),
  })
}
