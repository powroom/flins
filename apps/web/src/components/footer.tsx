import { SiGithub } from '@icons-pack/react-simple-icons'
import { Link } from '@tanstack/react-router'
import SectionDivider from './section-divider'

const Footer = () => {
  return (
    <>
      <SectionDivider />

      <footer className="border-t">
        <div className="max-w-7xl border-x px-8 mx-auto py-4 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <Link to="/">flins</Link>
            <p className="text-muted-foreground text-sm">
              Universal skill and command manager for AI coding agents
            </p>
          </div>
          <a
            href="https://github.com/flinstech/flins"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub (opens in new tab)"
          >
            <SiGithub aria-hidden="true" />
          </a>
        </div>
      </footer>
    </>
  )
}

export default Footer
