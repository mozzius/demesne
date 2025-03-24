import { Commands } from "namecheap-ts"
import tlds from "tlds"

import { namecheap } from "#/lib/namecheap"

export async function GET(request: Request) {
  const result = await namecheap.call(Commands.DOMAINS_GETTLDLIST, {})

  return Response.json(
    result.data.Tlds.Tld.map((tld: any) => tld.$.Name)
      // filter out bullshit handshake garbage
      .filter((tld: string | number) =>
        tlds.some((real) => String(tld).endsWith(real)),
      ),
    {
      headers: {
        "Cache-Control": "public, max-age=10000",
      },
    },
  )
}
