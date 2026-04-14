import { useRef, useEffect } from 'react';

export default function ScanInput({ onScan }) {
  const ref = useRef();

  useEffect(() => {
    ref.current.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const value = e.target.value.trim();
      if (!value) return;

      onScan(value);
      e.target.value = '';
    }
  };

  return (
    <input
      ref={ref}
      onKeyDown={handleKeyDown}
      placeholder="Scan employee..."
      style={{
        width: '100%',
        boxSizing: 'border-box',
        padding: 20,
        fontSize: 24
      }}
    />
  );
}