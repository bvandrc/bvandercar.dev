import './styles/index.css'

import { BeyondCode } from './components/BeyondCode'
import { Header } from './components/Header'
import { Projects } from './components/Projects'
import { TooltipProvider } from './components/primitives/Tooltip'
import { Skills } from './components/Skills'
import { cn } from './lib/cn'

export const App = () => (
  <TooltipProvider>
    <div
      className={cn(
        'mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-5 pb-12 text-center',
        // Half the bottom's space above the header, so it sits nearer the top.
        'pt-6'
      )}>
      <Header />
      <main className="flex flex-col gap-10" data-testid="main">
        <Projects />
        <Skills />
        <BeyondCode />
      </main>
    </div>
  </TooltipProvider>
)
