import {
  type CreateOrganizationRequest,
  type Organization,
  type UpdateOrganizationRequest,
} from '@lume/protocol';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Organization> {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) {
      throw new NotFoundException(`Organization ${id} not found`);
    }
    return this.toDto(org);
  }

  /**
   * Create a new organization and atomically attach the creating user to it.
   * Phase 1 assumption: a user belongs to at most one organization.
   */
  async createForUser(userId: string, input: CreateOrganizationRequest): Promise<Organization> {
    const slug = (input.slug ?? slugify(input.name)).slice(0, 40);

    try {
      const org = await this.prisma.$transaction(async (tx) => {
        const created = await tx.organization.create({
          data: { name: input.name, slug },
        });
        await tx.user.update({
          where: { id: userId },
          data: { organizationId: created.id },
        });
        return created;
      });
      return this.toDto(org);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`Organization slug "${slug}" is already taken`);
      }
      throw e;
    }
  }

  async update(id: string, input: UpdateOrganizationRequest): Promise<Organization> {
    try {
      const org = await this.prisma.organization.update({
        where: { id },
        data: { name: input.name, slug: input.slug },
      });
      return this.toDto(org);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`Organization slug is already taken`);
      }
      throw e;
    }
  }

  private toDto(org: {
    id: string;
    name: string;
    slug: string;
    plan: 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE';
    createdAt: Date;
  }): Organization {
    return {
      id: org.id as Organization['id'],
      name: org.name,
      slug: org.slug as Organization['slug'],
      plan: org.plan,
      createdAt: org.createdAt.toISOString() as Organization['createdAt'],
    };
  }
}

function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
