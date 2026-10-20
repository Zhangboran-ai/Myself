import type { MetadataRoute } from 'next';
import { getPosts, getProjects } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

async function allPosts() {
  const items = [];
  let page = 1;
  for (;;) {
    const data = await getPosts({ page, pageSize: 50 });
    items.push(...data.items);
    if (page >= data.meta.totalPages) break;
    page += 1;
  }
  return items;
}

async function allProjects() {
  const items = [];
  let page = 1;
  for (;;) {
    const data = await getProjects({ page, pageSize: 50 });
    items.push(...data.items);
    if (page >= data.meta.totalPages) break;
    page += 1;
  }
  return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects] = await Promise.all([allPosts(), allProjects()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/projects`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'yearly', priority: 0.6 },
  ];

  return [
    ...staticRoutes,
    ...projects.map((project) => ({
      url: `${SITE_URL}/projects/${project.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
