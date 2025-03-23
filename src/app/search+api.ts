export function GET(request: Request) {
  const params = new URLSearchParams(request.url.split("?")[1])
  const query = params.get("q") || ""
  console.log("Got:", query)
  return Response.json({ search: query })
}
