import { countModelSteps } from './src/utils/ldraw-parser.js';
import path from 'path';
import fs from 'fs';

const catalog = [
  { id: "car", fileName: "car.ldr_Packed.mpd" },
  { id: "lunar_vehicle", fileName: "1621-1-LunarMPVVehicle.mpd_Packed.mpd" },
  { id: "radar_truck", fileName: "889-1-RadarTruck.mpd_Packed.mpd" },
  { id: "trailer", fileName: "4838-1-MiniVehicles.mpd_Packed.mpd" },
  { id: "bulldozer", fileName: "4915-1-MiniConstruction.mpd_Packed.mpd" },
  { id: "helicopter", fileName: "4918-1-MiniFlyers.mpd_Packed.mpd" },
  { id: "plane", fileName: "5935-1-IslandHopper.mpd_Packed.mpd" },
  { id: "lighthouse", fileName: "30023-1-Lighthouse.ldr_Packed.mpd" },
  { id: "x-wing_mini", fileName: "30051-1-X-wingFighter-Mini.mpd_Packed.mpd" },
  { id: "at-st_mini", fileName: "30054-1-AT-ST-Mini.mpd_Packed.mpd" },
  { id: "at-at_mini", fileName: "4489-1-AT-AT-Mini.mpd_Packed.mpd" },
  { id: "shuttle", fileName: "4494-1-Imperial Shuttle-Mini.mpd_Packed.mpd" },
  { id: "tie_interceptor", fileName: "6965-1-TIEIntercep_4h4MXk5.mpd_Packed.mpd" },
  { id: "star_fighter", fileName: "6966-1-JediStarfighter-Mini.mpd_Packed.mpd" },
  { id: "x-wing", fileName: "7140-1-X-wingFighter.mpd_Packed.mpd" },
  { id: "at-st", fileName: "10174-1-ImperialAT-ST-UCS.mpd_Packed.mpd" }
];

console.log(`Running verification test covering ALL 16 model definitions...\n`);

let passCount = 0;
let failCount = 0;

catalog.forEach(m => {
    const targetPath = path.join('src/public/models', m.fileName);
    if (!fs.existsSync(targetPath)) {
        console.error(`[FAIL] Missing asset file: ${targetPath}`);
        failCount++;
        return;
    }
    
    try {
        const count = countModelSteps(targetPath);
        console.log(`[PASS] Model: ${m.id.padEnd(15)} | Steps Computed: ${String(count).padStart(2)}`);
        passCount++;
    } catch (e) {
        console.error(`[FAIL] Exception on model ${m.id}: ${e.message}`);
        failCount++;
    }
});

console.log(`\nFinal Result: ${passCount}/${catalog.length} models passed. Failed: ${failCount}`);

process.exit(failCount > 0 ? 1 : 0);
