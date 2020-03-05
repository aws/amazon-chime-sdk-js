import React from 'react';

import { ButtonProps, Button } from './';
import { StyledPrimaryButton } from './Styled';

export const PrimaryButton: React.FC<ButtonProps> = (props) => <Button addStyles={StyledPrimaryButton} {...props} />;

export default PrimaryButton;
