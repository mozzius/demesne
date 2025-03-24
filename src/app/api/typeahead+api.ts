import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"

import { typeaheadSchema } from "#/lib/schemas"

export async function GET(request: Request) {
  const params = new URLSearchParams(request.url.split("?")[1])
  const query = params.get("q") || ""

  const suggestions = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: typeaheadSchema,
    prompt: `Provide suggestions for new domain names that contain "${query}", with a variety of extensions. If a name is "common" and likely to be taken, suggest an alternative.`,
  })

  return suggestions.toJsonResponse()
}
