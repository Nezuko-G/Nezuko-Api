import Joi from "joi";

const PROJECT_STATUSES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];
const TASK_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"];
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const createProjectSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "validation.project.name.required",
    "any.required": "validation.project.name.required",
    "string.min": "validation.project.name.min",
    "string.max": "validation.project.name.max",
  }),
  description: Joi.string().trim().max(1000).allow(null, "").optional().messages({
    "string.max": "validation.project.description.max",
  }),
  status: Joi.string().valid(...PROJECT_STATUSES).optional().messages({
    "any.only": "validation.project.status.invalid",
  }),
  ownerId: Joi.string().uuid().optional().messages({
    "string.guid": "validation.project.ownerId.invalid",
  }),
  startDate: Joi.date().iso().allow(null).optional().messages({
    "date.base": "validation.project.startDate.invalid",
    "date.format": "validation.project.startDate.invalid",
  }),
  dueDate: Joi.date().iso().min(Joi.ref("startDate")).allow(null).optional().messages({
    "date.base": "validation.project.dueDate.invalid",
    "date.format": "validation.project.dueDate.invalid",
    "date.min": "validation.project.dueDate.before_start",
  }),
});

export const updateProjectSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional().messages({
    "string.min": "validation.project.name.min",
    "string.max": "validation.project.name.max",
  }),
  description: Joi.string().trim().max(1000).allow(null, "").optional().messages({
    "string.max": "validation.project.description.max",
  }),
  status: Joi.string().valid(...PROJECT_STATUSES).optional().messages({
    "any.only": "validation.project.status.invalid",
  }),
  ownerId: Joi.string().uuid().allow(null).optional().messages({
    "string.guid": "validation.project.ownerId.invalid",
  }),
  startDate: Joi.date().iso().allow(null).optional().messages({
    "date.base": "validation.project.startDate.invalid",
    "date.format": "validation.project.startDate.invalid",
  }),
  dueDate: Joi.date().iso().allow(null).optional().messages({
    "date.base": "validation.project.dueDate.invalid",
    "date.format": "validation.project.dueDate.invalid",
  }),
})
  .min(1)
  .messages({ "object.min": "validation.body.empty" });


export const createTaskSchema = Joi.object({
  projectId: Joi.string().uuid().allow(null).optional().messages({
    "string.guid": "validation.task.projectId.invalid",
  }),
  title: Joi.string().trim().min(2).max(200).required().messages({
    "string.empty": "validation.task.title.required",
    "any.required": "validation.task.title.required",
    "string.min": "validation.task.title.min",
    "string.max": "validation.task.title.max",
  }),
  description: Joi.string().trim().max(2000).allow(null, "").optional().messages({
    "string.max": "validation.task.description.max",
  }),
  status: Joi.string().valid(...TASK_STATUSES).optional().messages({
    "any.only": "validation.task.status.invalid",
  }),
  priority: Joi.string().valid(...TASK_PRIORITIES).optional().messages({
    "any.only": "validation.task.priority.invalid",
  }),
  assigneeId: Joi.string().uuid().allow(null).optional().messages({
    "string.guid": "validation.task.assigneeId.invalid",
  }),
  dueDate: Joi.date().iso().allow(null).optional().messages({
    "date.base": "validation.task.dueDate.invalid",
    "date.format": "validation.task.dueDate.invalid",
  }),
  estimatedHours: Joi.number().positive().allow(null).optional().messages({
    "number.base": "validation.task.estimatedHours.invalid",
    "number.positive": "validation.task.estimatedHours.positive",
  }),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).optional().messages({
    "string.min": "validation.task.title.min",
    "string.max": "validation.task.title.max",
  }),
  description: Joi.string().trim().max(2000).allow(null, "").optional().messages({
    "string.max": "validation.task.description.max",
  }),
  status: Joi.string().valid(...TASK_STATUSES).optional().messages({
    "any.only": "validation.task.status.invalid",
  }),
  priority: Joi.string().valid(...TASK_PRIORITIES).optional().messages({
    "any.only": "validation.task.priority.invalid",
  }),
  assigneeId: Joi.string().uuid().allow(null).optional().messages({
    "string.guid": "validation.task.assigneeId.invalid",
  }),
  dueDate: Joi.date().iso().allow(null).optional().messages({
    "date.base": "validation.task.dueDate.invalid",
    "date.format": "validation.task.dueDate.invalid",
  }),
  estimatedHours: Joi.number().positive().allow(null).optional().messages({
    "number.base": "validation.task.estimatedHours.invalid",
    "number.positive": "validation.task.estimatedHours.positive",
  }),
  actualHours: Joi.number().min(0).allow(null).optional().messages({
    "number.base": "validation.task.actualHours.invalid",
    "number.min": "validation.task.actualHours.min",
  }),
})
  .min(1)
  .messages({ "object.min": "validation.body.empty" });

export const updateTaskStatusSchema = Joi.object({
  status: Joi.string().valid(...TASK_STATUSES).required().messages({
    "string.empty": "validation.task.status.required",
    "any.required": "validation.task.status.required",
    "any.only": "validation.task.status.invalid",
  }),
  actualHours: Joi.number().min(0).allow(null).optional().messages({
    "number.base": "validation.task.actualHours.invalid",
    "number.min": "validation.task.actualHours.min",
  }),
});

export const createSubTaskSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required().messages({
    "string.empty": "validation.task.title.required",
    "any.required": "validation.task.title.required",
    "string.min": "validation.task.title.min",
    "string.max": "validation.task.title.max",
  }),
  description: Joi.string().trim().max(2000).allow(null, "").optional().messages({
    "string.max": "validation.task.description.max",
  }),
  priority: Joi.string().valid(...TASK_PRIORITIES).optional().messages({
    "any.only": "validation.task.priority.invalid",
  }),
  assigneeId: Joi.string().uuid().allow(null).optional().messages({
    "string.guid": "validation.task.assigneeId.invalid",
  }),
  dueDate: Joi.date().iso().allow(null).optional().messages({
    "date.base": "validation.task.dueDate.invalid",
    "date.format": "validation.task.dueDate.invalid",
  }),
  estimatedHours: Joi.number().positive().allow(null).optional().messages({
    "number.base": "validation.task.estimatedHours.invalid",
    "number.positive": "validation.task.estimatedHours.positive",
  }),
});