import './styles/index.css'

import { FeatureList } from './components/FeatureList'
import { Header } from './components/Header'

export const App = () => (
  <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-10 px-5 py-12">
    <Header />
    <main>
      <FeatureList />
    </main>
    <footer
      className="mt-auto border-t border-border pt-5 text-sm text-ink-muted"
      data-testid="footer">
      Replace this page with your app.
    </footer>
  </div>
)
