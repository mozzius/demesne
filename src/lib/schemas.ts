import { z } from "zod"

export const typeaheadSchema = z.object({
  typeaheadSuggestions: z
    .array(
      z.object({
        domainName: z.string(),
      }),
    )
    .max(10),
})

export const checkDomainsSchema = z.object({
  domains: z.array(
    z
      .object({
        Domain: z.string(),
        Available: z.boolean(),
      })
      .passthrough(),
  ),
})
