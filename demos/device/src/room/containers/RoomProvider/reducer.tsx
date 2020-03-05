export interface State {
  activeMeeting: boolean;
  isSharingLocalVideo: boolean;
  isViewingSharedScreen: boolean;
}

export enum Type {
  JoinMeeting = 'JOIN_MEETING',
  StartLocalVideo = 'START_LOCAL_VIDEO',
  StopLocalVideo = 'STOP_LOCAL_VIDEO',
  EndMeeting = 'END_MEETING',
  LeaveMeeting = 'LEAVE_MEETING',
  StartScreenShareView = 'START_SCREEN_SHARE_VIEW',
  StopScreenShareView = 'STOP_SCREEN_SHARE_VIEW',
}

export interface Action {
  type: Type;
  payload?: any;
}

export const initialState: State = {
  activeMeeting: false,
  isSharingLocalVideo: false,
  isViewingSharedScreen: false,
};

export function reducer(state: State, action: Action): State {
  const { type, payload } = action;
  switch (type) {
    case Type.JoinMeeting:
      return {
        ...state,
        activeMeeting: true,
      };
    case Type.StartLocalVideo:
      return {
        ...state,
        isSharingLocalVideo: true,
      };
    case Type.StopLocalVideo:
      return {
        ...state,
        isSharingLocalVideo: false,
      };
    case Type.EndMeeting:
      return {
        ...initialState,
      };
    case Type.LeaveMeeting:
      return {
        ...initialState,
      };
    case Type.StartScreenShareView:
      return {
        ...state,
        isViewingSharedScreen: true,
      };
    case Type.StopScreenShareView:
      return {
        ...state,
        isViewingSharedScreen: false,
      };
    default:
      return state;
  }
}
