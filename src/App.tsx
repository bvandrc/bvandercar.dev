import './styles/index.css'

import { Header } from './components/Header'

export const App = () => (
  <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-10 px-5 py-12">
    <Header />
    <main data-testid="main">
      <p className="text-ink-muted">
        Skills, projects, and a little about me are on the way.
      </p>
    </main>
    <footer
      className="mt-auto border-t border-border pt-5 text-sm text-ink-muted"
      data-testid="footer">
      <a
        href="https://github.com/bvandrc"
        className="text-accent hover:text-accent-hover"
        data-testid="footer-github-link">
        github.com/bvandrc
      </a>
    </footer>
  </div>
)
