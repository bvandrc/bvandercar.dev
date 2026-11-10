import { getThumbnailPath } from '../screenshots'

describe('getThumbnailPath', () => {
  it("puts a screenshot's WebP thumbnail beside it", () => {
    expect(
      getThumbnailPath('./project-screenshots/resized/screenshot-taskrankr.png')
    ).toBe('./project-screenshots/resized/screenshot-taskrankr.thumb.webp')
  })

  it('replaces only the extension, past any dots before it', () => {
    expect(getThumbnailPath('./project-screenshots/site.com.jpeg')).toBe(
      './project-screenshots/site.com.thumb.webp'
    )
  })
})
