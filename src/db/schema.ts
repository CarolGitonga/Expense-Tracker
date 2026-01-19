import { pgTable, serial, text, integer, date, timestamp } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  // store amount in cents: KES 1.00 = 100 (avoids decimal rounding issues)
  amount: integer("amount").notNull(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  expenseDate: date("expense_date").notNull(), // YYYY-MM-DD
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
