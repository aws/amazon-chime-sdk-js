import React, { ButtonHTMLAttributes } from 'react';

import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, active, ...rest }) => (
  <button className={`Button ${active ? 'Button--active' : ''}`} {...rest}>
    {children}
  </button>
);

export default Button;
