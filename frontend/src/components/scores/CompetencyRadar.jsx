/**
 * CompetencyRadar — Biểu đồ mạng nhện năng lực (Radar Chart).
 * Hiển thị proficiency levels cho từng năng lực GDPT 2018.
 */
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const LEVEL_MAP = { beginner: 1, developing: 2, proficient: 3, advanced: 4 };
const LEVEL_LABELS = ['', 'Beginner', 'Developing', 'Proficient', 'Advanced'];

export default function CompetencyRadar({ profile = [], height = 280 }) {
  if (!profile.length) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        Chưa có dữ liệu năng lực
      </div>
    );
  }

  const data = {
    labels: profile.map((p) => p.competency_name?.length > 15
      ? p.competency_name.slice(0, 15) + '…'
      : p.competency_name
    ),
    datasets: [{
      label: 'Năng lực',
      data: profile.map((p) => LEVEL_MAP[p.proficiency_level] || 2),
      backgroundColor: 'rgba(20, 184, 166, 0.15)',
      borderColor: '#14b8a6',
      borderWidth: 2,
      pointBackgroundColor: '#14b8a6',
      pointBorderColor: '#fff',
      pointBorderWidth: 1,
      pointRadius: 4,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 4,
        ticks: {
          stepSize: 1,
          callback: (val) => LEVEL_LABELS[val] || '',
          font: { size: 9 },
          backdropColor: 'transparent',
        },
        pointLabels: {
          font: { size: 10 },
          color: '#64748b',
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.2)',
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const level = LEVEL_LABELS[ctx.parsed.r] || 'N/A';
            const item = profile[ctx.dataIndex];
            return `${item?.competency_name}: ${level} (${item?.score_count || 0} điểm)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Radar data={data} options={options} />
    </div>
  );
}
