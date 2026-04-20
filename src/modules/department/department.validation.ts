import Joi from 'joi';

export const departmentSchema = {
  create: Joi.object({
    name: Joi.string().required().min(2).max(100),
    description: Joi.string().allow('').max(500),
    managerId: Joi.string().uuid().optional(),
    parentId: Joi.string().uuid().optional(),
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().allow('').max(500),
    managerId: Joi.string().uuid().optional(),
    parentId: Joi.string().uuid().optional(),
  }),
};