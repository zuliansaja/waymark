// Memindahkan file bernama "src__app__page.tsx" ke "src/app/page.tsx" sebelum build.
const fs = require('fs'), path = require('path');
for (const f of fs.readdirSync('.')) {
  if (!f.includes('__') || !fs.statSync(f).isFile()) continue;
  const dest = f.split('__').join('/');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(f, dest);
  console.log('moved', f, '->', dest);
}
