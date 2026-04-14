import { db } from '../db/db';

// ---- GET ----
export const getMealTypesWithTimeframes = async () => {
  const types = await db.mealTypes.toArray();
  const frames = await db.timeframes.toArray();

  return types.map(t => ({
    ...t,
    timeframes: frames.filter(f => f.mealTypeId === t.id)
  }));
};

// ---- MEAL TYPES ----
export const addMealType = async (name) => {
  if (!name) return;
  return await db.mealTypes.add({ name });
};

// ---- TIMEFRAMES ----
export const addTimeframe = async (mealTypeId) => {
  return await db.timeframes.add({
    mealTypeId,
    start: '00:00',
    end: '00:00'
  });
};

export const updateTimeframe = async (id, data) => {
  return await db.timeframes.update(id, data);
};

export const deleteTimeframe = async (id) => {
  return await db.timeframes.delete(id);
};

export const renameMealType = async (id, name) => {
  if (!name) return;
  return await db.mealTypes.update(id, { name });
};