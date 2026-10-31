import { Agent } from "@atproto/api"

export const publicAgent = new Agent({
  service: "https://public.api.bsky.app",
})
