import React from 'react';

import KeyboardedInput from 'react-touch-screen-keyboard';
import 'react-touch-screen-keyboard/lib/Keyboard.css';

import './KeyboardInput.css';

interface KeyboardInput {
  active: boolean;
  value: string;
  label: string;
  onChange: (data: any) => any;
}

const KeyboardInput: React.FC<KeyboardInput> = ({ active, label, ...rest }) => {
  const classes = `KeyboardInput ${active ? 'KeyboardInput--active' : ''}`;

  return (
    <div className={classes}>
      <label className="KeyboardInput__label">{label}</label>
      <KeyboardedInput
        enabled
        showNumericRow
        isDraggable={false}
        showShift={false}
        showSymbols={false}
        showSubmit={false}
        {...rest}
      />
    </div>
  );
};

export default KeyboardInput;
