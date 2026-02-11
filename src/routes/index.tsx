import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { monthlySummary } from "@/db/queries/expenses";
import CategoryDoughnut from "../components/CategoryDoughnut";

function yyyyMmNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatKes(cents: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export const Route = createFileRoute("/")({
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
    const summary = await monthlySummary(month);
    return { summary, month };
  },

  component: DashboardPage,
});

function DashboardPage() {
  const { summary, month } = Route.useLoaderData();
  const navigate = Route.useNavigate();

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <Link to="/expenses" search={{ month }}>
          View all expenses →
        </Link>
      </div>

      {/* Month picker */}
      <div style={{ marginTop: 16 }}>
        <label style={{ display: "grid", gap: 6, maxWidth: 200 }}>
          <span>Month</span>
          <input
            type="month"
            value={month}
            onChange={(e) => navigate({ search: { month: e.target.value } })}
          />
        </label>
      </div>

      {/* Total spending card */}
      <div
        style={{
          marginTop: 20,
          padding: 20,
          border: "1px solid #ddd",
          borderRadius: 12,
          background: "#fafafa",
        }}
      >
        <div style={{ fontSize: 14, color: "#666" }}>Total spending</div>
        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>
          {formatKes(summary.total)}
        </div>
      </div>

      {/* Category breakdown */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>By category</h2>

        {summary.byCategory.length === 0 ? (
          <p style={{ color: "#888" }}>
            No expenses recorded for this month.{" "}
            <Link to="/expenses/new" search={{ month }}>
              Add one →
            </Link>
          </p>
        ) : (
          <>
            <CategoryDoughnut data={summary.byCategory} />

            {/* Category list with amounts */}
            <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
              {summary.byCategory.map((row) => (
                <li
                  key={row.category}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <span>{row.category}</span>
                  <span style={{ fontWeight: 600 }}>{formatKes(row.total)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
