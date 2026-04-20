import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from './department.service';

const departmentService = new DepartmentService();

export class DepartmentController {
  
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('UNAUTHORIZED');
      const department = await departmentService.createDepartment(req.user.tenantId, req.body);
      
      res.status(201).json({ success: true, data: department });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('UNAUTHORIZED');
      const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const search = (req.query.search as string) || '';
    const parentId = req.query.parentId as string;

      const result = await departmentService.getAllDepartments(
      req.user.tenantId,
      page,
      limit,
      search,
      parentId
    );

     const formattedData = result.data.map((d: any) => ({
      ...d,
      employeeCount: d._count?.users || 0,
      _count: undefined
    }));

    res.json({ 
      success: true, 
      data: formattedData,
      meta: result.meta 
    });
  } catch (error) {
    next(error);
  }
}

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('UNAUTHORIZED');
      const id = req.params.id as string;
      const dept = await departmentService.getDepartmentById(id, req.user.tenantId);
      
      const formattedDept = {
        ...dept,
        employeeCount: (dept as any)._count.users,
        _count: undefined
      };

      res.json({ success: true, data: formattedDept });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('UNAUTHORIZED');
      const id = req.params.id as string;
      const department = await departmentService.updateDepartment(id, req.user.tenantId, req.body);
      
      res.json({ success: true, data: department });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('UNAUTHORIZED');
      const id = req.params.id as string;
      await departmentService.deleteDepartment(id, req.user.tenantId);
      
      res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}