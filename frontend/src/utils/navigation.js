/** Đường dẫn trang chủ theo vai trò — đồng bộ với App.jsx RoleHome & Sidebar. */
export const ROLE_HOME_PATHS = {
  admin: '/admin',
  subject: '/teacher/subject',
  homeroom: '/teacher/homeroom',
  parent: '/family',
  student: '/family',
};

export function getRoleHomePath(role, capabilities) {
  if (role === 'subject' && capabilities?.is_homeroom) return '/teacher/homeroom';
  return ROLE_HOME_PATHS[role] || '/';
}
