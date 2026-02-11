import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { categories, expenses } from "@/db/schema";

export async function getCategories() {
  return db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.name);
}

export async function listExpenses(params: { month?: string; categoryId?: number }) {
  const where = [];

  if (params.categoryId) where.push(eq(expenses.categoryId, params.categoryId));

  if (params.month) {
    const start = `${params.month}-01`;
    const [y, m] = params.month.split("-").map(Number);
    const next =
      m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;

    where.push(gte(expenses.expenseDate, start));
    where.push(lt(expenses.expenseDate, next));
  }

  return db
    .select({
      id: expenses.id,
      amount: expenses.amount,
      expenseDate: expenses.expenseDate,
      note: expenses.note,
      categoryId: categories.id,
      categoryName: categories.name,
    })
    .from(expenses)
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(sql`${expenses.expenseDate} desc, ${expenses.id} desc`);
}

export async function monthlySummary(month: string) {
  const start = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const next =
    m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;

  const totalRow = await db
    .select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` })
    .from(expenses)
    .where(and(gte(expenses.expenseDate, start), lt(expenses.expenseDate, next)));

  const byCategory = await db
    .select({
      category: categories.name,
      total: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
    .where(and(gte(expenses.expenseDate, start), lt(expenses.expenseDate, next)))
    .groupBy(categories.name)
    .orderBy(sql`2 desc`);

  return { total: totalRow[0]?.total ?? 0, byCategory };
}

export async function createExpense(input: {
  amount: number; // cents
  categoryId: number;
  expenseDate: string; // YYYY-MM-DD
  note?: string | null;
}) {
  await db.insert(expenses).values({
    amount: input.amount,
    categoryId: input.categoryId,
    expenseDate: input.expenseDate,
    note: input.note ?? null,
  });
}

export async function getExpenseById(id: number) {
  const rows = await db
    .select({
      id: expenses.id,
      amount: expenses.amount,
      expenseDate: expenses.expenseDate,
      note: expenses.note,
      categoryId: expenses.categoryId,
    })
    .from(expenses)
    .where(eq(expenses.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function updateExpense(
  id: number,
  input: {
    amount: number;
    categoryId: number;
    expenseDate: string;
    note?: string | null;
  },
) {
  await db
    .update(expenses)
    .set({
      amount: input.amount,
      categoryId: input.categoryId,
      expenseDate: input.expenseDate,
      note: input.note ?? null,
    })
    .where(eq(expenses.id, id));
}

export async function deleteExpense(id: number) {
  await db.delete(expenses).where(eq(expenses.id, id));
}
