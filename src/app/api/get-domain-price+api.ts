import { namecheap } from "#/lib/namecheap"
import { getDomainPriceSchema } from "#/lib/schemas"

export async function GET(request: Request) {
  const params = new URLSearchParams(request.url.split("?")[1])
  const query = params.get("q") || ""

  const [{ data: register }, { data: renew }] = await Promise.all([
    namecheap.getDomainPrice(query, "REGISTER"),
    namecheap.getDomainPrice(query, "RENEW"),
  ])

  return Response.json(getDomainPriceSchema.parse({ register, renew }))
}
