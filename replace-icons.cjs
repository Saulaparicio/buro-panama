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

function getRelativeImport(fromFile, toFile) {
    let rel = path.relative(path.dirname(fromFile), toFile);
    rel = rel.replace(/\\/g, '/');
    if (!rel.startsWith('.')) rel = './' + rel;
    return rel;
}

const iconComponentPath = path.join(__dirname, 'components/ui/Icon');

let totalReplaced = 0;

walkDir(__dirname, (filePath) => {
    // skip Icon.tsx itself and PremiumSelect and ErrorBoundary since we did them manually
    if (filePath.includes('Icon.tsx') || filePath.includes('ErrorBoundary.tsx') || filePath.includes('PremiumSelect.tsx')) return;

    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // Pattern: <span className="material-symbols-outlined [optional extra classes]">(content)</span>
    // Note: className could be just "material-symbols-outlined" or "material-symbols-outlined extra-class"
    
    // We need to match <span ... className="...material-symbols-outlined..." ... > ... </span>
    // This is a bit tricky with Regex.
    // Let's use a replacer function.

    const spanRegex = /<span([^>]*)>([\s\S]*?)<\/span>/g;
    
    let needsImport = false;
    
    content = content.replace(spanRegex, (match, attrs, innerText) => {
        if (!attrs.includes('material-symbols-outlined')) {
            return match;
        }

        // Extract className
        let classNameMatch = attrs.match(/className=(["'])(.*?)\1/);
        let classNameValue = classNameMatch ? classNameMatch[2] : '';
        
        // Remove "material-symbols-outlined" from className
        let newClassName = classNameValue.replace(/material-symbols-outlined/g, '').trim();
        // Replace multiple spaces with single space
        newClassName = newClassName.replace(/\s+/g, ' ');

        // Keep other attributes (like onClick)
        let otherAttrs = attrs.replace(/className=(["'])(.*?)\1/, '').trim();

        let iconName = innerText.trim();
        if (!iconName) return match; // fallback just in case

        needsImport = true;
        totalReplaced++;

        let nameProp = iconName.startsWith('{') && iconName.endsWith('}') 
            ? `name=${iconName}` 
            : `name="${iconName}"`;
        
        let classProp = newClassName ? ` className="${newClassName}"` : '';
        let otherPropStr = otherAttrs ? ` ${otherAttrs}` : '';

        return `<Icon ${nameProp}${classProp}${otherPropStr} />`;
    });

    if (content !== original) {
        // Add import
        if (needsImport && !content.includes('components/ui/Icon') && !content.includes('Icon from')) {
            const relPath = getRelativeImport(filePath, iconComponentPath);
            // Insert after the last import, or at the top
            const importRegex = /import .* from '.*';\r?\n/g;
            let lastMatch = null;
            let m;
            while ((m = importRegex.exec(content)) !== null) {
                lastMatch = m;
            }
            const importStatement = `import { Icon } from '${relPath}';\n`;
            if (lastMatch) {
                const insertPos = lastMatch.index + lastMatch[0].length;
                content = content.substring(0, insertPos) + importStatement + content.substring(insertPos);
            } else {
                content = importStatement + content;
            }
        }

        fs.writeFileSync(filePath, content, 'utf-8');
    }
});

console.log(`Replaced ${totalReplaced} icons.`);
