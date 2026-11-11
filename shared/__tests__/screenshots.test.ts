import { getPosterPath, getThumbnailPath } from '../screenshots'

describe('getThumbnailPath', () => {
  it("puts a screenshot's WebP thumbnail beside it, named for its width", () => {
    expect(
      getThumbnailPath(
        './project-screenshots/resized/screenshot-taskrankr.png',
        480
      )
    ).toBe('./project-screenshots/resized/screenshot-taskrankr.480w.webp')
  })

  it('replaces only the extension, past any dots before it', () => {
    expect(getThumbnailPath('./project-screenshots/site.com.jpeg', 900)).toBe(
      './project-screenshots/site.com.900w.webp'
    )
  })
})

describe('getPosterPath', () => {
  it("puts a screenshot's WebP poster beside it, named for its width", () => {
    expect(
      getPosterPath(
        './project-screenshots/resized/screenshot-taskrankr.png',
        900
      )
    ).toBe(
      './project-screenshots/resized/screenshot-taskrankr.poster.900w.webp'
    )
  })

  it('replaces only the extension, past any dots before it', () => {
    expect(getPosterPath('./project-screenshots/site.com.jpeg', 480)).toBe(
      './project-screenshots/site.com.poster.480w.webp'
    )
  })
})
