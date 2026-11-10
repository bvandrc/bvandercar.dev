import { getThumbnailPath } from '../screenshots'

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
