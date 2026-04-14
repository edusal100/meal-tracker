import { db } from '../db/db';

export const getSetting = async (key) => {
  const row = await db.settings.where('key').equals(key).first();
  return row?.value ?? null;
};

export const setSetting = async (key, value) => {
  const existing = await db.settings.where('key').equals(key).first();
  if (existing) return db.settings.update(existing.id, { value });
  return db.settings.add({ key, value });
};