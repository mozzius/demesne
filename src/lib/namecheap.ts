import Namecheap, { INamecheapConfig } from "namecheap-ts"

const config: INamecheapConfig = {
  apiKey: process.env.NAMECHEAP_API_KEY!,
  apiUser: process.env.NAMECHEAP_API_USER!,
  username: process.env.NAMECHEAP_USERNAME!,
  clientIp: process.env.NAMECHEAP_CLIENT_IP!,
}

export const namecheap = new Namecheap(config)
