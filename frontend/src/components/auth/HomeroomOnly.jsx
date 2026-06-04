import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import EmptyState from '../ui/EmptyState';

/** Chỉ GVCN (hoặc Admin) — dùng bọc route điểm danh / PH lớp. */
export default function HomeroomOnly({ children }) {
  const { user } = useAuth();

  if (user?.role === 'admin') return children;
  if (user?.capabilities?.is_homeroom) return children;

  if (user?.role === 'subject') {
    return (
      <EmptyState
        title="Chức năng GVCN"
        description="Bạn chưa được gán làm giáo viên chủ nhiệm lớp nào. Liên hệ Admin nếu cần quyền GVCN."
      />
    );
  }

  return <Navigate to="/family" replace />;
}
