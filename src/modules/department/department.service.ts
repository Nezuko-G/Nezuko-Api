import { CreateDepartmentInput, UpdateDepartmentInput } from '../../shared/interfaces/department.interface';
import { DepartmentRepository } from './department.repository';
import prisma from '@/shared/config/prisma';

const repo = new DepartmentRepository();

export class DepartmentService {
  
  async createDepartment(tenantId: string, data: CreateDepartmentInput) {
    try {
      if (data.managerId) {
        await this.validateManager(tenantId, data.managerId);
      }
      if (data.parentId) {
        await this.getDepartmentOrThrow(data.parentId, tenantId);
      }
      
      return await repo.create({ ...data, tenantId });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('DEPARTMENT_NAME_ALREADY_EXISTS');
      }
      throw error;
    }
  }

  async updateDepartment(id: string, tenantId: string, data: UpdateDepartmentInput) {
    try {
      await this.getDepartmentOrThrow(id, tenantId);

      if (data.managerId) {
        await this.validateManager(tenantId, data.managerId);
      }

      if (data.parentId) {
        if (data.parentId === id) throw new Error('CIRCULAR_REFERENCE_ERROR');
        await this.getDepartmentOrThrow(data.parentId, tenantId);
        await this.checkCircular(id, data.parentId, tenantId); 
      }

      return await repo.update(id, tenantId, data);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('DEPARTMENT_NAME_ALREADY_EXISTS');
      }
      throw error;
    }
  }

  async deleteDepartment(id: string, tenantId: string) {
    await this.getDepartmentOrThrow(id, tenantId);

    const employeeCount = await repo.countEmployeesInDepartment(id, tenantId);
    if (employeeCount > 0) throw new Error('DEPARTMENT_HAS_EMPLOYEES');

    return await repo.delete(id, tenantId);
  }

  async getAllDepartments(tenantId: string, page: number, limit: number, search: string, parentId?: string) {
    return await repo.findAll(tenantId, page, limit, search, parentId);
  }

  async getDepartmentById(id: string, tenantId: string) {
    const dept = await repo.findByIdWithDetails(id, tenantId);
    if (!dept) throw new Error('DEPARTMENT_NOT_FOUND');
    return dept;
  }


  private async validateManager(tenantId: string, managerId: string) {
    const manager = await prisma.user.findFirst({
      where: { id: managerId, tenantId }
    });
    if (!manager) throw new Error('MANAGER_NOT_IN_TENANT');
  }

  private async getDepartmentOrThrow(id: string, tenantId: string) {
    const dept = await repo.findById(id, tenantId);
    if (!dept) throw new Error('DEPARTMENT_NOT_FOUND');
    return dept;
  }

  private async checkCircular(deptId: string, newParentId: string, tenantId: string) {
    let currentParentId: string | null = newParentId;
    const visited = new Set<string>();

    while (currentParentId) {
      if (visited.has(currentParentId)) throw new Error('CIRCULAR_REFERENCE_ERROR');
      if (currentParentId === deptId) throw new Error('CIRCULAR_REFERENCE_ERROR');
      
      visited.add(currentParentId);

      const parentDept = await repo.findById(currentParentId, tenantId);
      currentParentId = parentDept?.parentId || null;
    }
  }
}