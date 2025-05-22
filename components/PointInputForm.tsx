// components/PointInputForm.tsx

import React from 'react';

type Props = {
  label: string;
  x: number;
  y: number;
  z: number;
  onChange: (axis: 'x' | 'y' | 'z', value: number) => void;
};

const PointInputForm: React.FC<Props> = ({ label, x, y, z, onChange }) => {
  return (
    <div>
      <h3>{label}</h3>
      <input
        type="number"
        placeholder="X"
        value={x}
        onChange={(e) => onChange('x', Number(e.target.value))}
      />
      <input
        type="number"
        placeholder="Y"
        value={y}
        onChange={(e) => onChange('y', Number(e.target.value))}
      />
      <input
        type="number"
        placeholder="Z"
        value={z}
        onChange={(e) => onChange('z', Number(e.target.value))}
      />
    </div>
  );
};

export default PointInputForm;
