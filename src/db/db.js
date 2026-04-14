import Dexie from 'dexie';

export const db = new Dexie('MealTrackerDB');

db.version(2).stores({
  employees: '++id, employeeId, name, company',
  meals: '++id, employeeId, date, mealType, station',
  mealTypes: '++id, name',
  timeframes: '++id, mealTypeId, start, end',
  settings: '++id, key, value'
});