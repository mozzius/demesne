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
    z.object({
      Domain: z.string(),
      Available: z.boolean(),
      IsPremiumName: z.boolean(),
      PremiumRegistrationPrice: z.number(),
      PremiumRenewalPrice: z.number(),
      PremiumRestorePrice: z.number(),
      PremiumTransferPrice: z.number(),
      IcannFee: z.number(),
      EapFee: z.number(),
    }),
  ),
})

const priceListSchema = z.array(
  z.object({
    AdditionalCost: z.number(),
    Currency: z.string(),
    Duration: z.number().int().positive(),
    DurationType: z.string(),
    Price: z.number(),
    PricingType: z.string(),
    PromotionPrice: z.number(),
    RegularAdditionalCost: z.number(),
    RegularAdditionalCostType: z.string(),
    RegularPrice: z.number(),
    RegularPriceType: z.string(),
    YourAdditonalCost: z.number().optional(),
    YourAdditonalCostType: z.string().optional(),
    YourPrice: z.number(),
    YourPriceType: z.string(),
  }),
)

export const getDomainPriceSchema = z.object({
  register: priceListSchema,
  renew: priceListSchema,
})
