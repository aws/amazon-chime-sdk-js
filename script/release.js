#!/usr/bin/env node

const { versionBump}  = require('./version-utils');

(async ()=>{
  await versionBump();

})();