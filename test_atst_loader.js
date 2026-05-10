import { LDrawLoader } from "./node_modules/three/examples/jsm/loaders/LDrawLoader.js";
import { LDrawConditionalLineMaterial } from "./node_modules/three/examples/jsm/materials/LDrawConditionalLineMaterial.js";
import fs from "fs";

const loader = new LDrawLoader();
loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);

const file = "src/public/models/10174-1-ImperialAT-ST-UCS.mpd_Packed.mpd";
const content = fs.readFileSync(file, "utf-8");

loader.partsCache.parseModel(content).then(group => {
    loader.computeBuildingSteps(group);
    let maxStep = 0;
    group.traverse(c => {
      if (c.isGroup && c.userData.buildingStep !== undefined) {
         maxStep = Math.max(maxStep, c.userData.buildingStep);
      }
    });
    console.log("--- AT-ST LOADER RESULT ---");
    console.log("Max BuildingStep assigned:", maxStep);
    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
