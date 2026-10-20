export const SITE_NAME = '林深';
export const SITE_TAGLINE = '前端工程师 · 关注交互与性能';
export const MAX_PAGE_SIZE = 50;
export const DEFAULT_PAGE_SIZE = 10;

export const SKILL_LEVEL_LABELS: Record<string, string> = {
  proficient: '熟练',
  familiar: '熟悉',
  learning: '了解',
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  live: '线上项目',
  oss: '开源项目',
  archived: '已归档',
};

export const REVALIDATE_TAGS = {
  posts: 'posts:list',
  post: (slug: string) => `post:${slug}`,
  projects: 'projects:list',
  project: (slug: string) => `project:${slug}`,
  site: 'site',
} as const;
