#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs-extra');

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
  results.sort();
  return results;
};

let result = '';
let guides = '';

walk('guides')
  .filter(fn => fn.endsWith('.md'))
  .forEach(file => {
    const visibleName = file
      .replace('guides/', '')
      .replace('.md', '')
      .replace(/\d+_/, '')
      .replace('_', ' ');
    const namespaceName = file
      .replace('guides/', '')
      .replace('.md', '')
      .replace(/\d+_/, '')
      .replace('_', '');
    const urlName = file
      .replace('guides/', '')
      .replace('.md', '')
      .replace(/\d+_/, '')
      .replace('_', '%20');
    const webFilename = `${namespaceName.toLowerCase()}.html`;
    const feedback = `\n[Give feedback on this guide](https://github.com/aws/amazon-chime-sdk-js/issues/new?assignees=&labels=documentation&template=documentation-request.md&title=${urlName}%20feedback)`;
    const data = ' * ' + (fs.readFileSync(file, 'utf8') + feedback).split('\n').join('\n * ');
    console.log(file);
    guides += `* [${visibleName}](https://aws.github.io/amazon-chime-sdk-js/modules/${webFilename})\n`;
    result += `/**\n${data}\n */\nnamespace ${namespaceName} {}\n\n`;
  });

fs.writeFileSync('./guides/docs.ts', result, 'utf8');

let readme = fs.readFileSync('./README.md', 'utf8');
readme = readme.replace(
  /the following guides[:][\s\S]*[#][#][#] Prerequisites/m,
  `the following guides:\n\n${guides}\n### Prerequisites`
);
fs.writeFileSync('./README.md', readme, 'utf8');
