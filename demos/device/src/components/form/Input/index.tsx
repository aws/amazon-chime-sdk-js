import React from 'react';

import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
}

const Input: React.FC<InputProps> = props => {
  const { name, label, ...rest } = props;

  return (
    <div className="input-group">
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input {...rest} className="input" name={name} />
    </div>
  );
};

export default Input;
