import { db } from '../db/db';

export const getEmployees = async () => {
  return await db.employees.orderBy('name').toArray();
};

export const searchEmployees = async (text) => {
  if (!text) return getEmployees();

  return await db.employees
    .filter(e =>
      e.name.toLowerCase().includes(text.toLowerCase()) ||
      e.employeeId.toString().includes(text)
    )
    .toArray();
};

export const addEmployee = async (emp) => {
  return await db.employees.add(emp);
};

export const deleteAllEmployees = async () => {
  return await db.employees.clear();
};

export const bulkImportEmployees = async (rows) => {
  const employees = rows.map(row => ({
    employeeId: String(row.employeeId),
    name:       String(row.name),
    company:    String(row.company),
  }));
  return await db.employees.bulkAdd(employees);
};