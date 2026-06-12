export type UserRole = 'admin' | 'staff' | 'production';

export type Permission =
  | 'users:manage'
  | 'po:upload'
  | 'po:view'
  | 'bom:edit';

// แต่ละ role ผูกกับ permission ที่ทำได้ — เพิ่ม role ใหม่ในอนาคต (เช่น sales, sales_manager)
// แค่เพิ่ม entry ในนี้ โดยไม่ต้องแก้ guard หรือ controller ที่ใช้ @RequirePermission
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ['users:manage', 'po:upload', 'po:view', 'bom:edit'],
  staff: ['po:upload', 'po:view'],
  production: ['po:view', 'bom:edit'],
};

export function roleHasPermission(
  role: UserRole,
  permission: Permission,
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
