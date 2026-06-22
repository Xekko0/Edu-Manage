/**
 * AttendanceTrendWidget — Xu hướng chuyên cần theo tuần (Line Chart).
 */
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function AttendanceTrendWidget() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Mock data — 12 tuần
    const weeks = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
    const rates = [95, 93, 96, 91, 88, 94, 92, 90, 93, 95, 91, 94];
    setData({ weeks, rates });
  }, []);

  if (!data) return null;

  const chartData = {
    labels: data.weeks,
    datasets: [{
      label: 'Tỷ lệ đi học (%)',
      data: data.rates,
      borderColor: '#14b8a6',
      backgroundColor: 'rgba(20, 184, 166, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 3,
      pointBackgroundColor: '#14b8a6',
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { min: 80, max: 100, ticks: { callback: (v) => `${v}%` } },
    },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}%` } },
    },
  };

  return (
    <div className="h-40">
      <Line data={chartData} options={options} />
    </div>
  );
}
