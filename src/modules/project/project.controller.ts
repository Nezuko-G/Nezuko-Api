import type { NextFunction, Request, Response } from "express";
import { projectService } from "./project.service.js";

export const projectController = {

  // Projects

  async listProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const t = req._t;

      const filter = {
        status: req.query.status as any,
        ownerId: req.query.ownerId as string | undefined,
        search: req.query.search as string | undefined,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      };

      const result = await projectService.listProjects(tenantId, filter, t);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getProjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.getProjectById(
        req.user!.tenantId,
        req.params.id as string,
        req._t
      );

      res.status(200).json({ data: project });
    } catch (error) {
      next(error);
    }
  },

  async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const t = req._t;

      const project = await projectService.createProject(
        tenantId,
        { ...req.body, ownerId: req.body.ownerId ?? req.user!.id },
        t
      );

      res.status(201).json({
        message: t("project.created_successfully"),
        data: project,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.updateProject(
        req.user!.tenantId,
        req.params.id as string,
        req.body,
        req._t
      );

      res.status(200).json({
        message: req._t("project.updated_successfully"),
        data: project,
      });
    } catch (error) {
      next(error);
    }
  },

  async getProjectProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const progress = await projectService.getProjectProgress(
        req.user!.tenantId,
        req.params.id as string,
        req._t
      );

      res.status(200).json({ data: progress });
    } catch (error) {
      next(error);
    }
  },

  // Tasks

  async listTasksByProject(req: Request, res: Response, next: NextFunction) {
    try {
      const filter = {
        status: req.query.status as any,
        priority: req.query.priority as any,
        assigneeId: req.query.assigneeId as string | undefined,
        search: req.query.search as string | undefined,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      };

      const result = await projectService.listTasksByProject(
        req.user!.tenantId,
        req.params.id as string,
        filter,
        req._t
      );

      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async getTaskById(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await projectService.getTaskById(
        req.user!.tenantId,
        req.params.id as string,
        req._t
      );

      res.status(200).json({ data: task });
    } catch (error) {
      next(error);
    }
  },

  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const t = req._t;

      const task = await projectService.createTask(
        tenantId,
        { ...req.body, createdById: req.user!.id },
        t
      );

      res.status(201).json({
        message: t("task.created_successfully"),
        data: task,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await projectService.updateTask(
        req.user!.tenantId,
        req.params.id as string,
        req.body,
        req._t
      );

      res.status(200).json({
        message: req._t("task.updated_successfully"),
        data: task,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateTaskStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await projectService.updateTaskStatus(
        req.user!.tenantId,
        req.params.id as string,
        req.body,
        req.user!.id,
        req.user!.role,
        req._t
      );

      res.status(200).json({
        message: req._t("task.status_updated_successfully"),
        data: task,
      });
    } catch (error) {
      next(error);
    }
  },

  async createSubTask(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const t = req._t;

      const subTask = await projectService.createSubTask(
        tenantId,
        req.params.id as string,
        { ...req.body, createdById: req.user!.id },
        t
      );

      res.status(201).json({
        message: t("task.subtask_created_successfully"),
        data: subTask,
      });
    } catch (error) {
      next(error);
    }
  },

  async getMyTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const filter = {
        status: req.query.status as any,
        priority: req.query.priority as any,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      };

      const result = await projectService.getMyTasks(
        req.user!.tenantId,
        req.user!.id,
        filter,
        req._t
      );

      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async getOverdueReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await projectService.getOverdueReport(
        req.user!.tenantId,
        req._t
      );

      res.status(200).json({ data: report });
    } catch (error) {
      next(error);
    }
  },
};