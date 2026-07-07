const fs = require('fs');
const path = require('path');

const excludeDirs = new Set(['.git', 'node_modules', 'dist', '.agent', 'scratch']);
const fileExtensions = new Set(['.ts', '.tsx', '.html', '.css', '.js', '.mjs', '.json', '.md']);

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (excludeDirs.has(file)) return;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else {
            const ext = path.extname(file);
            if (fileExtensions.has(ext)) {
                results.push(filePath);
            }
        }
    });
    return results;
}

function main() {
    const workspacePath = 'c:\\Antigravity\\buró-panamá-workspace';
    const files = walk(workspacePath);
    console.log(`Found ${files.length} files to scan.`);

    files.forEach(filePath => {
        try {
            const originalContent = fs.readFileSync(filePath, 'utf8');
            let content = originalContent;
            
            // Perform replacements
            content = content.replace(/Atelier/g, 'Workspace');
            content = content.replace(/atelier/g, 'workspace');
            content = content.replace(/ATELIER/g, 'WORKSPACE');

            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Updated: ${filePath}`);
            }
        } catch (e) {
            console.error(`Error processing ${filePath}:`, e.message);
        }
    });
    console.log('Replacement completed.');
}

main();
