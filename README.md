<div align="center">

# give-skill

**Universal skill installer for AI coding agents**

One CLI to install agent skills across all your coding assistants.

[![npm version](https://badge.fury.io/js/give-skill.svg)](https://www.npmjs.org/package/give-skill)
[![Agent Skills](https://img.shields.io/badge/Agent_Skills-standard-blue)](https://agentskills.io)

</div>

## Why give-skill?

The [Agent Skills](https://agentskills.io) format is an open standard for extending AI agents with new capabilities. `give-skill` lets you install skills from any git repository to all your skill-compatible agents in one command.

### Supported Agents

All agents support the [Agent Skills](https://agentskills.io) open standard:

| Agent                                                 | Status |
| ----------------------------------------------------- | ------ |
| [Claude Code](https://claude.com/product/claude-code) | ✅     |
| [Cursor](https://cursor.sh)                           | ✅     |
| [GitHub Copilot](https://github.com/features/copilot) | ✅     |
| [OpenCode](https://opencode.ai)                       | ✅     |
| [Codex](https://openai.com/codex)                     | ✅     |
| [Antigravity](https://antigravity.google)             | ✅     |
| [Amp](http://ampcode.com)                             | ✅     |
| [Kilo Code](https://kilocode.ai)                      | ✅     |
| [Roo Code](https://roocode.com)                       | ✅     |
| [Goose](https://block.github.io/goose)                | ✅     |

Missing an agent? [Create an issue](https://github.com/compilecafe/give-skill/issues)

## Installation

```bash
# Using npx
npx give-skill <repo>

# Using bunx
bunx give-skill <repo>

# Or install globally
npm install -g give-skill
give-skill <repo>
```

## Quick Start

Install skills from any git repository:

```bash
# Install from GitHub (shorthand)
npx give-skill expo/skills

# Install from full URL
npx give-skill https://github.com/expo/skills

# Install to specific agent
npx give-skill expo/skills -a copilot

# Install globally (available in all projects)
npx give-skill expo/skills --global

# List available skills first
npx give-skill expo/skills --list
```

## Command Reference

```
give-skill <source> [options]

Arguments:
  source                  Git repo URL or GitHub shorthand (owner/repo)

Options:
  -g, --global            Install to home directory instead of project
  -a, --agent <...>       Target specific agents (claude-code, cursor, copilot, etc.)
  -s, --skill <...>       Install specific skills by name
  -l, --list              List skills without installing
  -y, --yes               Skip all prompts (CI-friendly)
  -V, --version           Show version
  -h, --help              Show help
```

## Examples

### Install specific skills

```bash
npx give-skill expo/skills -s pr-reviewer -s test-generator
```

### Target multiple agents

```bash
npx give-skill expo/skills -a claude-code -a copilot -a cursor
```

### CI/CD automation

```bash
npx give-skill expo/skills -s pr-reviewer -g -a copilot -y
```

### Install from subdirectory

```bash
npx give-skill https://github.com/org/repo/tree/main/skills/custom
```

## Where Skills Go

### Project Level (default)

| Agent       | Path                       |
| ----------- | -------------------------- |
| Claude Code | `.claude/skills/<name>/`   |
| Cursor      | `.cursor/skills/<name>/`   |
| Copilot     | `.github/skills/<name>/`   |
| OpenCode    | `.opencode/skill/<name>/`  |
| Codex       | `.codex/skills/<name>/`    |
| Antigravity | `.agent/skills/<name>/`    |
| Amp         | `.agents/skills/<name>/`   |
| Kilo Code   | `.kilocode/skills/<name>/` |
| Roo Code    | `.roo/skills/<name>/`      |
| Goose       | `.goose/skills/<name>/`    |

### Global Level (`--global`)

| Agent       | Path                                   |
| ----------- | -------------------------------------- |
| Claude Code | `~/.claude/skills/<name>/`             |
| Cursor      | `~/.cursor/skills/<name>/`             |
| Copilot     | `~/.copilot/skills/<name>/`            |
| OpenCode    | `~/.config/opencode/skill/<name>/`     |
| Codex       | `~/.codex/skills/<name>/`              |
| Antigravity | `~/.gemini/antigravity/skills/<name>/` |
| Amp         | `~/.config/agents/skills/<name>/`      |
| Kilo Code   | `~/.kilocode/skills/<name>/`           |
| Roo Code    | `~/.roo/skills/<name>/`                |
| Goose       | `~/.config/goose/skills/<name>/`       |

## Creating Skills

Skills follow the [Agent Skills](https://agentskills.io) open standard. A skill is a folder with a `SKILL.md` file:

```markdown
---
name: pr-reviewer
description: Reviews pull requests against team guidelines
---

# PR Reviewer

Reviews pull requests for:

- Code style consistency
- Security vulnerabilities
- Performance issues

## Usage

Activate when reviewing a pull request.
```

For complete skill authoring guidance, see [agentskills.io](https://agentskills.io).

### Skill Locations

The CLI automatically searches these paths in a repository:

**Common locations:**

- `SKILL.md` (root)
- `skills/`
- `skills/.curated/`
- `skills/.experimental/`
- `skills/.system/`

**Agent-specific locations** (auto-detected from agent configs):

- `.claude/skills/`
- `.cursor/skills/`
- `.github/skills/`
- `.opencode/skill/`
- `.codex/skills/`
- `.agent/skills/`
- `.agents/skills/`
- `.kilocode/skills/`
- `.roo/skills/`
- `.goose/skills/`

If a folder matches an agent's skill directory, the CLI will find it.

## How It Works

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│   Source    │────▶│  give-skill │────▶│  Agent Folders   │
│  (git repo) │     │    (CLI)    │     │  (installed)     │
└─────────────┘     └─────────────┘     └──────────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ Auto-detect  │
                   │   agents     │
                   └──────────────┘
```

1. **Clone** the source repository
2. **Discover** all `SKILL.md` files
3. **Detect** installed agents on your system
4. **Install** skills to agent-specific directories

## Troubleshooting

### No skills found

Make sure your `SKILL.md` follows the [Agent Skills](https://agentskills.io) format:

```markdown
---
name: my-skill
description: This describes what the skill does
---
```

### Permission denied

Check you have write permissions for the target directory.

### Agent not detected

The CLI checks default agent directories. Manually specify with `-a` if needed.

## License

MIT © [Compile Café](https://github.com/compilecafe)
