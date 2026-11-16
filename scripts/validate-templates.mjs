import fs from 'node:fs';
const m = await import('../server/templates/catalog.js');
const ids = m.TEMPLATES.map(t => t.id);
console.log('templates', m.TEMPLATES.length, 'categories', m.TEMPLATE_CATEGORIES.length);
console.log('duplicates', ids.filter((id,i)=>ids.indexOf(id)!==i));
console.log(m.TEMPLATES.reduce((a,t)=>{a[t.category]=(a[t.category]||0)+1;return a},{}));
const missingImages=[];
for(const t of m.TEMPLATES){ for(const p of [t.image,t.image2,...(t.demo.gallery||[]),...t.demo.items.map(i=>i.image).filter(Boolean)]){ if(p && p.startsWith('/images/') && !fs.existsSync('client/public'+p)) missingImages.push(p); } }
console.log('missing images', [...new Set(missingImages)]);
const badItems = m.TEMPLATES.filter(t=>!t.demo.items.length).map(t=>t.id);
console.log('templates without items', badItems);
console.log('new', m.TEMPLATES.slice(-20).map(t=>t.id));
