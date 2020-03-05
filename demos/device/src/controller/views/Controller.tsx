import React from 'react';

import { ControllerProvider } from '../containers/ControllerProvider';
import Lobby from '../containers/Lobby';

const Controller = () => {
  return (
    <ControllerProvider>
      <Lobby />
    </ControllerProvider>
  );
};

export default Controller;
