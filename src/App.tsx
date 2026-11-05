import './styles/index.css'

import { BeyondCode } from './components/BeyondCode'
import { Header } from './components/Header'
import { Projects } from './components/Projects'
import { Link } from './components/primitives/Link'
import { Skills } from './components/Skills'

export const App = () => (
  <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-10 px-5 py-12 text-center">
    <Header />
    <main className="flex flex-col gap-14" data-testid="main">
      <Projects />
      <Skills />
      <BeyondCode />
    </main>
    <footer
      className="mt-auto border-t border-border pt-5 text-sm text-ink-muted"
      data-testid="footer">
      <Link href="https://github.com/bvandrc" data-testid="footer-github-link">
        github.com/bvandrc
      </Link>
    </footer>
  </div>
)
