// Package the existing artwork; no new artwork or network access is required.
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
if(process.platform !== 'darwin') throw new Error('Icon regeneration uses macOS sips/iconutil. Other platforms use the committed assets.');
const source = resolve('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
const output = resolve('public/icons');
mkdirSync(output,{recursive:true});
const temp = mkdtempSync(join(tmpdir(),'videe-icons-'));
const resize = (size,path,input=source) => execFileSync('sips',['-z',String(size),String(size),input,'--out',path],{stdio:'pipe'});
try {
  copyFileSync(source,resolve('public/icon.png'));
  const rounded = join(output,'icon-rounded.png');
  execFileSync('swift',['-module-cache-path',join(temp,'swift-cache'),resolve('scripts/round-icon.swift'),source,rounded],{stdio:'pipe'});
  // iOS touch icon stays opaque. Other web surfaces use the explicit silhouette.
  for(const size of [32,180,192,512]) resize(size,join(output,`icon-${size}.png`),size===180 ? source : rounded);
  // Store PNG payloads directly in ICNS. This avoids iconutil rejecting valid
  // iconsets on newer macOS releases while preserving every Finder resolution.
  const icnsEntries = [['ic10',1024],['ic09',512],['ic08',256],['ic07',128],['icp6',64],['icp5',32],['icp4',16]];
  const icnsChunks = icnsEntries.map(([type,size]) => {
    const path = join(temp,`icns-${size}.png`); resize(size,path,rounded);
    const image = readFileSync(path); const chunk = Buffer.alloc(8 + image.length);
    chunk.write(String(type),0,4,'ascii'); chunk.writeUInt32BE(chunk.length,4); image.copy(chunk,8);
    return chunk;
  });
  const icns = Buffer.alloc(8); icns.write('icns',0,4,'ascii'); icns.writeUInt32BE(8 + icnsChunks.reduce((sum,chunk) => sum + chunk.length,0),4);
  writeFileSync(join(output,'Videe.icns'),Buffer.concat([icns,...icnsChunks]));
  const sizes = [16,32,48,64,128,256];
  const images = sizes.map(size=>{const path=join(temp,`${size}.png`);resize(size,path,rounded);return readFileSync(path);});
  const header = Buffer.alloc(6+16*sizes.length); header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);
  let offset=header.length;
  images.forEach((png,i)=>{const entry=6+i*16;header[entry]=header[entry+1]=sizes[i]===256?0:sizes[i];header.writeUInt16LE(1,entry+4);header.writeUInt16LE(32,entry+6);header.writeUInt32LE(png.length,entry+8);header.writeUInt32LE(offset,entry+12);offset+=png.length;});
  writeFileSync(join(output,'Videe.ico'),Buffer.concat([header,...images]));
  console.log('Generated macOS ICNS, Windows ICO, web and touch icons from the existing 1024px artwork.');
} finally {rmSync(temp,{recursive:true,force:true});}
