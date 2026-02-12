import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DailyBarChartProps {
  data: { day: string; total: number }[];
}

export default function DailyBarChart({ data }: DailyBarChartProps) {
  if (data.length === 0) return null;

  const labels = data.map((d) => {
    const date = new Date(d.day + "T00:00:00");
    return DAY_NAMES[date.getDay()];
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: "Daily spending",
        data: data.map((d) => d.total / 100),
        backgroundColor: "#4f46e5",
        borderRadius: 6,
        maxBarThickness: 48,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items: { dataIndex: number }[]) => {
            const idx = items[0]?.dataIndex;
            if (idx == null) return "";
            return data[idx].day;
          },
          label: (ctx: { parsed: { y: number } }) => {
            return new Intl.NumberFormat("en-KE", {
              style: "currency",
              currency: "KES",
            }).format(ctx.parsed.y);
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: string | number) => {
            const n = typeof value === "string" ? parseFloat(value) : value;
            if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
            return String(n);
          },
        },
      },
    },
  };

  return (
    <div className="relative h-72">
      <Bar data={chartData} options={options as any} />
    </div>
  );
}
