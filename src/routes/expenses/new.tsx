import * as React from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

type ExpenseInput = {
  amountKes: string;
  categoryId: number;
  expenseDate: string;
  note?: string;
};

const getCategoriesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getCategories } = await import("@/db/queries/expenses");
  return await getCategories();
});

const createExpenseFn = createServerFn({ method: "POST" })
  .inputValidator((d: ExpenseInput) => d)
  .handler(async ({ data: input }) => {
    const { createExpense } = await import("@/db/queries/expenses");

    const amountNumber = Number(input.amountKes);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      throw new Error("Amount must be a positive number");
    }

    const cents = Math.round(amountNumber * 100);

    if (!input.expenseDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.expenseDate)) {
      throw new Error("Invalid date");
    }

    await createExpense({
      amount: cents,
      categoryId: Number(input.categoryId),
      expenseDate: input.expenseDate,
      note: input.note?.trim() ? input.note.trim() : null,
    });

    return { ok: true };
  });

export const Route = createFileRoute("/expenses/new")({
  validateSearch: (search: Record<string, unknown>) => {
    const month =
      typeof search.month === "string" && /^\d{4}-\d{2}$/.test(search.month)
        ? search.month
        : undefined;
    return { month };
  },

  loader: async () => {
    const categories = await getCategoriesFn();
    return { categories };
  },

  component: NewExpensePage,
});

function todayYyyyMmDd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function NewExpensePage() {
  const { categories } = Route.useLoaderData();
  const { month } = Route.useSearch();
  const router = useRouter();
  const navigate = Route.useNavigate();

  const [expenseDate, setExpenseDate] = React.useState(todayYyyyMmDd());
  const [categoryId, setCategoryId] = React.useState<number>(categories[0]?.id ?? 0);
  const [amountKes, setAmountKes] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const inputClass =
    "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Add expense</h1>
        <Link
          to="/expenses"
          search={{ month: month ?? undefined, categoryId: undefined }}
          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          &larr; Back
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className="mt-4 text-gray-500">
          No categories found. Add some categories first.
        </p>
      ) : (
        <form
          className="mt-6 grid gap-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setBusy(true);
            try {
              await createExpenseFn({ data: { amountKes, categoryId, expenseDate, note } });
              await router.invalidate();
              await navigate({ to: "/expenses", search: { month: month ?? expenseDate.slice(0, 7), categoryId: undefined } });
            } catch (err: any) {
              setError(err?.message ?? "Failed to create expense");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="block">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</span>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className={`mt-1 ${inputClass}`}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount (KES)</span>
            <input
              inputMode="decimal"
              placeholder="e.g. 250"
              value={amountKes}
              onChange={(e) => setAmountKes(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Note (optional)</span>
            <input
              placeholder="e.g. Lunch, Uber..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {busy ? "Saving..." : "Save expense"}
          </button>
        </form>
      )}
    </div>
  );
}
