import type {
  ContactMessageItem,
  ContactMessageStatus,
  Experience,
  MediaItem,
  Paginated,
  PageMeta,
  PostDetail,
  PostRevisionItem,
  PostSummary,
  Profile,
  ProjectDetail,
  ProjectSummary,
  SkillGroup,
  StatsOverview,
  TagItem,
} from '@myself/shared';

const BASE_URL = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:4000/api/v1';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiOptions {
  tags?: string[];
  revalidate?: number | false;
  cookie?: string;
}

interface Envelope<T> {
  data: T;
}

async function apiGet<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { tags = [], revalidate = 60, cookie } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (cookie) headers.cookie = cookie;

  const response = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...(revalidate === false
      ? { cache: 'no-store' as const }
      : { next: { revalidate, tags } }),
  });

  if (!response.ok) {
    let detail = `请求失败（${response.status}）`;
    try {
      const body = (await response.json()) as { detail?: string; title?: string };
      detail = body.detail ?? body.title ?? detail;
    } catch {
      // 响应不是 JSON 时保留默认文案
    }
    throw new ApiError(response.status, detail);
  }

  const body = (await response.json()) as Envelope<T>;
  return body.data;
}

export interface SitePayload {
  profile: Profile;
  experiences: Experience[];
}

export async function getSite(): Promise<SitePayload> {
  return apiGet<SitePayload>('/site', { tags: ['site'], revalidate: 300 });
}

export async function getSkills(): Promise<SkillGroup[]> {
  return apiGet<SkillGroup[]>('/skills', { tags: ['site'], revalidate: 300 });
}

interface PostListParams {
  page?: number;
  pageSize?: number;
  tag?: string;
  q?: string;
}

export async function getPosts(params: PostListParams = {}): Promise<Paginated<PostSummary>> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  if (params.tag) search.set('tag', params.tag);
  if (params.q) search.set('q', params.q);

  const query = search.toString();
  const tag = params.tag ? `tag:${params.tag}` : 'posts:list';
  return apiGet<Paginated<PostSummary>>(`/posts${query ? `?${query}` : ''}`, {
    tags: ['posts:list', tag],
    revalidate: 60,
  });
}

export async function getPost(slug: string): Promise<PostDetail> {
  return apiGet<PostDetail>(`/posts/${encodeURIComponent(slug)}`, {
    tags: ['posts:list', `post:${slug}`],
    revalidate: 60,
  });
}

export async function getTags(): Promise<TagItem[]> {
  return apiGet<TagItem[]>('/tags', { tags: ['posts:list'], revalidate: 120 });
}

interface ProjectListParams {
  page?: number;
  pageSize?: number;
  tech?: string;
  year?: number;
  featured?: boolean;
}

export async function getProjects(
  params: ProjectListParams = {},
): Promise<Paginated<ProjectSummary>> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  if (params.tech) search.set('tech', params.tech);
  if (params.year) search.set('year', String(params.year));
  if (params.featured !== undefined) search.set('featured', String(params.featured));

  const query = search.toString();
  return apiGet<Paginated<ProjectSummary>>(`/projects${query ? `?${query}` : ''}`, {
    tags: ['projects:list'],
    revalidate: 60,
  });
}

export async function getProject(slug: string): Promise<ProjectDetail> {
  return apiGet<ProjectDetail>(`/projects/${encodeURIComponent(slug)}`, {
    tags: ['projects:list', `project:${slug}`],
    revalidate: 60,
  });
}

export interface TechTagItem {
  name: string;
  slug: string;
  count: number;
}

export async function getTechTags(): Promise<TechTagItem[]> {
  return apiGet<TechTagItem[]>('/tech-tags', { tags: ['projects:list'], revalidate: 120 });
}

export async function resolveRedirect(
  entityType: 'post' | 'project',
  slug: string,
): Promise<string | null> {
  try {
    const data = await apiGet<{ newSlug: string }>(
      `/redirects/${entityType}/${encodeURIComponent(slug)}`,
      { revalidate: 300 },
    );
    return data.newSlug;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export interface AdminPost extends PostSummary {
  body: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export async function getMe(cookie: string) {
  return apiGet<{ id: string; username: string; displayName: string; role: string }>(
    '/auth/me',
    { cookie, revalidate: false },
  );
}

export async function getAdminPosts(cookie: string): Promise<AdminPost[]> {
  const data = await apiGet<{ items: AdminPost[] }>('/admin/posts', { cookie, revalidate: false });
  return data.items;
}

export async function getAdminPost(id: string, cookie: string): Promise<AdminPost> {
  return apiGet<AdminPost>(`/admin/posts/${id}`, { cookie, revalidate: false });
}

export async function getAdminRevisions(
  id: string,
  cookie: string,
): Promise<PostRevisionItem[]> {
  return apiGet<PostRevisionItem[]>(`/admin/posts/${id}/revisions`, {
    cookie,
    revalidate: false,
  });
}

/** 草稿预览：不经过缓存，token 由后台接口签发。 */
export async function getPostPreview(
  slug: string,
  token: string,
): Promise<PostDetail & { status: string }> {
  return apiGet<PostDetail & { status: string }>(
    `/posts/${encodeURIComponent(slug)}/preview?token=${encodeURIComponent(token)}`,
    { revalidate: false },
  );
}

export async function getStatsOverview(cookie: string): Promise<StatsOverview> {
  return apiGet<StatsOverview>('/admin/stats/overview', { cookie, revalidate: false });
}

export async function getAdminProjects(cookie: string): Promise<ProjectSummary[]> {
  const data = await apiGet<{ items: ProjectSummary[] }>('/admin/projects', {
    cookie,
    revalidate: false,
  });
  return data.items;
}

export async function getAdminProject(id: string, cookie: string): Promise<ProjectDetail> {
  return apiGet<ProjectDetail>(`/admin/projects/${id}`, { cookie, revalidate: false });
}

export interface MediaListResult {
  items: MediaItem[];
  meta: PageMeta;
}

export async function getAdminMedia(
  cookie: string,
  params: { page?: number; pageSize?: number; q?: string } = {},
): Promise<MediaListResult> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  if (params.q) search.set('q', params.q);
  const query = search.toString();
  return apiGet<MediaListResult>(`/admin/media${query ? `?${query}` : ''}`, {
    cookie,
    revalidate: false,
  });
}

export interface ContactMessageListResult {
  items: ContactMessageItem[];
  meta: PageMeta;
}

export async function getAdminContactMessages(
  cookie: string,
  params: { page?: number; pageSize?: number; status?: ContactMessageStatus; q?: string } = {},
): Promise<ContactMessageListResult> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  if (params.status) search.set('status', params.status);
  if (params.q) search.set('q', params.q);
  const query = search.toString();
  return apiGet<ContactMessageListResult>(`/admin/contact-messages${query ? `?${query}` : ''}`, {
    cookie,
    revalidate: false,
  });
}
