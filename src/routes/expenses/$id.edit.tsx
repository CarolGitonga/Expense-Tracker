import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCategories, getExpenseById, updateExpense } from "@/db/queries/expenses";

type UpdateInput = {
  id: number;
  amountKes: string;
  categoryId: number;
  expenseDate: string;
  note?: string;
};

const updateExpenseFn = createServerFn({ method: "POST" })
  .inputValidator((d: UpdateInput) => d)
  .handler(async ({ data: input }) => {
    const amountNumber = Number(input.amountKes);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      throw new Error("Amount must be a positive number");
    }

    const cents = Math.round(amountNumber * 100);

    if (!input.expenseDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.expenseDate)) {
      throw new Error("Invalid date");
    }

    await updateExpense(input.id, {
      amount: cents,
      categoryId: Number(input.categoryId),
      expenseDate: input.expenseDate,
      note: input.note?.trim() ? input.note.trim() : null,
    });

    return { ok: true };
  });

export const Route = createFileRoute("/expenses/$id/edit")({
  staleTime: 0,

  loader: async ({ params }) => {
    const id = Number(params.id);
    const [expense, categories] = await Promise.all([
      getExpenseById(id),
      getCategories(),
    ]);

    if (!expense) {
      throw new Error("Expense not found");
    }

    return { expense, categories };
  },

  component: EditExpensePage,
});

function EditExpensePage() {
  const { expense, categories } = Route.useLoaderData();
  const navigate = Route.useNavigate();

  const [expenseDate, setExpenseDate] = React.useState(String(expense.expenseDate));
  const [categoryId, setCategoryId] = React.useState<number>(expense.categoryId);
  const [amountKes, setAmountKes] = React.useState(String(expense.amount / 100));
  const [note, setNote] = React.useState(expense.note ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const monthFromDate = expenseDate.slice(0, 7);

  const inputClass =
    "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Edit expense</h1>
        <Link
          to="/expenses"
          search={{ month: monthFromDate, categoryId: undefined }}
          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          &larr; Back
        </Link>
      </div>

      <form
        className="mt-6 grid gap-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setBusy(true);
          try {
            await updateExpenseFn({ data: { id: expense.id, amountKes, categoryId, expenseDate, note } });
            await navigate({ to: "/expenses", search: { month: monthFromDate, categoryId: undefined } });
          } catch (err: any) {
            setError(err?.message ?? "Failed to update expense");
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
          {busy ? "Saving..." : "Update expense"}
        </button>
      </form>
    </div>
  );
}
