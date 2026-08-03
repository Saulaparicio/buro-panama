const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist') {
        walkDir(dirPath, callback);
      }
    } else {
      if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
        callback(dirPath);
      }
    }
  });
}

const icons = new Set();
walkDir(__dirname, (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const regex = /<span[^>]*material-symbols-outlined[^>]*>\s*([^<]+)\s*<\/span>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    icons.add(match[1].trim());
  }
});

console.log(Array.from(icons).sort().join('\n'));
