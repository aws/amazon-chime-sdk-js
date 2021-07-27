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

const ignoredTypes = [
  // These are @internal Voice Focus types.
  'VoiceFocusTransformDeviceDelegate',
  'LoggerAdapter',

  // Generated versioning data.
  'version',

  'SignalingProtocol',
  'index',
  'ScreenSignalingProtocol',

  // Events ingestion buffer's JSON interfaces.
  'JSONIngestionPayloadItem',
  'JSONIngestionEvent',
  'JSONIngestionRecord',

  // Events ingestion internal functions.
  'flattenEventAttributes'
];

walk('src')
  .filter(fn => fn.endsWith('.ts'))
  .forEach(file => {
    if (file.includes('rust/')) {
      return;
    }
    let typeToImport = path.basename(file).replace(new RegExp('[.].*'), '');
    let pathToImport = './' + path.dirname(file).replace('src/', '');
    if (ignoredTypes.includes(typeToImport)) {
      return;
    }

    const importLine = `import ${typeToImport} from '${pathToImport}/${typeToImport}';`;
    const exportLine = `  ${typeToImport},`;
    importStrings.push(importLine);
    exportStrings.push(exportLine);

    // Because these two types are very intertwined.
    if (typeToImport === 'VideoPreferences') {
      importStrings.push(`import { MutableVideoPreferences } from '${pathToImport}/VideoPreferences';`);
      exportStrings.push(`  MutableVideoPreferences,`);
    }

    // It's hard to add type guard functions to this Java-ish class model, so
    // forgive the hack.
    if (typeToImport === 'AudioTransformDevice') {
      importStrings.push(`import { isAudioTransformDevice } from '${pathToImport}/AudioTransformDevice';`);
      exportStrings.push(`  isAudioTransformDevice,`);
    }

    if (typeToImport === 'VideoTransformDevice') {
      importStrings.push(`import { isVideoTransformDevice } from '${pathToImport}/VideoTransformDevice';`);
      exportStrings.push(`  isVideoTransformDevice,`);
    }

    if (typeToImport === 'Destroyable') {
      importStrings.push(`import { isDestroyable } from '${pathToImport}/Destroyable';`);
      exportStrings.push(`  isDestroyable,`);
    }
  });

importStrings.sort();
exportStrings.sort();

const indexFile = importStrings.join('\n') + '\n\nexport {\n' + exportStrings.join('\n') + '\n}\n';
fs.writeFileSync('src/index.ts', indexFile);
