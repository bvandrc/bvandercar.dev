export const Header = () => (
  <header className="flex flex-col gap-3" data-testid="header">
    <img
      src={`${import.meta.env.BASE_URL}logo.svg`}
      alt=""
      width={40}
      height={40}
      className="size-10"
      data-testid="header-logo"
    />
    <h1
      className="text-3xl font-semibold tracking-tight"
      data-testid="header-title">
      React Frontend Template
    </h1>
    <p className="max-w-prose text-ink-muted" data-testid="header-tagline">
      A Vite + React + TypeScript starter, pre-wired with Tailwind, Biome, and
      Playwright suites for end-to-end, accessibility, and Lighthouse checks.
    </p>
  </header>
)
