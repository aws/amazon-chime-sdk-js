const fs = require('fs');
const { execSync } = require('child_process');

const watchlist = fs.readFileSync('.integration-watchlist', 'utf-8').split("\n");
const base = fs.readFileSync('.base-branch', 'utf8').trim();
const commits = execSync(`git rev-list ${base}..`, {encoding: "utf8" }).trim().split('\n');

let requires_integration_test = false
for (const commit of commits) {
    const commit_files = execSync(`git diff-tree --no-commit-id --name-only -r ${commit}`, {encoding: "utf8" }).trim().split('\n');
    for (const committed_file of commit_files) {
        let matches = false;
        for (const stem of watchlist) {
            if (stem == '' || stem.startsWith('#')) {
                continue;
            } else if (stem.startsWith('!')) {
                if (committed_file.startsWith(stem.substring(1))) {
                    matches = false;
                }
            } else if (committed_file.startsWith(stem)) {
                matches = true;
            }
        }
        if (matches) {
            requires_integration_test = true;
        }
    }
}
if (requires_integration_test) {
    process.env.INTEG_TEST_REQUIRED = true;
    console.log("Integration tests are required.");
} else {
    console.log("Integration tests are not required.");
}

process.exit(0)
