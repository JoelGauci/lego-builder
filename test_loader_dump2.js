import { LDrawLoader } from "./node_modules/three/examples/jsm/loaders/LDrawLoader.js";
import { LDrawConditionalLineMaterial } from "./node_modules/three/examples/jsm/materials/LDrawConditionalLineMaterial.js";
import fs from "fs";

const loader = new LDrawLoader();
loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);

const file = "src/public/models/car.ldr_Packed.mpd";
const content = fs.readFileSync(file, "utf-8");

loader.partsCache.parseModel(content).then(group => {
    loader.computeBuildingSteps(group);
    
    let groupsFound = 0;
    let withStep = 0;
    let maxStep = 0;
    
    group.traverse(c => {
      if (c.isGroup) {
         groupsFound++;
         if (c.userData.buildingStep !== undefined) {
            withStep++;
            maxStep = Math.max(maxStep, c.userData.buildingStep);
         }
      }
    });
    
    console.log("--- FINAL RESULT ---");
    console.log("Total Groups found:", groupsFound);
    console.log("Groups with buildingStep:", withStep);
    console.log("Max BuildingStep value:", maxStep);
    process.exit(0);
}).catch(err => {
    console.error("Loader Error:", err);
    process.exit(1);
});
