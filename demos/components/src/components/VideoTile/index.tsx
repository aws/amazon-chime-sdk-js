import React, { useEffect, useRef } from 'react';
import { StyledVideoTile } from './Styled';

export interface VideoTileProps {
  nameplate: string;
  bindVideoTile: (arg0: any) => void;
}

export const VideoTile: React.SFC<VideoTileProps> = props => {
  const videoEl = useRef(null);
  const { bindVideoTile } = props;

  useEffect(() => {
    !!videoEl && bindVideoTile(videoEl.current);
  }, [bindVideoTile, videoEl]);

  return (
    <StyledVideoTile {...props}>
      <video ref={videoEl} className="video" />
      <header className="nameplate">
        <div>
          <p className="text">{props.nameplate}</p>
        </div>
      </header>
    </StyledVideoTile>
  );
};

export default VideoTile;
