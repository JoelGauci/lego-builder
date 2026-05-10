import { countModelSteps } from './src/utils/ldraw-parser.js';
import path from 'path';
import fs from 'fs';

const sampleFile = path.resolve('src/public/models/car.ldr_Packed.mpd');

console.log(`--- Verification Test ---`);
console.log(`Target file: ${sampleFile}`);

if (fs.existsSync(sampleFile)) {
    const steps = countModelSteps(sampleFile);
    console.log(`[SUCCESS] Successfully parsed model steps count: ${steps}`);
} else {
    console.error('[ERROR] Sample model not found. Download failed.');
}
