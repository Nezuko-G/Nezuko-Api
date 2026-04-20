import { Request, Response } from 'express';
import { DepartmentService } from './department.service';

const departmentService = new DepartmentService();

export class DepartmentController {
  
  async create(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const department = await departmentService.createDepartment(req.user.tenantId, req.body);
      res.status(201).json({ success: true, data: department });
    } catch (error: any) {
      res.status(400).json({ success: false, message: (req as any).t(error.message) });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).send();

      const { page = 1, limit = 10, search = '', parentId } = req.query;

      const result = await departmentService.getAllDepartments(
        req.user.tenantId,
        Number(page),
        Number(limit),
        search as string,
        parentId as string
      );

      const formattedData = result.data.map((d: any) => ({
        ...d,
        employeeCount: d._count.users,
        _count: undefined 
      }));

      res.json({ 
        success: true, 
        data: formattedData,
        meta: result.meta 
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: (req as any).t(error.message) });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).send();
      const id = req.params.id as string;
      const dept = await departmentService.getDepartmentById(id, req.user.tenantId);
      
      const formattedDept = {
        ...dept,
        employeeCount: (dept as any)._count.users,
        _count: undefined
      };

      res.json({ success: true, data: formattedDept });
    } catch (error: any) {
      res.status(404).json({ success: false, message: (req as any).t(error.message) });
    }
  }

  async update(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).send();
      const id = req.params.id as string;
      const department = await departmentService.updateDepartment(id, req.user.tenantId, req.body);
      res.json({ success: true, data: department });
    } catch (error: any) {
      res.status(400).json({ success: false, message: (req as any).t(error.message) });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).send();
      const id = req.params.id as string;
      await departmentService.deleteDepartment(id, req.user.tenantId);
      res.json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: (req as any).t(error.message) });
    }
  }
}