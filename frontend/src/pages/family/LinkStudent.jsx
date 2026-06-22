/**
 * LinkStudent — Phụ huynh nhập mã mời để liên kết với con.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, CheckCircle, KeyRound } from 'lucide-react';
import Button from '../../components/ui/Button';
import { redeemInviteCode } from '../../api/invite.api';
import toast from 'react-hot-toast';

export default function LinkStudent() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleRedeem = async () => {
    if (!code.trim()) { toast.error('Vui lòng nhập mã mời'); return; }
    setLoading(true);
    try {
      const res = await redeemInviteCode(code.trim().toUpperCase());
      if (res?.success) {
        setSuccess(res.data);
        toast.success(res.message || 'Liên kết thành công!');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Mã mời không hợp lệ');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Liên kết thành công!</h2>
        <p className="text-slate-600 mb-1">Đã liên kết với học sinh:</p>
        <p className="text-lg font-semibold text-teal-600 mb-6">{success.student_code}</p>
        <Button onClick={() => navigate('/family')}>Về trang chủ</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <KeyRound size={28} className="text-teal-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">Liên kết với con</h1>
        <p className="text-sm text-slate-500 mt-1">Nhập mã mời từ con để xem thông tin học tập</p>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mã mời</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="VD: ABC12345"
            maxLength={8}
            className="w-full border rounded-lg px-4 py-3 text-center text-lg font-mono tracking-widest uppercase"
            onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
          />
        </div>

        <Button className="w-full" onClick={handleRedeem} loading={loading}>
          <Link2 size={16} /> Liên kết
        </Button>

        <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
          <p className="font-medium mb-1">💡 Cách lấy mã mời:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Yêu cầu con đăng nhập EduSmart</li>
            <li>Vào mục "Mã mời của tôi" để xem mã</li>
            <li>Hoặc liên hệ GVCN để lấy mã</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
