import { GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-800 via-teal-700 to-slate-800 p-12 flex-col justify-between text-white">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/15">
              <GraduationCap className="w-7 h-7" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-bold">EduSmart</h1>
              <p className="text-teal-100 text-sm">Hệ thống quản lý học sinh v1.1</p>
            </div>
          </div>
        </div>
        <p className="text-teal-100/90 text-sm max-w-md leading-relaxed">
          Nền tảng quản lý học tập cho Admin, giáo viên, phụ huynh và học sinh — tích hợp trợ lý AI tra cứu điểm, lịch và học phí.
        </p>
        <p className="text-xs text-teal-200/60">© EduSmart — Tiểu luận tốt nghiệp</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-surface">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-slate-900">EduSmart</span>
          </div>
          <div className="bg-white rounded-card border border-slate-200 shadow-card p-8">
            <h2 className="text-h1 mb-1">{title}</h2>
            {subtitle && <p className="text-caption mb-6">{subtitle}</p>}
            {children}
          </div>
          {footer && <div className="mt-4 text-center text-sm">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function AuthFooterLink({ to, children }) {
  return (
    <Link to={to} className="text-primary hover:text-primary-dark font-medium">
      {children}
    </Link>
  );
}
