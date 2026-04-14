import { db } from '../db/db';

export const nukeData = async ({ mealTypes, mealRecords, employees }) => {
  // Selectively clear if not nuking everything
  const nukeAll = mealTypes && mealRecords && employees;

  if (nukeAll) {
    // Full reset — deletes and recreates DB so auto-increment IDs restart from 1
    await db.delete();
    await db.open();
    return;
  }

  // Partial nuke — IDs won't reset but that's acceptable for partial clears
  if (mealTypes) {
    await db.mealTypes.clear();
    await db.timeframes.clear();
    await db.settings.clear();
  }
  if (mealRecords) await db.meals.clear();
  if (employees)   await db.employees.clear();
};