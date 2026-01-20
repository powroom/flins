import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'

const COMMANDS = [
  'add <src>',
  'update',
  'remove',
  'outdated',
  'clean',
  'list',
  'search',
] as const

const PACKAGE_MANAGERS = {
  flins: { prefix: 'flins', label: 'flins' },
  npm: { prefix: 'npx flins@latest', label: 'npm' },
  bun: { prefix: 'bunx flins', label: 'bun' },
  pnpm: { prefix: 'pnpm dlx flins', label: 'pnpm' },
  yarn: { prefix: 'yarn dlx flins', label: 'yarn' },
} as const

function TerminalLine({ command }: { command: string }) {
  return (
    <div className="flex flex-col text-xs font-mono">
      <span className="flex gap-2">
        <span className="text-cyan-500">pow</span> at
        <span className="text-cyan-500">Pow-MacBook-Pro</span> in
        <span className="text-emerald-500">~</span>
      </span>
      <span>» {command}</span>
    </div>
  )
}

export function FlinsCommands() {
  return (
    <Tabs defaultValue="flins">
      <TabsList>
        {Object.values(PACKAGE_MANAGERS).map(({ label }) => (
          <TabsTab key={label} value={label}>
            {label}
          </TabsTab>
        ))}
      </TabsList>
      {Object.entries(PACKAGE_MANAGERS).map(([key, { prefix, label }]) => (
        <TabsPanel key={key} value={label} className="space-y-2 mt-2">
          {COMMANDS.map((cmd) => (
            <TerminalLine key={cmd} command={`${prefix} ${cmd}`} />
          ))}
        </TabsPanel>
      ))}
    </Tabs>
  )
}
