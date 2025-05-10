import { Agent, CredentialSession } from "@atproto/api"

const publicAgent = new Agent({
  service: "https://public.api.bsky.app",
})

export async function resolvePDS(identifier: string) {
  const res = await publicAgent.com.atproto.identity.resolveIdentity({
    identifier,
  })
  if (!res.success) {
    throw new Error("Could not resolve identity")
  }
  const did = res.data.did
  const didDoc = res.data.didDoc as DidDocument
  const pds = didDoc.service?.findLast(
    (s) => s.type === "AtprotoPersonalDataServer",
  )?.serviceEndpoint

  if (!pds) {
    throw new Error("Found DID doc, but it had no associated PDS")
  }

  return { did, pds }
}

type DidDocument = {
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

export async function createAgentWithSession(
  service: URL,
  identifier: string,
  password: string,
) {
  const session = new CredentialSession(service)
  const res = await session.login({
    identifier,
    password,
  })
  if (!res.success) throw new Error("Sign in failed")
  return new Agent(session)
}
