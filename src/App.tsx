import './styles/index.css'

import { BeyondCode } from './components/BeyondCode'
import { Contents } from './components/Contents'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Projects } from './components/Projects'
import { TooltipProvider } from './components/primitives/Tooltip'
import { Skills } from './components/Skills'
import { cn } from './lib/cn'

export const App = () => (
  <TooltipProvider>
    <div
      className={cn(
        'mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-5 text-center',
        // The same space below the footer's links as between them and its rule.
        'py-6'
      )}>
      <Header />
      <Contents />
      <main className="flex flex-col gap-10" data-testid="main">
        <Projects />
        <Skills />
        <BeyondCode />
      </main>
      <Footer />
    </div>
  </TooltipProvider>
)
