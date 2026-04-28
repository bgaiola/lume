import { type AuthenticatedUser } from '@lume/protocol';
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

interface UpdateUserInput {
  name?: string;
  avatarUrl?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return this.toAuthenticatedUser(user);
  }

  async listForOrganization(organizationId: string): Promise<AuthenticatedUser[]> {
    const users = await this.prisma.user.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
    return users.map((u) => this.toAuthenticatedUser(u));
  }

  async update(id: string, input: UpdateUserInput): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: input.name,
        avatarUrl: input.avatarUrl,
      },
    });
    return this.toAuthenticatedUser(user);
  }

  private toAuthenticatedUser(user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    organizationId: string | null;
    createdAt: Date;
  }): AuthenticatedUser {
    return {
      id: user.id as AuthenticatedUser['id'],
      email: user.email as AuthenticatedUser['email'],
      name: user.name,
      avatarUrl: user.avatarUrl,
      organizationId: user.organizationId as AuthenticatedUser['organizationId'],
      createdAt: user.createdAt.toISOString() as AuthenticatedUser['createdAt'],
    };
  }
}
