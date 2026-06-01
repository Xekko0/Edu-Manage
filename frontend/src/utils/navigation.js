/** Đường dẫn trang chủ theo vai trò — đồng bộ với App.jsx RoleHome & Sidebar. */
export const ROLE_HOME_PATHS = {
  admin: '/admin',
  subject: '/teacher/subject',
  parent: '/family',
  student: '/family',
};

export function getRoleHomePath(role) {
  return ROLE_HOME_PATHS[role] || '/';
}
