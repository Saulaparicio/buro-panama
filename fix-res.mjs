import fs from 'fs';
import path from 'path';

const resPath = path.join(process.cwd(), 'pages/Reservations.tsx');
let resContent = fs.readFileSync(resPath, 'utf-8');

resContent = resContent.replace(/text-stone-300 hover:text-buro-black/g, "text-stone-500 hover:text-buro-black");
resContent = resContent.replace(/text-stone-300 uppercase/g, "text-stone-500 uppercase");
resContent = resContent.replace(/!text-sm text-stone-200/g, "!text-sm text-stone-500");
resContent = resContent.replace(/!text-lg text-stone-200/g, "!text-lg text-stone-500");
resContent = resContent.replace(/text-stone-300 border-b/g, "text-stone-400 border-b");

fs.writeFileSync(resPath, resContent);
console.log("Reservations.tsx contrast fixed.");
