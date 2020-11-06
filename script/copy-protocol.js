#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs-extra');
fs.copy('./src/signalingprotocol/', './build/signalingprotocol/', err => {
  if (err) return console.error(err);
});
