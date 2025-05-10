import { Agent, CredentialSession } from "@atproto/api"

const PLC_DIRECTORY = "https://plc.directory"

const publicAgent = new Agent({
  service: "https://public.api.bsky.app",
})

export async function resolvePDS(handleOrDid: string) {
  let did
  if (handleOrDid.startsWith("did:")) {
    did = handleOrDid
  } else {
    const res = await publicAgent.resolveHandle({ handle: handleOrDid })
    did = res.data.did
  }
  let didDoc: DidDocument
  if (did.startsWith("did:plc:")) {
    didDoc = await fetch(`${PLC_DIRECTORY}/${did}`).then((res) => res.json())
  } else {
    throw new Error("Unsupported DID method")
  }
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
