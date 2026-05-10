import { LDrawLoader } from "./node_modules/three/examples/jsm/loaders/LDrawLoader.js";
import { LDrawConditionalLineMaterial } from "./node_modules/three/examples/jsm/materials/LDrawConditionalLineMaterial.js";
import fs from "fs";

const loader = new LDrawLoader();
loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);

const file = "src/public/models/7140-1-X-wingFighter.mpd_Packed.mpd";
const content = fs.readFileSync(file, "utf-8");

loader.partsCache.parseModel(content).then(group => {
    loader.computeBuildingSteps(group);
    
    let maxStep = 0;
    let totalGroups = 0;
    group.traverse(c => {
      if (c.isGroup && c.userData.buildingStep !== undefined) {
         totalGroups++;
         maxStep = Math.max(maxStep, c.userData.buildingStep);
      }
    });
    
    console.log("--- X-WING LOADER RESULT ---");
    console.log("Total Groups with BuildingStep:", totalGroups);
    console.log("Max BuildingStep assigned in graph:", maxStep);
    process.exit(0);
}).catch(e => {
    console.error("Error loading model:", e);
    process.exit(1);
});
