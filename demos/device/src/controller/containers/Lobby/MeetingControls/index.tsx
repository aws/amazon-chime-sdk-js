import './MeetingControls.css';

import React from 'react';

import Button from '../../../../components/Button';
import { useControllerDispatch, useControllerState } from '../../ControllerProvider';
import { Type as actionType } from '../../../../room/containers/RoomProvider/reducer';

const MeetingControls: React.FC = () => {
  const state = useControllerState();
  const dispatch = useControllerDispatch();

  const toggleVideoTile = (): void => {
    dispatch({
      type: state.isSharingLocalVideo ? actionType.StopLocalVideo : actionType.StartLocalVideo,
    });
  };

  const toggleScreenShareViewTile = (): void => {
    dispatch({
      type: state.isViewingSharedScreen
        ? actionType.StopScreenShareView
        : actionType.StartScreenShareView,
    });
  };

  const leaveMeeting = (): void => {
    dispatch({
      type: actionType.LeaveMeeting,
    });
  };

  const endMeeting = (): void => {
    dispatch({
      type: actionType.EndMeeting,
    });
  };

  return (
    <div className="MeetingControls">
      <Button active={state.isSharingLocalVideo} onClick={toggleVideoTile}>
        {state.isSharingLocalVideo ? 'Disable video' : 'Enable video'}
      </Button>
      <Button active={state.isViewingSharedScreen} onClick={toggleScreenShareViewTile}>
        {state.isViewingSharedScreen ? 'Hide ScreenShare' : 'View ScreenShare'}
      </Button>
      <Button onClick={leaveMeeting}>Leave meeting</Button>
      <Button onClick={endMeeting}>End meeting</Button>
    </div>
  );
};

export default MeetingControls;
