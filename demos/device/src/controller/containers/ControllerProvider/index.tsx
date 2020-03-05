import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';

import { initialState, reducer } from './reducer';

async function sendMessage(msg: { type: any }): Promise<void> {
  if (!window.controllerEnvironment) return;
  console.log(`Sending message to hub ${msg.type}`);

  const env = await window.controllerEnvironment;
  env.sendMessage(msg);
}

const ControllerStateContext = createContext(null);
const ControllerDispatchContext = createContext(null);

export const ControllerProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const wrappedDispatch = useCallback(msg => {
    sendMessage(msg);
    dispatch(msg);
  }, []);

  const messageHandler = (msg: any): void => {
    console.log(`Received message from Hub: ${msg.type}`);
    dispatch(msg);
  };

  useEffect(() => {
    if (!window.controllerEnvironment) return;

    window.controllerEnvironment.then((env: any): void => {
      env.init(messageHandler);
    });
  }, []);

  return (
    <ControllerStateContext.Provider value={state}>
      <ControllerDispatchContext.Provider value={wrappedDispatch}>
        {children}
      </ControllerDispatchContext.Provider>
    </ControllerStateContext.Provider>
  );
};

export function useControllerState(): any {
  const context = useContext(ControllerStateContext);
  if (context === undefined) {
    throw new Error('useControllerState must be used within a Provider');
  }
  return context;
}

export function useControllerDispatch(): any {
  const context = useContext(ControllerDispatchContext);
  if (context === undefined) {
    throw new Error('useControllerDispatch must be used within a Provider');
  }
  return context;
}

export default ControllerProvider;
