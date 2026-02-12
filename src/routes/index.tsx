import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import CategoryDoughnut from "../components/CategoryDoughnut";
import DailyBarChart from "../components/DailyBarChart";

/* ── helpers ── */

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d.toISOString().split("T")[0]!;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0]!;
}

function fillWeekDays(
  weekStart: string,
  data: { day: string; total: number }[],
): { day: string; total: number }[] {
  const map = new Map(data.map((d) => [d.day, d.total]));
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    return { day, total: map.get(day) ?? 0 };
  });
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(weekStart + "T00:00:00");
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-KE", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function yyyyMmFromWeek(weekStart: string): string {
  return weekStart.slice(0, 7);
}

function formatKes(cents: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/* ── server functions ── */

const loadDashboardFn = createServerFn({ method: "GET" })
  .inputValidator((d: { week: string }) => d)
  .handler(async ({ data }) => {
    const { weeklySummary, dailyBreakdown, monthlySummary } = await import(
      "@/db/queries/expenses"
    );

    const prevWeek = addDays(data.week, -7);
    const month = yyyyMmFromWeek(data.week);

    const [weekSummary, prevWeekSummary, daily, monthSummary] =
      await Promise.all([
        weeklySummary(data.week),
        weeklySummary(prevWeek),
        dailyBreakdown(data.week),
        monthlySummary(month),
      ]);

    return {
      weekSummary,
      prevWeekTotal: prevWeekSummary.total,
      daily,
      monthTotal: monthSummary.total,
    };
  });

/* ── route ── */

export const Route = createFileRoute("/")({
  staleTime: 0,

  validateSearch: (search: Record<string, unknown>) => {
    const week =
      typeof search.week === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(search.week)
        ? search.week
        : getWeekStart(new Date());
    return { week };
  },

  loader: async ({ location }) => {
    const searchParams = new URLSearchParams(location.search);
    const week = searchParams.get("week") ?? getWeekStart(new Date());

    const data = await loadDashboardFn({ data: { week } });
    return { ...data, week };
  },

  component: DashboardPage,
});

/* ── component ── */

function DashboardPage() {
  const { weekSummary, prevWeekTotal, daily, monthTotal, week } =
    Route.useLoaderData();
  const navigate = Route.useNavigate();

  const month = yyyyMmFromWeek(week);
  const filledDaily = fillWeekDays(week, daily);

  const pctChange =
    prevWeekTotal > 0
      ? Math.round(
          ((weekSummary.total - prevWeekTotal) / prevWeekTotal) * 100,
        )
      : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Link
          to="/expenses"
          search={{ month, categoryId: undefined }}
          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          View all expenses &rarr;
        </Link>
      </div>

      {/* Week picker */}
      <div className="mt-5 flex items-end gap-3">
        <button
          onClick={() => navigate({ search: { week: addDays(week, -7) } } as any)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
        >
          &larr;
        </button>

        <div>
          <span className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Week
          </span>
          <span className="mt-1 block text-sm font-medium text-gray-800">
            {formatWeekLabel(week)}
          </span>
        </div>

        <button
          onClick={() => navigate({ search: { week: addDays(week, 7) } } as any)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
        >
          &rarr;
        </button>

        <button
          onClick={() =>
            navigate({ search: { week: getWeekStart(new Date()) } } as any)
          }
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Weekly total card */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-sm text-gray-500">This week</div>
        <div className="mt-1 text-3xl font-bold tracking-tight">
          {formatKes(weekSummary.total)}
        </div>

        {pctChange !== null && (
          <div className="mt-2 flex items-center gap-1.5 text-sm">
            <span
              className={
                pctChange > 0
                  ? "text-red-600"
                  : pctChange < 0
                    ? "text-green-600"
                    : "text-gray-500"
              }
            >
              {pctChange > 0 ? "\u2191" : pctChange < 0 ? "\u2193" : "\u2192"}{" "}
              {Math.abs(pctChange)}% vs last week
            </span>
            <span className="text-gray-400">
              ({formatKes(prevWeekTotal)})
            </span>
          </div>
        )}

        {pctChange === null && weekSummary.total > 0 && (
          <div className="mt-2 text-sm text-gray-400">
            No data for previous week to compare
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {/* Daily bar chart */}
        <div>
          <h2 className="text-lg font-semibold">Daily spending</h2>
          <div className="mt-4">
            {filledDaily.every((d) => d.total === 0) ? (
              <p className="text-sm text-gray-400">No expenses this week.</p>
            ) : (
              <DailyBarChart data={filledDaily} />
            )}
          </div>
        </div>

        {/* Category doughnut */}
        <div>
          <h2 className="text-lg font-semibold">By category</h2>
          <div className="mt-4">
            {weekSummary.byCategory.length === 0 ? (
              <p className="text-sm text-gray-400">
                No expenses this week.{" "}
                <Link
                  to="/expenses/new"
                  search={{ month: undefined }}
                  className="text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Add one &rarr;
                </Link>
              </p>
            ) : (
              <CategoryDoughnut data={weekSummary.byCategory} />
            )}
          </div>
        </div>
      </div>

      {/* Category list */}
      {weekSummary.byCategory.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-100">
          {weekSummary.byCategory.map((row) => (
            <li
              key={row.category}
              className="flex items-center justify-between py-3"
            >
              <span className="text-sm text-gray-700">{row.category}</span>
              <span className="text-sm font-semibold">
                {formatKes(row.total)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Monthly summary card */}
      <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {new Date(week + "T00:00:00").toLocaleDateString("en-KE", {
                month: "long",
                year: "numeric",
              })}{" "}
              total
            </div>
            <div className="mt-1 text-xl font-bold tracking-tight">
              {formatKes(monthTotal)}
            </div>
          </div>
          <Link
            to="/expenses"
            search={{ month, categoryId: undefined }}
            className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            View month &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
