import { LDrawLoader } from "./node_modules/three/examples/jsm/loaders/LDrawLoader.js";
import { LDrawConditionalLineMaterial } from "./node_modules/three/examples/jsm/materials/LDrawConditionalLineMaterial.js";
import { FileLoader } from "three";
import fs from "fs";

// Monkeypatch FileLoader to load from disk directly
FileLoader.prototype.load = function(url, onLoad, onProgress, onError) {
    try {
        const data = fs.readFileSync(url, "utf-8");
        onLoad(data);
    } catch(e) { onError(e); }
};

const loader = new LDrawLoader();
loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);

const file = "src/public/models/car.ldr_Packed.mpd";

loader.load(file, (group) => {
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
    
    console.log("--- ACTUAL LOAD RESULT ---");
    console.log("Total Groups:", groupsFound);
    console.log("Groups with buildingStep:", withStep);
    console.log("Max buildingStep:", maxStep);
    process.exit(0);
}, undefined, (e) => {
    console.error("LOAD ERROR:", e);
    process.exit(1);
});
