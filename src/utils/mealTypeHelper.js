import { getMealTypesWithTimeframes } from '../services/configService';

export const getMealTypeByTime = async () => {
  const now = new Date();
  const current = now.toTimeString().slice(0, 5);

  const config = await getMealTypesWithTimeframes();

  for (const type of config) {
    for (const tf of type.timeframes) {
      if (current >= tf.start && current < tf.end) {
        return { id: type.id, name: type.name };
      }
    }
  }

  return null;
};