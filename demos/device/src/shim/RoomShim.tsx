import React, { useEffect } from 'react';

import BrowserEnvironment from './BrowserEnvironment';
import DolbyEnvironment from './DolbyEnvironment';

const RoomShim: React.FC = () => {
  useEffect(() => {
    if (window.deviceEnvironment) return;

    console.log('Initializing Room shim layer');

    const urlParams = new URLSearchParams(window.location.search);
    const shim = urlParams.get('shim');

    if (shim === 'dolby') {
      console.log('Dolby shim param found. Setting up DolbyEnvironment');
      const dapi = window.dapi;

      if (!dapi) {
        console.error('No dapi detected, aborting');
      }

      window.deviceEnvironment = Promise.resolve(new DolbyEnvironment(dapi));
    } else {
      console.log('No shim param found. Setting up BrowserEnvironment');

      window.deviceEnvironment = Promise.resolve(new BrowserEnvironment());
    }
  }, []);

  return null;
};

export default RoomShim;
