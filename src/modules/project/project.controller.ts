import type { NextFunction, Request, Response } from "express";
import { projectService } from "./project.service.js";
import {
  parseProjectFilter,
  parseTaskFilter,
  parseMyTasksFilter,
} from "./project.helpers.js";

export const projectController = {

  // Projects

  async listProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await projectService.listProjects(
        req.user!.tenantId,
        parseProjectFilter(req.query),
        req._t
      );
      res.status(200).json({
        status: "success",
        data: { projects: result.projects },
        meta: result.meta,
      });
    } catch (error) { next(error); }
  },

  async getProjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.getProjectById(
        req.user!.tenantId,
        req.params.id as string,
        req._t
      );
      res.status(200).json({
        status: "success",
        data: { project },
      });
    } catch (error) { next(error); }
  },

  async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.createProject(
        req.user!.tenantId,
        { ...req.body, ownerId: req.body.ownerId ?? req.user!.id },
        req._t
      );
      res.status(201).json({
        status: "success",
        message: req._t("project.created_successfully"),
        data: { project },
      });
    } catch (error) { next(error); }
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
        status: "success",
        message: req._t("project.updated_successfully"),
        data: { project },
      });
    } catch (error) { next(error); }
  },

  async getProjectProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const progress = await projectService.getProjectProgress(
        req.user!.tenantId,
        req.params.id as string,
        req._t
      );
      res.status(200).json({
        status: "success",
        data: { progress },
      });
    } catch (error) { next(error); }
  },

  // Tasks

  async listTasksByProject(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await projectService.listTasksByProject(
        req.user!.tenantId,
        req.params.id as string,
        parseTaskFilter(req.query),
        req._t
      );
      res.status(200).json({
        status: "success",
        data: { tasks: result.tasks },
        meta: result.meta,
      });
    } catch (error) { next(error); }
  },

  async getTaskById(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await projectService.getTaskById(
        req.user!.tenantId,
        req.params.id as string,
        req._t
      );
      res.status(200).json({
        status: "success",
        data: { task },
      });
    } catch (error) { next(error); }
  },

  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await projectService.createTask(
        req.user!.tenantId,
        { ...req.body, createdById: req.user!.id },
        req._t
      );
      res.status(201).json({
        status: "success",
        message: req._t("task.created_successfully"),
        data: { task },
      });
    } catch (error) { next(error); }
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
        status: "success",
        message: req._t("task.updated_successfully"),
        data: { task },
      });
    } catch (error) { next(error); }
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
        status: "success",
        message: req._t("task.status_updated_successfully"),
        data: { task },
      });
    } catch (error) { next(error); }
  },

  async createSubTask(req: Request, res: Response, next: NextFunction) {
    try {
      const subTask = await projectService.createSubTask(
        req.user!.tenantId,
        req.params.id as string,
        { ...req.body, createdById: req.user!.id },
        req._t
      );
      res.status(201).json({
        status: "success",
        message: req._t("task.subtask_created_successfully"),
        data: { subTask },
      });
    } catch (error) { next(error); }
  },

  async getMyTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await projectService.getMyTasks(
        req.user!.tenantId,
        req.user!.id,
        parseMyTasksFilter(req.query),
        req._t
      );
      res.status(200).json({
        status: "success",
        data: { tasks: result.tasks },
        meta: result.meta,
      });
    } catch (error) { next(error); }
  },

  async getOverdueReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await projectService.getOverdueReport(
        req.user!.tenantId,
        req._t
      );
      res.status(200).json({
        status: "success",
        data: { report },
      });
    } catch (error) { next(error); }
  },
};