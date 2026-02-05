import { query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import directory from "../src/directory.json";

const featuredRepoMap = new Map(
  directory.map((repo) => [
    repo.source.replace("https://github.com/", "").replace(/\/$/, ""),
    repo.name,
  ])
);

const skillValidator = v.object({
  name: v.string(),
  repo: v.union(v.string(), v.null()),
  type: v.union(v.string(), v.null()),
  downloads: v.number(),
  sourceUrl: v.union(v.string(), v.null()),
  isFeatured: v.boolean(),
  featuredName: v.union(v.string(), v.null()),
});

export const getAllSkills = query({
  args: {},
  returns: v.array(skillValidator),
  handler: async (ctx) => {
    const events = await ctx.db
      .query("telemetry")
      .withIndex("by_command", (q) => q.eq("command", "add"))
      .filter((q) => q.eq(q.field("success"), true))
      .collect();

    const counts = new Map<
      string,
      { repo: string | null; downloads: number; sourceUrl: string | null; type: string | null }
    >();

    for (const event of events) {
      if (!event.name) continue;

      const existing = counts.get(event.name);
      if (existing) {
        existing.downloads++;
        if (!existing.sourceUrl && event.sourceUrl) {
          existing.sourceUrl = event.sourceUrl;
        }
        if (!existing.repo && event.repo) {
          existing.repo = event.repo;
        }
      } else {
        counts.set(event.name, {
          repo: event.repo ?? null,
          type: event.type ?? null,
          downloads: 1,
          sourceUrl: event.sourceUrl ?? null,
        });
      }
    }

    const skills = Array.from(counts.entries())
      .map(([name, data]) => {
        const extractOwnerRepo = (url: string | null) => {
          if (!url) return null;
          const withoutDomain = url.replace("https://github.com/", "");
          const parts = withoutDomain.split("/");
          return `${parts[0]}/${parts[1]}`;
        };

        const repoPath = extractOwnerRepo(data.sourceUrl) ?? data.repo ?? "";
        const featuredName = featuredRepoMap.get(repoPath) ?? null;

        return {
          name,
          repo: data.repo,
          type: data.type,
          downloads: data.downloads,
          sourceUrl: data.sourceUrl,
          isFeatured: featuredName !== null,
          featuredName,
        };
      })
      .sort((a, b) => b.downloads - a.downloads);

    return skills;
  },
});

export const getSkillsPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("telemetry")
      .withIndex("by_command", (q) => q.eq("command", "add"))
      .filter((q) => q.eq(q.field("success"), true))
      .collect();

    const counts = new Map<
      string,
      { repo: string | null; downloads: number; sourceUrl: string | null; type: string | null }
    >();

    for (const event of events) {
      if (!event.name) continue;

      const existing = counts.get(event.name);
      if (existing) {
        existing.downloads++;
        if (!existing.sourceUrl && event.sourceUrl) {
          existing.sourceUrl = event.sourceUrl;
        }
        if (!existing.repo && event.repo) {
          existing.repo = event.repo;
        }
      } else {
        counts.set(event.name, {
          repo: event.repo ?? null,
          type: event.type ?? null,
          downloads: 1,
          sourceUrl: event.sourceUrl ?? null,
        });
      }
    }

    let skills = Array.from(counts.entries())
      .map(([name, data]) => {
        const extractOwnerRepo = (url: string | null) => {
          if (!url) return null;
          const withoutDomain = url.replace("https://github.com/", "");
          const parts = withoutDomain.split("/");
          return `${parts[0]}/${parts[1]}`;
        };

        const repoPath = extractOwnerRepo(data.sourceUrl) ?? data.repo ?? "";
        const featuredName = featuredRepoMap.get(repoPath) ?? null;

        return {
          name,
          repo: data.repo,
          type: data.type,
          downloads: data.downloads,
          sourceUrl: data.sourceUrl,
          isFeatured: featuredName !== null,
          featuredName,
        };
      })
      .sort((a, b) => b.downloads - a.downloads);

    if (args.search) {
      const query = args.search.toLowerCase();
      skills = skills.filter(
        (skill) =>
          skill.name.toLowerCase().includes(query) ||
          (skill.repo?.toLowerCase().includes(query) ?? false)
      );
    }

    if (args.featured) {
      skills = skills.filter((skill) => skill.isFeatured);
    }

    const { cursor, numItems } = args.paginationOpts;
    const startIndex = cursor ? parseInt(cursor, 10) : 0;
    const endIndex = startIndex + numItems;
    const page = skills.slice(startIndex, endIndex);
    const continueCursor = endIndex < skills.length ? String(endIndex) : "";
    const isDone = endIndex >= skills.length;

    return {
      page,
      continueCursor,
      isDone,
    };
  },
});
