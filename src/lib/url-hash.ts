/** What a URL's `#` names: an element's id, and any parameters after a `?`, as in `#task-rankr?show_charts=true`. */
export type UrlHashTarget = {
  id: string
  params: URLSearchParams
}

/**
 * The target a URL's `#`, like `location.hash`, names.
 *
 * `undefined` for no `#`, one with no id before its `?`, or one whose id
 * won't decode.
 */
export const parseUrlHash = (hash: string): UrlHashTarget | undefined => {
  const body = hash.replace(/^#/, '')
  const queryStart = body.indexOf('?')
  const encodedId = queryStart === -1 ? body : body.slice(0, queryStart)
  const query = queryStart === -1 ? '' : body.slice(queryStart + 1)
  try {
    const id = decodeURIComponent(encodedId)
    return id ? { id, params: new URLSearchParams(query) } : undefined
  } catch {
    // A stray `%`, like `#100%`, which names nothing on the page anyway.
    return
  }
}
