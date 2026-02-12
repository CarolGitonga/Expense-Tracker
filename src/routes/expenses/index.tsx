import * as React from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import CategoryIcon from "../../components/CategoryIcon";

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

const loadExpensesPageFn = createServerFn({ method: "GET" })
  .inputValidator((d: { month: string; categoryId?: number }) => d)
  .handler(async ({ data }) => {
    const { getCategories, listExpenses, monthlySummary } = await import("@/db/queries/expenses");
    const [categories, expenses, summary] = await Promise.all([
      getCategories(),
      listExpenses({ month: data.month, categoryId: data.categoryId }),
      monthlySummary(data.month),
    ]);
    return { categories, expenses, summary };
  });

const deleteExpenseFn = createServerFn({ method: "POST" })
  .inputValidator((d: number) => d)
  .handler(async ({ data: id }) => {
    const { deleteExpense } = await import("@/db/queries/expenses");
    await deleteExpense(id);
    return { ok: true };
  });

export const Route = createFileRoute("/expenses/")({
  staleTime: 0,

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

    const data = await loadExpensesPageFn({ data: { month, categoryId } });
    return { ...data, month, categoryId };
  },

  component: ExpensesPage,
});

function ExpensesPage() {
  const { categories, expenses, summary, month, categoryId } = Route.useLoaderData();
  const router = useRouter();
  const navigate = Route.useNavigate();

  const [busyId, setBusyId] = React.useState<number | null>(null);

  const inputClass =
    "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
        <Link
          to="/expenses/new"
          search={{ month }}
          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          Add expense
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap gap-4">
        <label className="block">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Month</span>
          <input
            type="month"
            value={month}
            onChange={(e) => navigate({ search: { month: e.target.value, categoryId } })}
            className={`mt-1 w-48 ${inputClass}`}
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</span>
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
            className={`mt-1 w-44 ${inputClass}`}
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

      {/* Month total */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="text-sm text-gray-500">Month total</div>
        <div className="mt-1 text-2xl font-bold tracking-tight">{formatKes(summary.total)}</div>
      </div>

      {/* By category */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">By category</h3>
        {summary.byCategory.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No expenses yet for this month.</p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-100">
            {summary.byCategory.map((row) => (
              <li key={row.category} className="flex items-center justify-between py-2">
                <span className="inline-flex items-center gap-2">
                  <CategoryIcon category={row.category} size="sm" />
                  <span className="text-sm text-gray-700">{row.category}</span>
                </span>
                <span className="text-sm font-semibold">{formatKes(row.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Entries table */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Entries</h3>

        {expenses.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No expenses found.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Note</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 w-28"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((x) => (
                  <tr key={x.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{String(x.expenseDate)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <CategoryIcon category={x.categoryName} size="sm" />
                        <span className="text-sm text-gray-700">{x.categoryName}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{x.note ?? ""}</td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">{formatKes(x.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to="/expenses/$id/edit"
                          params={{ id: String(x.id) }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          disabled={busyId === x.id}
                          className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 transition-colors cursor-pointer"
                          onClick={async () => {
                            setBusyId(x.id);
                            try {
                              await deleteExpenseFn({ data: x.id });
                              await router.invalidate();
                              await navigate({ search: { month, categoryId }, replace: true });
                            } finally {
                              setBusyId(null);
                            }
                          }}
                        >
                          {busyId === x.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
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
