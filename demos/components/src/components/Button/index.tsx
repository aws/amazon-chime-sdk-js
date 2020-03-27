import React from 'react';
import { StyledButton } from './Styled';

export interface ButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  icon?: JSX.Element;
  label: string;
  addStyles?: Object;
}

export const Button: React.FC<ButtonProps> = props => {
  const { icon, label } = props;
  return (
    <StyledButton {...props}>
      {icon && <span className="icon">{icon}</span>}
      <span className="label">{label}</span>
    </StyledButton>
  );
};

export default Button;
