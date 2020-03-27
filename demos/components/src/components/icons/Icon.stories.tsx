import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs, text, boolean, select } from '@storybook/addon-knobs';

import {
  Arrow,
  Attendees,
  Camera,
  Caret,
  Caution,
  Check,
  Cog,
  Crown,
  DeskPhone,
  Dialer,
  Information,
  Laptop,
  Meeting,
  Microphone,
  Phone,
  Plus,
  Presenter,
  Record,
  ScreenShare,
  Share,
  Sound,
} from './';

storiesOf('Icons', module)
  .add('Arrow', () => (
    <Arrow
      direction={select(
        'direction',
        { up: 'up', right: 'right', down: 'down', left: 'left' },
        'down'
      )}
      width={text('width', '2rem')}
    />
  ))
  .add('Attendees', () => <Attendees width={text('width', '2rem')} />)
  .add('Camera', () => (
    <Camera disabled={boolean('disabled', false)} width={text('width', '2rem')} />
  ))
  .add('Caret', () => (
    <Caret
      direction={select(
        'direction',
        { up: 'up', right: 'right', down: 'down', left: 'left' },
        'down'
      )}
      width={text('width', '2rem')}
    />
  ))
  .add('Caution', () => <Caution width={text('width', '2rem')} />)
  .add('Check', () => <Check width={text('width', '2rem')} />)
  .add('Cog', () => <Cog width={text('width', '2rem')} />)
  .add('Crown', () => <Crown width={text('width', '2rem')} />)
  .add('DeskPhone', () => (
    <DeskPhone disabled={boolean('disabled', false)} width={text('width', '2rem')} />
  ))
  .add('Information', () => <Information width={text('width', '2rem')} />)
  .add('Laptop', () => <Laptop width={text('width', '2rem')} />)
  .add('Meeting', () => <Meeting width={text('width', '2rem')} />)
  .add('Microphone', () => (
    <Microphone disabled={boolean('disabled', false)} width={text('width', '2rem')} />
  ))
  .add('Phone', () => <Phone width={text('width', '2rem')} />)
  .add('Plus', () => <Plus width={text('width', '2rem')} />)
  .add('Presenter', () => <Presenter width={text('width', '2rem')} />)
  .add('Record', () => <Record width={text('width', '2rem')} />)
  .add('ScreenShare', () => <ScreenShare width={text('width', '2rem')} />)
  .add('Share', () => <Share width={text('width', '2rem')} />)
  .add('Sound', () => <Sound width={text('width', '2rem')} />);
