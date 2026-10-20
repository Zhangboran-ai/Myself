export type SkillLevel = 'proficient' | 'familiar' | 'learning';

export interface SocialLink {
  label: string;
  href: string;
  icon: string;
}

export interface Profile {
  name: string;
  handle: string;
  headline: string;
  bio: string[];
  avatarUrl: string | null;
  location: string | null;
  statusLabel: string | null;
  statusAvailable: boolean;
  email: string;
  resumeUrl: string | null;
  socials: SocialLink[];
}

export type ExperienceKind = 'work' | 'education';

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  summary: string | null;
  kind: ExperienceKind;
}

export interface SkillItem {
  id: string;
  name: string;
  level: SkillLevel;
  note: string | null;
  icon: string | null;
}

export interface SkillGroup {
  id: string;
  name: string;
  items: SkillItem[];
}

export type ProjectStatus = 'live' | 'oss' | 'archived';

export interface ProjectSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverUrl: string | null;
  role: string | null;
  year: number;
  status: ProjectStatus;
  featured: boolean;
  tech: string[];
  demoUrl: string | null;
  repoUrl: string | null;
}

export interface ProjectDetail extends ProjectSummary {
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostNeighbor {
  slug: string;
  title: string;
}

export interface PostSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
  readingTime: number;
  tags: string[];
  pinned: boolean;
}

export interface PostDetail extends PostSummary {
  body: string;
  prev: PostNeighbor | null;
  next: PostNeighbor | null;
}

export interface TagItem {
  name: string;
  slug: string;
  postCount: number;
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export interface ApiErrorBody {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}

export interface RedirectLookup {
  newSlug: string;
}

export interface PostRevisionItem {
  id: string;
  title: string;
  createdAt: string;
}

export interface PreviewToken {
  token: string;
  expiresAt: string;
}

export interface StatsOverview {
  posts: { total: number; published: number; draft: number; archived: number };
  projects: { total: number; featured: number };
  views: { posts: number; projects: number };
  contact: { total: number; unread: number };
  generatedAt: string;
}

export interface MediaItem {
  id: string;
  url: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  blurhash: string | null;
  createdAt: string;
}

export type ContactMessageStatus = 'NEW' | 'READ' | 'REPLIED' | 'SPAM';

export interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  content: string;
  status: ContactMessageStatus;
  createdAt: string;
}
