export default function EmployeeList({ employees, onSelect }) {
  return (
    <div>
      {employees.map(emp => (
        <div
          key={emp.id}
          onClick={() => onSelect(emp)}
          style={{
            padding: 12,
            borderBottom: '1px solid #ccc',
            cursor: 'pointer'
          }}
        >
          <strong>{emp.name}</strong> - {emp.company}
        </div>
      ))}
    </div>
  );
}