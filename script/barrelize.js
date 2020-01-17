#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs-extra');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

const walk = function(dir) {
  let results = [];
  let list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    let stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
};

const importStrings = [];
const exportStrings = [];

walk('src')
  .filter(fn => fn.endsWith('.ts'))
  .forEach(file => {
    if (file.includes('rust/')) {
      return;
    }
    let typeToImport = path.basename(file).replace(new RegExp('[.].*'), '');
    let pathToImport = './' + path.dirname(file).replace('src/', '');
    if (
      typeToImport === 'SignalingProtocol' ||
      typeToImport === 'index' ||
      typeToImport === 'ScreenSignalingProtocol'
    ) {
      return;
    }
    let importLine = [
      'import',
      typeToImport,
      'from',
      "'" + pathToImport + '/' + typeToImport + "'",
    ];
    let exportLine = '  ' + typeToImport + ',';
    importStrings.push(importLine.join(' ') + ';');
    exportStrings.push(exportLine);
  });

importStrings.sort();
exportStrings.sort();

const indexFile = importStrings.join('\n') + '\n\nexport {\n' + exportStrings.join('\n') + '\n}\n';
fs.writeFileSync('src/index.ts', indexFile);
