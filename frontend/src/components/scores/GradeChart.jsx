/**
 * Biểu đồ xu hướng điểm số qua các kỳ (SRS 2.4.2 — Could Have).
 */
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function GradeChart({ labels = [], series = [] }) {
  const data = {
    labels,
    datasets: series.map((s) => ({
      label: s.label,
      data: s.values,
      borderColor: s.color || '#2563eb',
      backgroundColor: s.color || '#2563eb',
      tension: 0.3,
    })),
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      <Line data={data} options={{ responsive: true, scales: { y: { suggestedMin: 0, suggestedMax: 10 } } }} />
    </div>
  );
}
