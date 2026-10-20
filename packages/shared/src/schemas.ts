import { z } from 'zod';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugSchema = z
  .string()
  .min(1, 'slug 不能为空')
  .max(160, 'slug 最长 160 个字符')
  .regex(SLUG_PATTERN, 'slug 只能包含小写字母、数字和短横线');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名').max(50),
  password: z.string().min(1, '请输入密码').max(200),
});

export const postStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export const postInputSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200),
  slug: slugSchema,
  summary: z.string().min(1, '摘要不能为空').max(300),
  body: z.string().min(1, '正文不能为空'),
  status: postStatusSchema.default('DRAFT'),
  pinned: z.boolean().default(false),
  tags: z.array(z.string().trim().min(1).max(50)).max(8).default([]),
  coverUrl: z.string().url().max(500).nullable().optional(),
});

export type PostInput = z.infer<typeof postInputSchema>;

export const projectStatusSchema = z.enum(['live', 'oss', 'archived']);

export const projectInputSchema = z.object({
  title: z.string().min(1).max(200),
  slug: slugSchema,
  summary: z.string().min(1).max(300),
  body: z.string().min(1),
  role: z.string().max(100).nullable().optional(),
  year: z.coerce.number().int().min(1990).max(2100),
  status: projectStatusSchema.default('live'),
  featured: z.boolean().default(false),
  tech: z.array(z.string().trim().min(1).max(50)).max(12).default([]),
  demoUrl: z.string().url().max(500).nullable().optional(),
  repoUrl: z.string().url().max(500).nullable().optional(),
  coverUrl: z.string().url().max(500).nullable().optional(),
  sortOrder: z.coerce.number().int().default(0),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;

export const contactInputSchema = z.object({
  name: z.string().trim().min(1, '请填写称呼').max(50),
  email: z.string().trim().email('邮箱格式不正确').max(120),
  subject: z.string().trim().max(120).optional().default(''),
  content: z.string().trim().min(10, '内容至少 10 个字符').max(2000),
  // 蜜罐字段：正常用户不会填写
  website: z.string().max(200).optional().default(''),
});

export type ContactInput = z.infer<typeof contactInputSchema>;

const queryBoolean = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((value) => value === true || value === 'true' || value === '1');

export const postQuerySchema = paginationSchema.extend({
  tag: z.string().trim().max(50).optional(),
  q: z.string().trim().max(100).optional(),
  pinned: queryBoolean.optional(),
});

export const projectQuerySchema = paginationSchema.extend({
  tech: z.string().trim().max(50).optional(),
  year: z.coerce.number().int().optional(),
  featured: queryBoolean.optional(),
});

/* ---------- 后台：资料 / 技能 ---------- */

const optionalUrl = z.string().trim().url('地址格式不正确').max(500).nullable().optional();

export const socialLinkInputSchema = z.object({
  label: z.string().trim().min(1, '请填写名称').max(50),
  href: z.string().trim().min(1, '请填写链接').max(500),
  icon: z.string().trim().min(1).max(50).default('link'),
});

export const profileInputSchema = z.object({
  name: z.string().trim().min(1, '请填写姓名').max(50),
  handle: z.string().trim().min(1).max(50),
  headline: z.string().trim().min(1, '请填写一句话定位').max(120),
  bio: z.string().trim().min(1, '请填写简介').max(4000),
  avatarUrl: optionalUrl,
  location: z.string().trim().max(100).nullable().optional(),
  statusLabel: z.string().trim().max(60).nullable().optional(),
  statusAvailable: z.boolean().default(true),
  email: z.string().trim().email('邮箱格式不正确').max(120),
  resumeUrl: optionalUrl,
  socials: z.array(socialLinkInputSchema).max(10).default([]),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;

export const experienceInputSchema = z.object({
  company: z.string().trim().min(1, '请填写公司或学校').max(100),
  role: z.string().trim().min(1, '请填写职位').max(100),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD')
    .nullable()
    .optional(),
  summary: z.string().trim().max(500).nullable().optional(),
  kind: z.enum(['work', 'education']).default('work'),
  visible: z.boolean().default(true),
});

export type ExperienceInput = z.infer<typeof experienceInputSchema>;

export const experienceListSchema = z.array(experienceInputSchema).max(50);

export const skillItemInputSchema = z.object({
  name: z.string().trim().min(1, '请填写技能名').max(50),
  level: z.enum(['proficient', 'familiar', 'learning']).default('familiar'),
  note: z.string().trim().max(200).nullable().optional(),
  icon: z.string().trim().max(50).nullable().optional(),
});

export type SkillItemInput = z.infer<typeof skillItemInputSchema>;

export const skillGroupInputSchema = z.object({
  name: z.string().trim().min(1, '请填写分类名').max(50),
  items: z.array(skillItemInputSchema).max(30).default([]),
});

export type SkillGroupInput = z.infer<typeof skillGroupInputSchema>;

export const skillGroupListSchema = z.array(skillGroupInputSchema).max(10);

/* ---------- 后台：修订 / 预览 / 缓存 ---------- */

export const revisionIdSchema = z.string().regex(/^\d+$/, '修订 ID 必须是数字');

export const restoreRevisionSchema = z.object({
  revisionId: revisionIdSchema,
});

export type RestoreRevisionInput = z.infer<typeof restoreRevisionSchema>;

export const revalidateInputSchema = z.object({
  tags: z.array(z.string().trim().min(1).max(120)).min(1, '至少提供一个 tag').max(20),
});

export type RevalidateInput = z.infer<typeof revalidateInputSchema>;

/* ---------- 后台：媒体库 ---------- */

export const mediaAltSchema = z.object({
  alt: z.string().trim().max(200).nullable().optional(),
});

export type MediaAltInput = z.infer<typeof mediaAltSchema>;

export const mediaQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
});

/* ---------- 后台：联系留言 ---------- */

export const contactMessageStatusSchema = z.enum(['NEW', 'READ', 'REPLIED', 'SPAM']);

export const contactMessageUpdateSchema = z.object({
  status: contactMessageStatusSchema,
});

export type ContactMessageUpdateInput = z.infer<typeof contactMessageUpdateSchema>;

export const contactMessageQuerySchema = paginationSchema.extend({
  status: contactMessageStatusSchema.optional(),
  q: z.string().trim().max(100).optional(),
});

