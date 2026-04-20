import prisma from "@/shared/config/prisma";

export class DepartmentRepository {
  async create(data: any) {
    return await prisma.department.create({ data });
  }

  async findAll(tenantId: string, page: number, limit: number, search: string, parentId?: string) {
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      ...(parentId && { parentId }),
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive'
        }
      })
    };

    const [data, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { users: true }
          }
        }
      }),
      prisma.department.count({ where })
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findByIdWithDetails(id: string, tenantId: string) {
    return await prisma.department.findFirst({
      where: { id, tenantId },
      include: {
        manager: {
          select: { id: true, name: true, email: true } 
        },
        children: true,
        _count: {
          select: { users: true }
        }
      }
    });
  }

  async findById(id: string, tenantId: string) {
    return await prisma.department.findFirst({ where: { id, tenantId } });
  }

  async update(id: string, tenantId: string, data: any) {
    await prisma.department.updateMany({ where: { id, tenantId }, data });
    return this.findById(id, tenantId);
  }

  async delete(id: string, tenantId: string) {
    return await prisma.department.deleteMany({ where: { id, tenantId } });
  }

  async countEmployeesInDepartment(departmentId: string, tenantId: string) {
    return await prisma.user.count({ where: { departmentId, tenantId } });
  }
}