import { createFileRoute, Link } from "@tanstack/react-router";
import { monthlySummary } from "@/db/queries/expenses";
import CategoryDoughnut from "../components/CategoryDoughnut";

function yyyyMmNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function prevMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
}

function formatKes(cents: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export const Route = createFileRoute("/")({
  staleTime: 0,

  validateSearch: (search: Record<string, unknown>) => {
    const month =
      typeof search.month === "string" && /^\d{4}-\d{2}$/.test(search.month)
        ? search.month
        : yyyyMmNow();
    return { month };
  },

  loader: async ({ location }) => {
    const searchParams = new URLSearchParams(location.search);
    const month = searchParams.get("month") ?? yyyyMmNow();
    const prev = prevMonth(month);

    const [summary, prevSummary] = await Promise.all([
      monthlySummary(month),
      monthlySummary(prev),
    ]);

    return { summary, prevTotal: prevSummary.total, month };
  },

  component: DashboardPage,
});

function DashboardPage() {
  const { summary, prevTotal, month } = Route.useLoaderData();
  const navigate = Route.useNavigate();

  const pctChange =
    prevTotal > 0
      ? Math.round(((summary.total - prevTotal) / prevTotal) * 100)
      : null;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Link
          to="/expenses"
          search={{ month }}
          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          View all expenses &rarr;
        </Link>
      </div>

      {/* Month picker */}
      <div className="mt-5">
        <label className="block">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Month</span>
          <input
            type="month"
            value={month}
            onChange={(e) => navigate({ search: { month: e.target.value } })}
            className="mt-1 block w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </label>
      </div>

      {/* Total spending card */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-sm text-gray-500">Total spending</div>
        <div className="mt-1 text-3xl font-bold tracking-tight">
          {formatKes(summary.total)}
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
              {Math.abs(pctChange)}% from last month
            </span>
            <span className="text-gray-400">({formatKes(prevTotal)})</span>
          </div>
        )}

        {pctChange === null && summary.total > 0 && (
          <div className="mt-2 text-sm text-gray-400">
            No data for previous month to compare
          </div>
        )}
      </div>

      {/* Category breakdown */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">By category</h2>

        {summary.byCategory.length === 0 ? (
          <p className="mt-3 text-gray-500">
            No expenses recorded for this month.{" "}
            <Link
              to="/expenses/new"
              search={{ month }}
              className="text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Add one &rarr;
            </Link>
          </p>
        ) : (
          <>
            <div className="mt-4">
              <CategoryDoughnut data={summary.byCategory} />
            </div>

            <ul className="mt-4 divide-y divide-gray-100">
              {summary.byCategory.map((row) => (
                <li
                  key={row.category}
                  className="flex items-center justify-between py-3"
                >
                  <span className="text-sm text-gray-700">{row.category}</span>
                  <span className="text-sm font-semibold">{formatKes(row.total)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
