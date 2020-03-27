import styled, { css } from 'styled-components';

import { NotificationProps, Severity, Size } from './';

// Todo - grab style values from theme provider
const colors = {
  success: '#98e571',
  warning: '#fad635',
  error: '#ea4a4c',
  info: '#7abef8',
};

const sizes = {
  sm: '30rem',
  md: '50rem',
  lg: '70rem',
  fill: '100%',
};

interface StyledNotificationProps extends NotificationProps {
  severity: Severity;
  size: Size;
}

export const StyledNotification = styled.div<StyledNotificationProps>`
  position: relative;
  display: flex;
  align-items: start;
  width: ${({ size }) => sizes[size]};
  max-width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 1rem;
  border-radius: 0.25rem;
  color: #1b1c20;
  font-size: 1rem;
  box-sizing: border-box;
  background: ${({ severity }) => colors[severity]};

  .icon {
    width: 2rem;
    flex-shrink: 0;
    color: #1b1c20;
  }

  .message {
    margin: 0 1.5rem 0 0.5rem;
    line-height: 2;
  }
`;

export const StyledButton = css`
  margin-left: auto;
  border: 0.125rem solid #1b1c20;
  background-color: unset;
  color: #1b1c20;
`;
