import { db } from '../db/db';

export const exportSettings = async () => {
  const mealTypes = await db.mealTypes.toArray();
  const timeframes = await db.timeframes.toArray();

  const blob = new Blob([JSON.stringify({
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    config: { mealTypes, timeframes }
  }, null, 2)], { type: 'application/json' });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'meal-tracker-settings.json';
  a.click();
};

export const importSettings = async (file) => {
  const text = await file.text();
  const { exportVersion, config } = JSON.parse(text);

  if (exportVersion !== 1) throw new Error('Unsupported version');

  await db.mealTypes.clear();
  await db.timeframes.clear();

  const typeMap = {};
  for (const t of config.mealTypes) {
    const oldId = t.id;
    const newId = await db.mealTypes.add({ name: t.name });
    typeMap[oldId] = newId;
  }

  for (const tf of config.timeframes) {
    await db.timeframes.add({
      mealTypeId: typeMap[tf.mealTypeId],
      start: tf.start,
      end: tf.end
    });
  }
};