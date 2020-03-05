import React, { useReducer, useEffect } from 'react';

import MeetingManager from '../MeetingManager';
import VideoGrid from '../components/VideoGrid';
import VideoTile from '../components/VideoTile';
import { ScreenMessageDetail } from '../../../../../build';
import { DeviceMessage } from '../../shim/types';
import { Type as actionType } from './RoomProvider/reducer';
import { useRoomProviderDispatch, useRoomProviderState } from './RoomProvider/index';

function reducer(state, { type, payload }) {
  switch (type) {
    case 'TILE_UPDATED': {
      const { tileId, ...rest } = payload;
      return {
        ...state,
        [tileId]: {
          ...rest,
        },
      };
    }
    case 'TILE_DELETED': {
      const { [payload]: omit, ...rest } = state;
      return {
        ...rest,
      };
    }
    default: {
      return state;
    }
  }
}
// TODO: Make as component.
export const screenViewDiv = () => document.getElementById('shared-content-view') as HTMLDivElement;

const VideoManager = () => {
  const roomProviderDispatch = useRoomProviderDispatch();
  const { isViewingSharedScreen } = useRoomProviderState();
  const [state, dispatch] = useReducer(reducer, {});

  const videoTileDidUpdate = tileState => {
    console.log(tileState.isContent)
    dispatch({ type: 'TILE_UPDATED', payload: tileState });
  };

  const videoTileWasRemoved = (tileId: number) => {
    dispatch({ type: 'TILE_DELETED', payload: tileId });
  };

  const nameplateDiv = () =>
    document.getElementById('share-content-view-nameplate') as HTMLDivElement;

  const streamDidStart = (screenMessageDetail: ScreenMessageDetail): void => {
    MeetingManager.getAttendee(screenMessageDetail.attendeeId).then((name: string) => {
      nameplateDiv().innerHTML = name;
    });
    const deviceMessage: DeviceMessage = {
      type: actionType.StartScreenShareView,
    };

    roomProviderDispatch(deviceMessage);
  };

  const streamDidStop = (screenMesssageDetail: ScreenMessageDetail): void => {
    nameplateDiv().innerHTML = 'No one is sharing screen';
    const deviceMessage: DeviceMessage = {
      type: actionType.StopScreenShareView,
    };

    roomProviderDispatch(deviceMessage);
  };

  const videoObservers = { videoTileDidUpdate, videoTileWasRemoved };
  const screenShareObservers = { streamDidStart, streamDidStop };

  useEffect(() => {
    MeetingManager.addAudioVideoObserver(videoObservers);
    MeetingManager.registerScreenShareObservers(screenShareObservers);

    return () => {
      MeetingManager.removeMediaObserver(videoObservers);
      MeetingManager.removeScreenShareObserver(screenShareObservers);
    };
  }, []);

  useEffect(() => {
    screenViewDiv().style.display = isViewingSharedScreen ? 'grid' : 'none';
  }, [isViewingSharedScreen]);

  const videos = Object.keys(state).map(tileId => (
    <VideoTile
      key={tileId}
      nameplate="Attendee ID"
      isLocal={state[tileId].localTile}
      bindVideoTile={videoRef => MeetingManager.bindVideoTile(parseInt(tileId), videoRef)}
    />
  ));

  return <VideoGrid size={videos.length}>{videos}</VideoGrid>;
};

export default VideoManager;
