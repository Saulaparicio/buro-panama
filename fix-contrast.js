import fs from 'fs';
import path from 'path';

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
             results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

function fix() {
  const dirs = ['components', 'pages', 'App.tsx'];
  let files = [];
  let pendingDirs = dirs.length;

  dirs.forEach(d => {
    const fullPath = path.resolve(process.cwd(), d);
    if (!fs.existsSync(fullPath)) {
      pendingDirs--;
      if (pendingDirs === 0) processFiles(files);
      return;
    }
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, (err, res) => {
        files = files.concat(res);
        pendingDirs--;
        if (pendingDirs === 0) processFiles(files);
      });
    } else {
      files.push(fullPath);
      pendingDirs--;
      if (pendingDirs === 0) processFiles(files);
    }
  });
}

function processFiles(files) {
  let changed = 0;
  for (let file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('bg-primary text-buro-black')) {
      content = content.replace(/bg-primary text-buro-black/g, 'bg-primary text-white');
      fs.writeFileSync(file, content, 'utf8');
      changed++;
    }
  }
  console.log(`Updated ${changed} files.`);
}

fix();
