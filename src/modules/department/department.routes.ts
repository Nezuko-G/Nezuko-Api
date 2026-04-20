import { Router } from 'express';
import { DepartmentController } from './department.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { departmentSchema } from './department.validation';
import { requireAuth } from '../../shared/middleware/auth.middleware';
import { checkRole } from '../../shared/middleware/checkRole.middleware';

const router = Router();
const controller = new DepartmentController();

router.use(requireAuth);

router.post('/', 
  checkRole(['TENANT_OWNER', 'HR_ADMIN']), 
  validate(departmentSchema.create), 
  controller.create
);

router.get('/', controller.getAll);

router.get('/:id', controller.getOne);

router.patch('/:id', 
  checkRole (['TENANT_OWNER', 'HR_ADMIN']), 
  validate(departmentSchema.update), 
  controller.update
);

router.delete('/:id', 
  checkRole(['TENANT_OWNER', 'HR_ADMIN']), 
  controller.delete
);

export {router as DepartmentRouter};