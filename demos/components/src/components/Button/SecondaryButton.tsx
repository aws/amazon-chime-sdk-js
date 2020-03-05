import React from 'react';
import { StyledSecondaryButton } from './Styled';

import { Button, ButtonProps } from './';

export const SecondaryButton: React.FC<ButtonProps> = props => <Button addStyles={StyledSecondaryButton} {...props} />;

export default SecondaryButton;
