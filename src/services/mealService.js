import { db } from '../db/db';
import { getSetting } from './settingsService';

const station = await getSetting('stationNumber') ?? '1';

export const addMeal = async (employee, mealType) => {
  const today = new Date().toISOString().split('T')[0];

  const exists = await db.meals
    .filter(m =>
      m.employeeId === employee.employeeId &&
      m.date.startsWith(today) &&
      m.mealType === mealType.id
    )
    .first();

  if (exists) {
    return { success: false, message: 'Already scanned' };
  }

  await db.meals.add({
    employeeId: employee.employeeId,
    company: employee.company,
    mealType: mealType.id,
    station,
    date: new Date().toISOString()
  });

  return { success: true };
};

export const getTodayMeals = async () => {
  const today = new Date().toISOString().split('T')[0];

  return await db.meals
    .filter(m => m.date.startsWith(today))
    .toArray();
};

export const getAllMeals = async () => {
  return await db.meals.toArray();
};

export const deleteMeal = async (id) => {
  return await db.meals.delete(id);
};