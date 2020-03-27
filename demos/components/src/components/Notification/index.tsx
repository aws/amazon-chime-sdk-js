import React from 'react';

import { StyledNotification, StyledButton } from './Styled';
import { Caution, Check, Information } from '../icons';
import { Button } from '../Button';

export type Severity = 'success' | 'warning' | 'error' | 'info';
export type Size = 'sm' | 'md' | 'lg' | 'fill';

export interface NotificationProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  severity?: Severity;
  onClose?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  closeText?: string;
  size?: Size;
}

const iconMapping = {
  success: <Check />,
  warning: <Caution />,
  error: <Caution />,
  info: <Information />,
};

export const Notification: React.FC<NotificationProps> = props => {
  const {
    closeText = 'close',
    severity = 'info',
    size = 'md',
    icon = iconMapping[severity],
    onClose,
    children,
  } = props;
  const ariaLive = severity === 'error' ? 'assertive' : 'polite';
  const ariaRole = severity === 'error' ? 'alert' : 'status';

  return (
    <StyledNotification
      aria-live={ariaLive}
      role={ariaRole}
      severity={severity}
      size={size}
      {...props}
    >
      <div className="icon">{icon}</div>
      <div className="message">{children}</div>
      {onClose && (
        <Button className="button" addStyles={StyledButton} onClick={onClose} label={closeText} />
      )}
    </StyledNotification>
  );
};

export default Notification;
