import type {
  ContactMessageItem,
  ContactMessageStatus,
  ExperienceInput,
  MediaItem,
  PageMeta,
  PostInput,
  ProfileInput,
  ProjectInput,
  SkillGroupInput,
} from '@myself/shared';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ClientApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ClientApiError';
  }
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const target = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return target ? decodeURIComponent(target.slice(name.length + 1)) : null;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const csrf = readCookie('csrf');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  const body = (await response.json().catch(() => null)) as
    | { data?: T; detail?: string; title?: string }
    | null;

  if (!response.ok) {
    throw new ClientApiError(
      response.status,
      body?.detail ?? body?.title ?? `请求失败（${response.status}）`,
    );
  }

  return (body?.data ?? (null as T)) as T;
}

export async function login(username: string, password: string) {
  return request<{ id: string; displayName: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function logout(): Promise<void> {
  await request('/auth/logout', { method: 'POST' });
}

export async function createPost(input: PostInput) {
  return request<{ id: string; slug: string }>('/admin/posts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updatePost(id: string, input: PostInput) {
  return request<{ id: string; slug: string }>(`/admin/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function createPreviewToken(id: string) {
  return request<{ token: string; expiresAt: string }>(`/admin/posts/${id}/preview`, {
    method: 'POST',
  });
}

export async function restoreRevision(id: string, revisionId: string) {
  return request<{ id: string; slug: string; title: string; body: string }>(
    `/admin/posts/${id}/restore`,
    {
      method: 'POST',
      body: JSON.stringify({ revisionId }),
    },
  );
}

export async function triggerRevalidate(tags: string[]) {
  return request<{ ok: true; tags: string[] }>('/admin/revalidate', {
    method: 'POST',
    body: JSON.stringify({ tags }),
  });
}

export async function deletePost(id: string): Promise<void> {
  await request(`/admin/posts/${id}`, { method: 'DELETE' });
}

export async function deleteProject(id: string): Promise<void> {
  await request(`/admin/projects/${id}`, { method: 'DELETE' });
}

export async function saveProfile(input: ProfileInput) {
  return request<{ profile: unknown; experiences: unknown[] }>('/admin/profile', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function saveExperiences(list: ExperienceInput[]) {
  return request<unknown[]>('/admin/experiences', {
    method: 'PUT',
    body: JSON.stringify(list),
  });
}

export async function saveSkills(groups: SkillGroupInput[]) {
  return request<unknown[]>('/admin/skills', {
    method: 'PUT',
    body: JSON.stringify(groups),
  });
}

export async function createProject(input: ProjectInput) {
  return request<{ id: string; slug: string }>('/admin/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateProject(id: string, input: ProjectInput) {
  return request<{ id: string; slug: string }>(`/admin/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export interface MediaPage {
  items: MediaItem[];
  meta: PageMeta;
}

export async function listMedia(params: { page?: number; pageSize?: number; q?: string } = {}) {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  if (params.q) search.set('q', params.q);
  const query = search.toString();
  return request<MediaPage>(`/admin/media${query ? `?${query}` : ''}`);
}

export async function uploadMedia(file: File, alt = ''): Promise<MediaItem> {
  const csrf = readCookie('csrf');
  const form = new FormData();
  form.append('file', file);

  const search = alt ? `?alt=${encodeURIComponent(alt)}` : '';
  const response = await fetch(`${BASE_URL}/admin/media${search}`, {
    method: 'POST',
    body: form,
    credentials: 'include',
    headers: csrf ? { 'X-CSRF-Token': csrf } : {},
  });

  const body = (await response.json().catch(() => null)) as
    | { data?: MediaItem; detail?: string; title?: string }
    | null;

  if (!response.ok) {
    throw new ClientApiError(
      response.status,
      body?.detail ?? body?.title ?? `上传失败（${response.status}）`,
    );
  }
  if (!body?.data) throw new ClientApiError(response.status, '上传响应缺少数据');
  return body.data;
}

export async function deleteMedia(id: string): Promise<void> {
  await request(`/admin/media/${id}`, { method: 'DELETE' });
}

export async function updateMediaAlt(id: string, alt: string | null): Promise<MediaItem> {
  return request<MediaItem>(`/admin/media/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ alt }),
  });
}

export interface ContactMessagePage {
  items: ContactMessageItem[];
  meta: PageMeta;
}

export async function listContactMessages(
  params: { page?: number; pageSize?: number; status?: ContactMessageStatus; q?: string } = {},
) {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  if (params.status) search.set('status', params.status);
  if (params.q) search.set('q', params.q);
  const query = search.toString();
  return request<ContactMessagePage>(`/admin/contact-messages${query ? `?${query}` : ''}`);
}

export async function updateContactMessage(
  id: string,
  status: ContactMessageStatus,
): Promise<ContactMessageItem> {
  return request<ContactMessageItem>(`/admin/contact-messages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
