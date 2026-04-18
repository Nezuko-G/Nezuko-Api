import type { NextFunction, Request, Response } from "express";
import { employeeService } from "./employee.service.js";

export const employeeController = {

  async createEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const t = req._t;

      const employee = await employeeService.createEmployee(
        { ...req.body, tenantId },
        t,
        req,
        res
      );

      res.status(201).json({
        message: t("employee.created_successfully"),
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  },

  async getEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await employeeService.getEmployees(tenantId, page, limit);

      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  },
  async getEmployeeById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const employee = await employeeService.getEmployeeById(
        req.user!.tenantId,
        id,
        req._t
      );
      res.status(200).json({ data: employee });
    } catch (error) {
      next(error);
    }
  },

  async updateEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const employee = await employeeService.updateEmployee(
        req.user!.tenantId,
        id,
        req.body,
        req._t
      );
      res.status(200).json({
        message: req._t("employee.updated_successfully"),
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      await employeeService.deleteEmployee(
        req.user!.tenantId,
        id,
        req._t
      );
      res.status(200).json({
        message: req._t("employee.deleted_successfully"),
      });
    } catch (error) {
      next(error);
    }
  },
  async getEmployeeDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const docs = await employeeService.getEmployeeDocuments(req.user!.tenantId, id, req._t);

      res.status(200).json({ data: docs });
    } catch (error) {
      next(error);
    }
  },

  async uploadEmployeeDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const doc = await employeeService.uploadEmployeeDocument(
        req.user!.tenantId,
        id,
        req.file!,
        req.body.fileName,
        req.body.expiryDate,
        req._t
      );
      res.status(201).json({
        message: req._t("employee.document_uploaded"),
        data: doc,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteEmployeeDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, docId } = req.params as { id: string; docId: string };

      await employeeService.deleteEmployeeDocument(req.user!.tenantId, id, docId, req._t);

      res.status(200).json({ message: req._t("employee.document_deleted") });
    } catch (error) {
      next(error);
    }
  },

};