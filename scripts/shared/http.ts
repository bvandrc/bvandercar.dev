/** The response from `url`, throwing on any non-2xx status. */
export const fetchOk = async (url: string, init?: RequestInit) => {
  const res = await fetch(url, init)
  if (!res.ok) {
    throw new Error(`${res.status} for ${url}`)
  }
  return res
}

/** A JSON response from `url`, throwing on any non-2xx status. */
export const fetchJson = async <T>(url: string, init?: RequestInit) =>
  (await (await fetchOk(url, init)).json()) as T
