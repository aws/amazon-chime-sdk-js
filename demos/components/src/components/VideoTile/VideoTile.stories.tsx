import { storiesOf } from '@storybook/react';
import React from 'react';

import { VideoTile } from './';

storiesOf('VideoTile', module)
.add('VideoTile', () => {
  return (
    <div style={{ width: '45%', margin: '2rem auto' }}>
      <VideoTile bindVideoTile={() => {}} nameplate="Test name" />
    </div>
  );
});
