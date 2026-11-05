import './styles/index.css'

import { BeyondCode } from './components/BeyondCode'
import { Header } from './components/Header'
import { Projects } from './components/Projects'
import { TooltipProvider } from './components/primitives/Tooltip'
import { Skills } from './components/Skills'

export const App = () => (
  <TooltipProvider>
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-5 py-12 text-center">
      <Header />
      <main className="flex flex-col gap-14" data-testid="main">
        <Projects />
        <Skills />
        <BeyondCode />
      </main>
    </div>
  </TooltipProvider>
)
