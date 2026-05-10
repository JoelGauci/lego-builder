import { LDrawLoader } from "./node_modules/three/examples/jsm/loaders/LDrawLoader.js";
import { LDrawConditionalLineMaterial } from "./node_modules/three/examples/jsm/materials/LDrawConditionalLineMaterial.js";
import { FileLoader } from "three";
import fs from "fs";

FileLoader.prototype.load = function(url, onLoad, onProgress, onError) {
    console.log("[FETCH REQUESTED]", url);
    try {
        const data = fs.readFileSync(url, "utf-8");
        onLoad(data);
    } catch(e) {
        console.log("[FETCH ERROR]", url);
        onError(e);
    }
};

const loader = new LDrawLoader();
loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
const file = "src/public/models/apigee.mpd";

loader.load(file, (group) => {
    console.log("[SUCCESS] Full load complete.");
    let instances = 0;
    group.traverse(c => {
        if (c.name === "p/4-4edge.dat") {
            instances++;
        }
    });
    console.log("Total instances of p/4-4edge.dat found in tree:", instances);
    process.exit(0);
}, undefined, (e) => {
    console.error("[LOAD FATAL]", e);
    process.exit(1);
});
