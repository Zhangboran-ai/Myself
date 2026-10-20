import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Experience,
  ExperienceInput,
  ExperienceKind,
  Profile,
  ProfileInput,
} from '@myself/shared';
import { PrismaService } from '../../common/prisma.service';
import { RevalidateService } from '../../common/revalidate.service';

export interface SitePayload {
  profile: Profile;
  experiences: Experience[];
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revalidate: RevalidateService,
  ) {}

  async getSite(): Promise<SitePayload> {
    const [profile, socials, experiences] = await Promise.all([
      this.prisma.profile.findUnique({ where: { id: 1 } }),
      this.prisma.socialLink.findMany({
        where: { visible: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.experience.findMany({
        where: { visible: true },
        orderBy: [{ sortOrder: 'asc' }, { startDate: 'desc' }],
      }),
    ]);

    if (!profile) {
      throw new NotFoundException('个人信息尚未初始化');
    }

    return {
      profile: {
        name: profile.name,
        handle: profile.handle,
        headline: profile.headline,
        bio: profile.bioMd
          .split(/\n{2,}/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean),
        avatarUrl: profile.avatarUrl,
        location: profile.location,
        statusLabel: profile.statusLabel,
        statusAvailable: profile.statusAvailable,
        email: profile.email,
        resumeUrl: profile.resumeUrl,
        socials: socials.map((social) => ({
          label: social.label,
          href: social.href,
          icon: social.icon,
        })),
      },
      experiences: experiences.map((experience) => this.toExperience(experience)),
    };
  }

  async getExperiences(): Promise<Experience[]> {
    const experiences = await this.prisma.experience.findMany({
      where: { visible: true },
      orderBy: [{ sortOrder: 'asc' }, { startDate: 'desc' }],
    });
    return experiences.map((experience) => this.toExperience(experience));
  }

  async updateProfile(input: ProfileInput): Promise<SitePayload> {
    await this.prisma.$transaction(async (tx) => {
      const data = {
        name: input.name,
        handle: input.handle,
        headline: input.headline,
        bioMd: input.bio,
        avatarUrl: input.avatarUrl ?? null,
        location: input.location || null,
        statusLabel: input.statusLabel || null,
        statusAvailable: input.statusAvailable,
        email: input.email,
        resumeUrl: input.resumeUrl ?? null,
      };

      await tx.profile.upsert({
        where: { id: 1 },
        update: data,
        create: { id: 1, ...data },
      });

      await tx.socialLink.deleteMany();
      if (input.socials.length > 0) {
        await tx.socialLink.createMany({
          data: input.socials.map((social, index) => ({
            label: social.label,
            href: social.href,
            icon: social.icon,
            sortOrder: index + 1,
            visible: true,
          })),
        });
      }
    });

    this.revalidate.notify(['site', 'sitemap']);
    return this.getSite();
  }

  async replaceExperiences(list: ExperienceInput[]): Promise<Experience[]> {
    await this.prisma.$transaction(async (tx) => {
      await tx.experience.deleteMany();
      if (list.length > 0) {
        await tx.experience.createMany({
          data: list.map((item, index) => ({
            company: item.company,
            role: item.role,
            startDate: this.parseDate(item.startDate),
            endDate: item.endDate ? this.parseDate(item.endDate) : null,
            summary: item.summary || null,
            kind: item.kind === 'education' ? 'EDUCATION' : 'WORK',
            sortOrder: index + 1,
            visible: item.visible,
          })),
        });
      }
    });

    this.revalidate.notify(['site']);
    const site = await this.getSite();
    return site.experiences;
  }

  private parseDate(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`);
  }

  private toExperience(experience: {
    id: bigint;
    company: string;
    role: string;
    startDate: Date;
    endDate: Date | null;
    summary: string | null;
    kind: string;
  }): Experience {
    return {
      id: String(experience.id),
      company: experience.company,
      role: experience.role,
      startDate: experience.startDate.toISOString().slice(0, 10),
      endDate: experience.endDate ? experience.endDate.toISOString().slice(0, 10) : null,
      summary: experience.summary,
      kind: experience.kind.toLowerCase() as ExperienceKind,
    };
  }
}
