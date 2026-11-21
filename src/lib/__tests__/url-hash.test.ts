import { parseUrlHash } from '../url-hash'

/** `parseUrlHash`'s target, with its parameters as a plain object to compare. */
const parse = (hash: string) => {
  const target = parseUrlHash(hash)
  return target && { ...target, params: Object.fromEntries(target.params) }
}

describe('parseUrlHash', () => {
  it('splits the id from the parameters after its `?`', () => {
    expect(parse('#task-rankr?show_charts=true&b=2')).toEqual({
      id: 'task-rankr',
      params: { show_charts: 'true', b: '2' },
    })
  })

  it('decodes the id, and gives one with no `?` no parameters', () => {
    expect(parse('#caf%C3%A9')).toEqual({ id: 'café', params: {} })
  })

  it("names nothing for no `#`, no id before its `?`, or an id that won't decode", () => {
    const HASHES = ['', '#', '#?show_charts=true', '#100%']
    for (const hash of HASHES) {
      expect(parse(hash), hash).toBeUndefined()
    }
  })
})
