const fs = require('fs');
const path = require('path');

const assetDefinitions = [{
    path: 'audio/',
    outputPath: 'dist/',
    ext: ['mp3'],
}];

assetDefinitions.forEach(assetDef => {
    const files = fs.readdirSync(assetDef.path);

    if (!fs.existsSync(assetDef.outputPath)) {
        fs.mkdirSync(assetDef.outputPath, {recursive: true});
    }

    files.filter(f => assetDef.ext.includes(f.split('.').pop())).forEach(f => {
        fs.copyFileSync(path.join(assetDef.path, f), path.join(assetDef.outputPath, f));
    });
});