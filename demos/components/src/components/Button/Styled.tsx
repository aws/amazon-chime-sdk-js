import styled, { css } from 'styled-components';
import { ButtonProps } from './';

export const StyledButton = styled.button<ButtonProps>`
  font-size: 0.85rem;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border-color: transparent;
  transition: background-color 0.1s ease;
  display: flex;
  align-items: center;

  &:hover {
    cursor: pointer;
  }

  &:focus {
    outline: none;
  }

  .icon {
    width: 1.5rem;
    height: 1.5rem;
    margin-right: 0.25rem;
  }

  ${props => `${props.addStyles}`}
`;

export const StyledPrimaryButton = css`
  background-color: #075fff;
  color: white;

  &:hover,
  &:focus {
    background-color: #004ddb;
  }

  &:active {
    background-color: #003eb0;
  }
`;

export const StyledSecondaryButton = css`
  background-color: white;
  color: #1b1c20;
  box-shadow: 0 1.5px 1px 0 rgba(27, 28, 32, 0.35);

  &:hover,
  &:focus {
    background-color: #e4e9f2;
  }

  &:active {
    background-color: #d4d5d8;
  }
`;
