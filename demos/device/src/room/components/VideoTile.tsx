import React, { useEffect, useRef } from 'react';

interface VideoTileProps {
  isLocal: boolean;
  nameplate: string;
  bindVideoTile: (videoRef: any) => void;
}

const VideoTile: React.FC<VideoTileProps> = ({ bindVideoTile, nameplate, isLocal }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    bindVideoTile(videoRef.current);
  }, [videoRef, bindVideoTile]);

  const classes = `VideoTile ${isLocal ? 'VideoTile--local' : ''}`;
  return <video className={classes} ref={videoRef} />;
};

export default VideoTile;
