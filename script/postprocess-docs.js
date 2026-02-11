#!/usr/bin/env node

/**
 * Post-processes generated documentation files.
 *
 * 1. Collects all HTML files and builds a map of filenames that need lowercasing.
 * 2. Replaces commit hashes in blob URLs with 'main' and updates internal links to use lowercase filenames.
 * 3. Renames HTML files to lowercase.
 * 4. Updates search.js and navigation.js asset files with lowercase references.
 * 5. Copies modules.html to globals.html for backward compatibility.
 */

const fs = require('fs-extra');
const path = require('path');

const DOCS_DIR = 'docs';

function walkDir(dir) {
  const results = [];
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      results.push(...walkDir(filePath));
    } else {
      results.push(filePath);
    }
  }
  return results;
}

function buildRenameMap(htmlFiles) {
  const renameMap = new Map();
  for (const file of htmlFiles) {
    const basename = path.basename(file);
    const lowercase = basename.toLowerCase();
    if (basename !== lowercase) {
      renameMap.set(basename, lowercase);
    }
  }
  return renameMap;
}

function processFile(file, renameMapObj) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  content = content.replace(/blob\/[0-9a-f]{5,40}\//g, 'blob/main/');

  for (const [orig, lower] of Object.entries(renameMapObj)) {
    const escaped = orig.replace('.', '\\.');
    // Handle href="path/File.html" and href="File.html" (without anchors)
    content = content.replace(
      new RegExp(`(href=["'][^"']*/?)${escaped}(["'])`, 'g'),
      `$1${lower}$2`
    );
    // Handle href="path/File.html#anchor" (with anchors)
    content = content.replace(
      new RegExp(`(href=["'][^"']*/?)${escaped}(#[^"']*["'])`, 'g'),
      `$1${lower}$2`
    );
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
}

function renameToLowercase(htmlFiles, renameMap) {
  for (const file of htmlFiles) {
    const basename = path.basename(file);
    if (renameMap.has(basename)) {
      const newPath = path.join(path.dirname(file), renameMap.get(basename));
      fs.renameSync(file, newPath);
    }
  }
}

function updateAssetFile(filePath, renameMap) {
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Handle compressed navigation.js (base64 + pako)
  if (filePath.endsWith('navigation.js')) {
    const match = content.match(/window\.navigationData = "([^"]+)"/);
    if (match) {
      try {
        const pako = require('pako');
        const decoded = Buffer.from(match[1], 'base64');
        let jsonStr = pako.inflate(decoded, { to: 'string' });

        for (const [original, lowercase] of renameMap) {
          jsonStr = jsonStr.replace(new RegExp(original.replace('.', '\\.'), 'g'), lowercase);
        }

        const compressed = pako.deflate(jsonStr);
        const encoded = Buffer.from(compressed).toString('base64');
        content = `window.navigationData = "${encoded}"`;
        fs.writeFileSync(filePath, content, 'utf8');
        return;
      } catch (e) {
        console.warn('Failed to process navigation.js:', e.message);
      }
    }
  }

  if (filePath.endsWith('search.js')) {
    content = content.replace(/","/g, '",\n"');
    content = content.replace(/},{/g, '},\n{');
  }

  for (const [original, lowercase] of renameMap) {
    content = content.replace(new RegExp(original.replace('.', '\\.'), 'g'), lowercase);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

async function main() {
  const htmlFiles = walkDir(DOCS_DIR).filter(f => f.endsWith('.html'));
  const renameMap = buildRenameMap(htmlFiles);
  const renameMapObj = Object.fromEntries(renameMap);

  for (const file of htmlFiles) {
    processFile(file, renameMapObj);
  }

  renameToLowercase(htmlFiles, renameMap);

  updateAssetFile(path.join(DOCS_DIR, 'assets', 'search.js'), renameMap);
  updateAssetFile(path.join(DOCS_DIR, 'assets', 'navigation.js'), renameMap);

  const modulesPath = path.join(DOCS_DIR, 'modules.html');
  const globalsPath = path.join(DOCS_DIR, 'globals.html');
  if (fs.existsSync(modulesPath)) {
    fs.copyFileSync(modulesPath, globalsPath);
  }
}

main();
