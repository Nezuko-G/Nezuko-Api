export interface CreateDepartmentDTO {
  name: string;
  description?: string;
  managerId?: string;
  parentId?: string;
}

export interface UpdateDepartmentDTO {
  name?: string;
  description?: string;
  managerId?: string;
  parentId?: string;
}