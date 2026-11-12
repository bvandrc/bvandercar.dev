import './styles/index.css'

import { BeyondCode } from './components/BeyondCode'
import { Contents } from './components/Contents'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Projects } from './components/Projects'
import { TooltipProvider } from './components/primitives/Tooltip'
import { Skills } from './components/Skills'
import { useScrollToUrlHash } from './hooks/useScrollToUrlHash'
import { cn } from './lib/cn'

export const App = () => {
  useScrollToUrlHash()
  return (
    <TooltipProvider>
      <div
        className={cn(
          'mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-5 pt-6 text-center',
          // The same space below the footer's links as between them and its rule.
          'pb-3'
        )}>
        {/* The contents as near the social links as the links are to the
            intro, in the header's own gap. */}
        <div className="flex flex-col gap-3">
          <Header />
          <Contents />
        </div>
        <main className="flex flex-col gap-8" data-testid="main">
          <Projects />
          <Skills />
          <BeyondCode />
        </main>
        <Footer />
      </div>
    </TooltipProvider>
  )
}
