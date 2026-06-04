import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { DAY_OF_WEEK } from '../../utils/labels';

const MODE_LABEL = { offline: 'Trực tiếp', online: 'Trực tuyến' };

export default function ScheduleSlotDetail({ slot, open, onClose }) {
  if (!slot) return null;

  const isOnline = slot.delivery_mode === 'online';

  return (
    <Modal open={open} title={`Chi tiết tiết học — ${slot.subject}`} onClose={onClose}>
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <span className="text-slate-500">Mã ô</span>
          <span className="font-mono text-xs">{slot.slot_id}</span>
          <span className="text-slate-500">Thời gian</span>
          <span>
            {DAY_OF_WEEK[slot.day_of_week]}
            {' · '}
            {slot.session === 'afternoon' ? 'Ca chiều' : 'Ca sáng'}
            {' · Tiết '}
            {slot.period}
          </span>
          <span className="text-slate-500">Giáo viên</span>
          <span className="font-medium">{slot.teacher_name || '—'}</span>
          <span className="text-slate-500">Phòng</span>
          <span>{slot.room || '—'}</span>
          <span className="text-slate-500">Hình thức</span>
          <span>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
              isOnline ? 'bg-violet-100 text-violet-800' : 'bg-emerald-100 text-emerald-800'
            }`}
            >
              {MODE_LABEL[slot.delivery_mode] || slot.delivery_mode}
            </span>
          </span>
        </div>

        {isOnline && slot.online_meeting_url && (
          <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
            <p className="text-xs text-violet-800 mb-2">Link học trực tuyến</p>
            <a
              href={slot.online_meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand font-medium break-all hover:underline"
            >
              Vào lớp học online
            </a>
          </div>
        )}

        {slot.lesson_topic && (
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">Chủ đề bài học</p>
            <p>{slot.lesson_topic}</p>
          </div>
        )}

        {slot.homework_reminder && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-semibold text-amber-900 mb-1">Bài tập / chuẩn bị</p>
            <p className="text-amber-950">{slot.homework_reminder}</p>
          </div>
        )}

        {!slot.lesson_topic && !slot.homework_reminder && (
          <p className="text-slate-500 text-xs">Giáo viên chưa cập nhật nội dung tiết học.</p>
        )}

        <div className="flex justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </Modal>
  );
}
