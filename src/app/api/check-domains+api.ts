import { Commands } from "namecheap-ts"

import { namecheap } from "#/lib/namecheap"
import { checkDomainsSchema } from "#/lib/schemas"

export async function GET(request: Request) {
  const params = new URLSearchParams(request.url.split("?")[1])
  const query = params.get("q") || ""

  const result = await namecheap.call(Commands.DOMAINS_CHECK, {
    DomainList: query,
  })

  let domains = []

  if (Array.isArray(result.data.DomainCheckResult)) {
    domains = result.data.DomainCheckResult.map(
      (domain: { ["$"]: any }) => domain.$,
    )
  } else {
    domains = [result.data.DomainCheckResult.$]
  }

  return Response.json(checkDomainsSchema.parse({ domains }))
}
