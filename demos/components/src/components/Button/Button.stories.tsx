import React from 'react'

import { storiesOf } from '@storybook/react';
import { Button } from './';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

storiesOf('Button', module)
.add('Basic button', () => <Button className="bsaic-button" label="Basic button" />)
.add('Primary button', () => <PrimaryButton className="primary-button" label="This is a primary button" />)
.add('Secondary button', () => <SecondaryButton className="secondary-button" label="This is a secondary button" />);
