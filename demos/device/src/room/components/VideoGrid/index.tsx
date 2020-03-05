import React from 'react';

import './VideoGrid.css';

interface VideoGridProps {
  size: number;
}

const VideoGrid: React.FC<VideoGridProps> = ({ children, size }) => {
  return (
    <>
      <div id="shared-content-view" className="screenview unselectable">
        <div id="share-content-view-nameplate">No one is sharing screen</div>
      </div>
      <div className={`VideoGrid ${`VideoGrid--size-${size}`}`}>{children}</div>
    </>
  );
};

export default VideoGrid;
