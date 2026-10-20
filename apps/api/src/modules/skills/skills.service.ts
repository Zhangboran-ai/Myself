import { Injectable } from '@nestjs/common';
import type { SkillGroup, SkillGroupInput, SkillLevel } from '@myself/shared';
import { PrismaService } from '../../common/prisma.service';
import { RevalidateService } from '../../common/revalidate.service';

@Injectable()
export class SkillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revalidate: RevalidateService,
  ) {}

  async list(): Promise<SkillGroup[]> {
    const groups = await this.prisma.skillGroup.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { skills: { orderBy: { sortOrder: 'asc' } } },
    });

    return groups.map((group) => ({
      id: String(group.id),
      name: group.name,
      items: group.skills.map((skill) => ({
        id: String(skill.id),
        name: skill.name,
        level: skill.level.toLowerCase() as SkillLevel,
        note: skill.note,
        icon: skill.icon,
      })),
    }));
  }

  /** 整体覆盖保存：技能条目量小，直接重建比增量 diff 更可靠。 */
  async replace(groups: SkillGroupInput[]): Promise<SkillGroup[]> {
    await this.prisma.$transaction(async (tx) => {
      await tx.skill.deleteMany();
      await tx.skillGroup.deleteMany();

      for (const [groupIndex, group] of groups.entries()) {
        await tx.skillGroup.create({
          data: {
            name: group.name,
            sortOrder: groupIndex + 1,
            skills: {
              create: group.items.map((item, itemIndex) => ({
                name: item.name,
                level:
                  item.level === 'proficient'
                    ? 'PROFICIENT'
                    : item.level === 'learning'
                      ? 'LEARNING'
                      : 'FAMILIAR',
                note: item.note || null,
                icon: item.icon || null,
                sortOrder: itemIndex + 1,
              })),
            },
          },
        });
      }
    });

    this.revalidate.notify(['site']);
    return this.list();
  }
}
