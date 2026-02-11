import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCategories, createExpense } from "@/db/queries/expenses";

const createExpenseFn = createServerFn(
  "POST",
  async (input: { amountKes: string; categoryId: number; expenseDate: string; note?: string }) => {
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
  },
);

export const Route = createFileRoute("/expenses/new")({
  validateSearch: (search: Record<string, unknown>) => {
    const month =
      typeof search.month === "string" && /^\d{4}-\d{2}$/.test(search.month)
        ? search.month
        : undefined;
    return { month };
  },

  loader: async () => {
    const categories = await getCategories();
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
  const navigate = Route.useNavigate();

  const [expenseDate, setExpenseDate] = React.useState(todayYyyyMmDd());
  const [categoryId, setCategoryId] = React.useState<number>(categories[0]?.id ?? 0);
  const [amountKes, setAmountKes] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Add expense</h1>
        <Link to="/expenses" search={{ month: month ?? undefined, categoryId: undefined }}>
          ← Back
        </Link>
      </div>

      {categories.length === 0 ? (
        <div style={{ marginTop: 16 }}>
          No categories found. Add some categories first (we can add a `/categories` page next).
        </div>
      ) : (
        <form
          style={{ marginTop: 16, display: "grid", gap: 12 }}
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setBusy(true);
            try {
              await createExpenseFn({ amountKes, categoryId, expenseDate, note });
              // Go back to list (keep month filter if present)
              await navigate({ to: "/expenses", search: { month: month ?? expenseDate.slice(0, 7), categoryId: undefined } });
            } catch (err: any) {
              setError(err?.message ?? "Failed to create expense");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span>Date</span>
            <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Category</span>
            <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Amount (KES)</span>
            <input
              inputMode="decimal"
              placeholder="e.g. 250"
              value={amountKes}
              onChange={(e) => setAmountKes(e.target.value)}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Note (optional)</span>
            <input placeholder="e.g. Lunch, Uber..." value={note} onChange={(e) => setNote(e.target.value)} />
          </label>

          {error ? <div style={{ color: "crimson" }}>{error}</div> : null}

          <button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save expense"}
          </button>
        </form>
      )}
    </div>
  );
}
 