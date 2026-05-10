import { LDrawLoader } from "./node_modules/three/examples/jsm/loaders/LDrawLoader.js";
import { FileLoader, LoaderUtils, LoadingManager } from "three";
import fs from "fs";
import path from "path";

// Fake fetch/environment to run in Node
global.self = global;
global.window = global;

class MockFileLoader {
  constructor() {}
  setPath(p) { return this; }
  setRequestHeader(h) { return this; }
  setWithCredentials(c) { return this; }
  load(url, onLoad, onProgress, onError) {
    fs.readFile(url, "utf-8", (err, data) => {
      if (err) onError(err);
      else onLoad(data);
    });
  }
  async loadAsync(url) {
    return fs.readFileSync(url, "utf-8");
  }
}

// We modify LDrawLoader internal usage
const loader = new LDrawLoader();
loader.smoothNormals = true;

const file = "src/public/models/car.ldr_Packed.mpd";
const content = fs.readFileSync(file, "utf-8");

loader.partsCache.parseModel(content).then(group => {
    console.log("Model successfully loaded!");
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
    
    console.log("--- RESULT ---");
    console.log("Total Groups found:", groupsFound);
    console.log("Groups with userData.buildingStep:", withStep);
    console.log("Max BuildingStep value found:", maxStep);
    process.exit(0);
}).catch(err => {
    console.error("Loader Error:", err);
    process.exit(1);
});
