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
          <Link key={item.to} to={item.to} className="focus-ring rounded-card">
            <Card className="h-full hover:border-primary/40 hover:shadow-popover transition-all group">
              <CardBody className="flex gap-4 items-start">
                <span className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-md',
                  'bg-teal-50 text-primary ring-1 ring-teal-100 group-hover:bg-primary group-hover:text-white transition-colors',
                )}
                >
                  <Icon className="w-5 h-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-ink">{item.label}</div>
                  <div className="text-body mt-0.5">{item.desc}</div>
                </div>
              </CardBody>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
