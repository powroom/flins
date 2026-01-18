# Adding Skills to flins Directory

Want your skill listed in the flins directory? Here's how.

## Requirements

Your skill should:

- Follow the [Agent Skills](https://agentskills.io) standard (valid `SKILL.md`)
- Be actively maintained
- Have clear documentation
- Work with compatible agents
- Have a permissive license (MIT, Apache-2.0, etc.)

## How to Submit

Edit [`apps/web/src/directory.json`](https://github.com/flinstech/flins/blob/main/apps/web/src/directory.json) and add your skill:

```json
{
  "name": "your-skill",
  "source": "https://github.com/username/repo",
  "description": "Brief description of what it does",
  "author": "username",
  "tags": ["category1", "category2"]
}
```

**Fields:**

| Field         | Description                           |
| ------------- | ------------------------------------- |
| `name`        | Lowercase kebab-case identifier       |
| `source`      | Full HTTPS URL to git repo            |
| `description` | 1-2 sentences, what it does           |
| `author`      | GitHub username or org                |
| `tags`        | 1-5 lowercase tags for categorization |

## What We Look For

- Popular frameworks and libraries
- Developer tools (Docker, K8s, CI/CD)
- Cloud platforms (Vercel, AWS, Cloudflare)
- Databases, testing frameworks, APIs
- Security and performance tools

## We Usually Decline

- Very narrow or niche use cases
- Duplicates of existing entries
- Poorly documented or unmaintained repos

---

Questions? [Open an issue](https://github.com/flinstech/flins/issues).
