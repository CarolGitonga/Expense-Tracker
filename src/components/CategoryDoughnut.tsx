import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  "#4f46e5", // indigo
  "#0891b2", // cyan
  "#16a34a", // green
  "#eab308", // yellow
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f97316", // orange
];

interface CategoryDoughnutProps {
  data: { category: string; total: number }[];
}

export default function CategoryDoughnut({ data }: CategoryDoughnutProps) {
  if (data.length === 0) return null;

  const chartData = {
    labels: data.map((d) => d.category),
    datasets: [
      {
        data: data.map((d) => d.total / 100),
        backgroundColor: data.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { padding: 16, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { label?: string; parsed: number }) => {
            const value = new Intl.NumberFormat("en-KE", {
              style: "currency",
              currency: "KES",
            }).format(ctx.parsed);
            return `${ctx.label}: ${value}`;
          },
        },
      },
    },
  };

  return (
    <div className="relative h-72 max-w-sm">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
