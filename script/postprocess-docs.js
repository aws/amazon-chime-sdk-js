#!/usr/bin/env node

/**
 * Post-processes generated TypeDoc documentation:
 * 1. Normalizes git blob references to use 'main' branch
 * 2. Converts HTML filenames to lowercase for URL consistency
 * 3. Updates all internal links to use lowercase paths
 * 4. Formats search.js for better readability
 * 5. Creates globals.html alias for backward compatibility
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

function updateFileContent(file, renameMap) {
  let content = fs.readFileSync(file, 'utf8');

  // Normalize git blob references to main branch
  content = content.replace(/blob\/[0-9a-f]{5,40}\//g, 'blob/main/');

  // Update links to use lowercase filenames
  for (const [original, lowercase] of renameMap) {
    const escaped = original.replace('.', '\\.');
    // Handle href="path/File.html" and href="File.html"
    content = content.replace(
      new RegExp(`(href=["'][^"']*/?)${escaped}(["'])`, 'g'),
      `$1${lowercase}$2`
    );
  }

  fs.writeFileSync(file, content, 'utf8');
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

  // Format for readability (search.js specific)
  if (filePath.endsWith('search.js')) {
    content = content.replace(/","/g, '",\n"');
    content = content.replace(/},{/g, '},\n{');
  }

  // Update references to lowercase
  for (const [original, lowercase] of renameMap) {
    content = content.replace(new RegExp(original.replace('.', '\\.'), 'g'), lowercase);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

function main() {
  const htmlFiles = walkDir(DOCS_DIR).filter(f => f.endsWith('.html'));
  const renameMap = buildRenameMap(htmlFiles);

  // Update content in all HTML files
  for (const file of htmlFiles) {
    updateFileContent(file, renameMap);
  }

  // Rename files to lowercase
  renameToLowercase(htmlFiles, renameMap);

  // Update asset files
  updateAssetFile(path.join(DOCS_DIR, 'assets', 'search.js'), renameMap);
  updateAssetFile(path.join(DOCS_DIR, 'assets', 'navigation.js'), renameMap);

  // Create globals.html alias for backward compatibility
  const modulesPath = path.join(DOCS_DIR, 'modules.html');
  const globalsPath = path.join(DOCS_DIR, 'globals.html');
  if (fs.existsSync(modulesPath)) {
    fs.copyFileSync(modulesPath, globalsPath);
  }
}

main();
