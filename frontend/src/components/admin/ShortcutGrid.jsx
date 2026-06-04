import { Link } from 'react-router-dom';
import {
  GraduationCap, School, UserCheck, Wallet, BarChart3, CalendarDays,
  ClipboardCheck, Users, NotebookPen, MessageSquare, Sparkles,
} from 'lucide-react';
import Card, { CardBody } from '../ui/Card';
import { cn } from '../../utils/cn';

const ICONS = {
  GraduationCap, School, UserCheck, Wallet, BarChart3, CalendarDays,
  ClipboardCheck, Users, NotebookPen, MessageSquare, Sparkles,
};

export default function ShortcutGrid({ items = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const Icon = ICONS[item.icon] || GraduationCap;
        return (
          <Link key={item.to} to={item.to}>
            <Card className="h-full hover:border-primary/40 hover:shadow-md transition-all group">
              <CardBody className="flex gap-4 items-start">
                <span className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-lg',
                  'bg-teal-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors',
                )}
                >
                  <Icon className="w-5 h-5" aria-hidden />
                </span>
                <div>
                  <div className="font-semibold text-slate-900">{item.label}</div>
                  <div className="text-caption mt-0.5">{item.desc}</div>
                </div>
              </CardBody>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
