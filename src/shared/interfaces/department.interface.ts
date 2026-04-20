export interface CreateDepartmentInput {
  name: string;
  description?: string;
  managerId?: string;
  parentId?: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  description?: string;
  managerId?: string;
  parentId?: string;
}