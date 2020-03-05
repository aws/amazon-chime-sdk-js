import React from 'react';

import MeetingAudio from '../containers/MeetingAudio';
import VideoManager from '../containers/VideoManager';

const Meeting = (): JSX.Element => {
  return (
    <>
      <h1>In-Meeting</h1>
      <VideoManager />
      <MeetingAudio />
    </>
  );
};

export default Meeting;
