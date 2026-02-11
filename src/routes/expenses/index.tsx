import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  deleteExpense,
  getCategories,
  listExpenses,
  monthlySummary,
} from "@/db/queries/expenses";

function yyyyMmNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatKesFromCents(cents: number) {
  const kes = cents / 100;
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(kes);
}

const deleteExpenseFn = createServerFn("POST", async (id: number) => {
  await deleteExpense(id);
  return { ok: true };
});

export const Route = createFileRoute("/expenses/")({
  validateSearch: (search: Record<string, unknown>) => {
    const month =
      typeof search.month === "string" && /^\d{4}-\d{2}$/.test(search.month)
        ? search.month
        : yyyyMmNow();

    const categoryId =
      typeof search.categoryId === "string" && /^\d+$/.test(search.categoryId)
        ? Number(search.categoryId)
        : undefined;

    return { month, categoryId };
  },

  loader: async ({ location }) => {
    const searchParams = new URLSearchParams(location.search);
    const month = searchParams.get("month") ?? yyyyMmNow();
    const categoryIdRaw = searchParams.get("categoryId");
    const categoryId = categoryIdRaw && /^\d+$/.test(categoryIdRaw) ? Number(categoryIdRaw) : undefined;

    const [categories, expenses, summary] = await Promise.all([
      getCategories(),
      listExpenses({ month, categoryId }),
      monthlySummary(month),
    ]);

    return { categories, expenses, summary, month, categoryId };
  },

  component: ExpensesPage,
});

function ExpensesPage() {
  const { categories, expenses, summary, month, categoryId } = Route.useLoaderData();
  const navigate = Route.useNavigate();

  const [busyId, setBusyId] = React.useState<number | null>(null);

  return (
    <div style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Expenses</h1>
        <Link to="/expenses/new" search={{ month }}>
          Add expense →
        </Link>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Month</span>
          <input
            type="month"
            value={month}
            onChange={(e) => navigate({ search: { month: e.target.value, categoryId } })}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Category</span>
          <select
            value={categoryId ?? ""}
            onChange={(e) =>
              navigate({
                search: {
                  month,
                  categoryId: e.target.value ? Number(e.target.value) : undefined,
                },
              })
            }
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
        <div style={{ fontWeight: 600 }}>Month total</div>
        <div style={{ fontSize: 22, marginTop: 6 }}>{formatKesFromCents(summary.total)}</div>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 8 }}>By category</h3>
        {summary.byCategory.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No expenses yet for this month.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {summary.byCategory.map((row) => (
              <li key={row.category}>
                {row.category}: {formatKesFromCents(row.total)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 8 }}>Entries</h3>

        {expenses.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No expenses found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Date</th>
                  <th style={th}>Category</th>
                  <th style={th}>Note</th>
                  <th style={{ ...th, textAlign: "right" }}>Amount</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((x) => (
                  <tr key={x.id}>
                    <td style={td}>{String(x.expenseDate)}</td>
                    <td style={td}>{x.categoryName}</td>
                    <td style={td}>{x.note ?? ""}</td>
                    <td style={{ ...td, textAlign: "right" }}>{formatKesFromCents(x.amount)}</td>
                    <td style={td}>
                      <button
                        disabled={busyId === x.id}
                        onClick={async () => {
                          setBusyId(x.id);
                          try {
                            await deleteExpenseFn(x.id);
                            await navigate({ search: { month, categoryId }, replace: true });
                            // loader will re-run on navigation
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        {busyId === x.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  borderBottom: "1px solid #ddd",
  textAlign: "left",
  padding: "10px 8px",
  fontWeight: 600,
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "10px 8px",
  verticalAlign: "top",
};
