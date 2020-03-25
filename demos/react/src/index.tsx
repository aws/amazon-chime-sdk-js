import ReactDOM from 'react-dom';
import React from 'react';

import App from './components/App';

ReactDOM.render(
  <App name="Chime SDK React Demo" />,
  document.querySelector('#container')
);

const anyModule = module as any;
if (anyModule.hot) {
  anyModule.hot.accept();
}
