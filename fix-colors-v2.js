const fs = require('fs');
const path = require('path');

const appPath = path.join(process.cwd(), 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf-8');

appContent = appContent.replace(
  "bg-buro-black text-primary",
  "bg-buro-black text-sky-400"
);
appContent = appContent.replace(
  "z-50 size-16 bg-buro-black text-sky-400 rounded-[1.75rem]",
  "z-[90] size-16 bg-buro-black text-sky-400 rounded-[1.75rem]"
);

// Fix bottom nav active colors
appContent = appContent.replace(
  "'bg-primary/15 text-primary scale-105'",
  "'bg-primary/15 text-sky-400 scale-105'"
);
appContent = appContent.replace(
  "{isActive(item.path) ? 'text-primary' : 'text-stone-400 group-hover:text-stone-300'}",
  "{isActive(item.path) ? 'text-sky-400' : 'text-stone-400 group-hover:text-stone-300'}"
);

fs.writeFileSync(appPath, appContent);
console.log('App.tsx fixed');

const resPath = path.join(process.cwd(), 'pages/Reservations.tsx');
let resContent = fs.readFileSync(resPath, 'utf-8');

// Fix toggle MAPA/LISTA
resContent = resContent.replaceAll(
  "'text-stone-300 hover:text-buro-black'",
  "'text-stone-500 hover:text-buro-black'"
);

// Fix Créditos/H
resContent = resContent.replaceAll(
  "text-stone-300 uppercase",
  "text-stone-500 uppercase"
);

// Fix amenities icons under cards
resContent = resContent.replaceAll(
  "!text-sm text-stone-200",
  "!text-sm text-stone-400"
);

resContent = resContent.replaceAll(
  "!text-lg text-stone-200",
  "!text-lg text-stone-400"
);

// Fix other text-stone-300 elements like Table Headers where readability is compromised
resContent = resContent.replaceAll(
  "text-stone-300 border-b",
  "text-stone-500 border-b"
);

fs.writeFileSync(resPath, resContent);
console.log('Reservations.tsx fixed');

