import { Agent } from "@atproto/api"
import { useQuery } from "@tanstack/react-query"

const PLC_DIRECTORY = "https://plc.directory"

export const publicAgent = new Agent({
  service: "https://public.api.bsky.app",
})

export function useIdentityQuery(
  identifier: string,
  { enabled } = { enabled: true },
) {
  return useQuery({
    queryKey: ["identity", identifier],
    queryFn: async () => {
      let did

      if (identifier.startsWith("did:plc:")) {
        did = identifier
      } else if (identifier.startsWith("did:")) {
        throw new Error("Unsupported DID method")
      } else {
        const res = await publicAgent.resolveHandle({
          handle: identifier,
        })
        did = res.data.did
      }

      const plcData: PlcData = await fetch(`${PLC_DIRECTORY}/${did}/data`).then(
        (res) => res.json(),
      )

      const pds = plcData.services?.atproto_pds?.endpoint

      if (!pds) {
        throw new Error("Found DID doc, but it had no associated PDS")
      }

      return {
        did,
        plcData,
        pds,
      }
    },
    enabled,
  })
}

export type DidDocument = {
  "@context": string[]
  id: string
  alsoKnownAs?: string[]
  verificationMethod?: {
    id: string
    type: string
    controller: string
    publicKeyMultibase?: string
  }[]
  service?: { id: string; type: string; serviceEndpoint: string }[]
}

export type PlcData = {
  did: string
  verificationMethods?: {
    atproto?: "did:key:zQ3shhB2yHGn8JbXPAYX6LcEBrWo1nALhWLGa11YBqU2zB9Sm"
    [key: string]: unknown
  }
  rotationKeys: string[]
  alsoKnownAs: string[]
  services?: {
    atproto_pds?: {
      type: "AtprotoPersonalDataServer"
      endpoint: "https://amanita.us-east.host.bsky.network"
    }
    [key: string]: unknown
  }
}
