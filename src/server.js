import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { countModelSteps } from "./utils/ldraw-parser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Path settings
const PUBLIC_DIR = path.join(__dirname, "public");
const MODELS_DIR = path.join(PUBLIC_DIR, "models");

// Static catalog configuration
const MODELS_CONFIG = [
  {
    id: "apigee",
    name: "Apigee Logo",
    fileName: "apigee.mpd",
    numBuildingSteps: 1,
  },
  {
    id: "car",
    name: "Car",
    fileName: "car.ldr_Packed.mpd",
    numBuildingSteps: 8,
  },
  {
    id: "lunar_vehicle",
    name: "Lunar Vehicle",
    fileName: "1621-1-LunarMPVVehicle.mpd_Packed.mpd",
    numBuildingSteps: 1,
  },
  {
    id: "radar_truck",
    name: "Radar Truck",
    fileName: "889-1-RadarTruck.mpd_Packed.mpd",
    numBuildingSteps: 5,
  },
  {
    id: "trailer",
    name: "Trailer",
    fileName: "4838-1-MiniVehicles.mpd_Packed.mpd",
    numBuildingSteps: 25,
  },
  {
    id: "bulldozer",
    name: "Bulldozer",
    fileName: "4915-1-MiniConstruction.mpd_Packed.mpd",
    numBuildingSteps: 40,
  },
  {
    id: "helicopter",
    name: "Helicopter",
    fileName: "4918-1-MiniFlyers.mpd_Packed.mpd",
    numBuildingSteps: 37,
  },
  {
    id: "plane",
    name: "Plane",
    fileName: "5935-1-IslandHopper.mpd_Packed.mpd",
    numBuildingSteps: 1,
  },
  {
    id: "lighthouse",
    name: "Lighthouse",
    fileName: "30023-1-Lighthouse.ldr_Packed.mpd",
    numBuildingSteps: 1,
  },
  {
    id: "x-wing_mini",
    name: "X-Wing mini",
    fileName: "30051-1-X-wingFighter-Mini.mpd_Packed.mpd",
    numBuildingSteps: 28,
  },
  {
    id: "at-st_mini",
    name: "AT-ST mini",
    fileName: "30054-1-AT-ST-Mini.mpd_Packed.mpd",
    numBuildingSteps: 24,
  },
  {
    id: "at-at_mini",
    name: "AT-AT mini",
    fileName: "4489-1-AT-AT-Mini.mpd_Packed.mpd",
    numBuildingSteps: 21,
  },
  {
    id: "shuttle",
    name: "Shuttle",
    fileName: "4494-1-Imperial Shuttle-Mini.mpd_Packed.mpd",
    numBuildingSteps: 31,
  },
  {
    id: "tie_interceptor",
    name: "TIE Interceptor",
    fileName: "6965-1-TIEIntercep_4h4MXk5.mpd_Packed.mpd",
    numBuildingSteps: 11,
  },
  {
    id: "star_fighter",
    name: "Star fighter",
    fileName: "6966-1-JediStarfighter-Mini.mpd_Packed.mpd",
    numBuildingSteps: 15,
  },
  {
    id: "x-wing",
    name: "X-Wing",
    fileName: "7140-1-X-wingFighter.mpd_Packed.mpd",
    numBuildingSteps: 101,
  },
  {
    id: "at-st",
    name: "AT-ST",
    fileName: "10174-1-ImperialAT-ST-UCS.mpd_Packed.mpd",
    numBuildingSteps: 329,
  },
];

// Optimized In-memory lookup store populated synchronously ONCE at runtime init (safe for startup)
const MODELS_CATALOG = MODELS_CONFIG.map((m) => {
  // Prioritize user-certified explicit configuration overrides, falling back to dynamic scans only if absent
  let steps = m.numBuildingSteps;
  if (typeof steps !== "number") {
    const filePath = path.join(MODELS_DIR, m.fileName || "");
    steps = countModelSteps(filePath);
  }
  // Enforce definitive safety floor guaranteeing at least 1 logical step context
  steps = Math.max(1, steps);
  return {
    ...m,
    numBuildingSteps: steps,
    hasBuildingSteps: steps > 1,
  };
});

// 1. Server-authoritative View State (centralized remote-control memory)
// Pre-compute standard sanitized public catalog once at boot to optimize GC and reduce startup response latency.
const PUBLIC_CATALOG = MODELS_CATALOG.map(({ fileName, ...pub }) => pub);

// Initialize in-memory global renderer context driven by authoritative defaults.
const defaultM = MODELS_CATALOG[0];
let globalViewerState = {
  modelId: defaultM.id,
  buildingStep: defaultM.numBuildingSteps - 1,
  flatColors: false,
  smoothNormals: true,
  displayLines: true,
  conditionalLines: true,
  currentUser: "none",
};

// 2. Registry for active web UI streaming listeners
let eventClients = [];

const broadcastViewerState = () => {
  const payload = `data: ${JSON.stringify(globalViewerState)}\n\n`;
  eventClients.forEach((client) => {
    try {
      // Wrapped in try-catch to avoid node instance crashing on dead socket pipe writes
      client.res.write(payload);
    } catch (err) {
      console.error(
        `Broadcasting delivery failure to client ${client.id}:`,
        err,
      );
    }
  });
};

/**
 * REST API - GET /lego/v1/models
 * Efficiently serves cached catalog instantly without read file CPU penalty.
 * Explicitly filters physical fileName to decouple frontend from storage structure.
 */
app.get("/lego/v1/models", (req, res) => {
  res.json(PUBLIC_CATALOG);
});

/**
 * REST API - GET /lego/v1/models/:id
 * Optimized lookup serving instantly from memory cache, redacted of filesystem details.
 */
app.get("/lego/v1/models/:id", (req, res) => {
  const model = MODELS_CATALOG.find((m) => m.id === req.params.id);
  if (!model) return res.status(404).json({ error: "Model not found" });

  // Redact internal filename from public exposure
  const { fileName, ...publicModel } = model;
  res.json(publicModel);
});

/**
 * ASSET RESOLVER - GET /lego/v1/models/:id/file
 * Abstract model proxy layer hiding internal file mapping from client view.
 */
app.get("/lego/v1/models/:id/file", (req, res) => {
  const model = MODELS_CATALOG.find((m) => m.id === req.params.id);
  if (!model) return res.status(404).send("Asset definition not found");

  const absolutePath = path.join(MODELS_DIR, model.fileName);
  res.sendFile(absolutePath);
});

/**
 * SUB-RESOURCE - POST /lego/v1/models/:id/display
 * ACTIVATE action: authoritative model switch.
 */
app.post("/lego/v1/models/:id/display", (req, res) => {
  const modelId = req.params.id;
  const meta = MODELS_CATALOG.find((m) => m.id === modelId);

  if (!meta) {
    return res.status(404).json({ error: "Model ID not found in catalog" });
  }

  // Completely replace model anchor and reset step defaults
  globalViewerState.modelId = modelId;
  globalViewerState.buildingStep = meta.numBuildingSteps - 1;

  // If body supplies visual overrides, safely blend them
  const updates = req.body;

  // Handle building step override if present during POST activation
  if (updates.buildingStep !== undefined) {
    const parsedStep = parseInt(updates.buildingStep, 10);
    if (!Number.isSafeInteger(parsedStep)) {
      return res
        .status(400)
        .json({ error: "buildingStep must be a valid safe integer" });
    }
    globalViewerState.buildingStep = Math.min(
      Math.max(0, parsedStep),
      Math.max(0, meta.numBuildingSteps - 1),
    );
  }
  ["flatColors", "smoothNormals", "displayLines", "conditionalLines"].forEach(
    (key) => {
      if (typeof updates[key] === "boolean") {
        globalViewerState[key] = updates[key];
      }
    },
  );

  globalViewerState.currentUser = req.get("X-User") || "none";
  broadcastViewerState();
  res.json({
    message: `Model ${modelId} activated on screen`,
    state: globalViewerState,
  });
});

/**
 * SUB-RESOURCE - GET /lego/v1/models/:id/display
 * Confirms if the requested model context matches the active render plane.
 */
app.get("/lego/v1/models/:id/display", (req, res) => {
  if (globalViewerState.modelId !== req.params.id) {
    return res
      .status(404)
      .json({ error: "Target model is not currently displaying" });
  }
  res.json(globalViewerState);
});

/**
 * SUB-RESOURCE - PATCH /lego/v1/models/:id/display
 * TUNE action: modifies specific parameters within active render context.
 */
app.patch("/lego/v1/models/:id/display", (req, res) => {
  const modelId = req.params.id;

  // Guard: Deny modification if attempting to patch configuration onto inactive model
  if (globalViewerState.modelId !== modelId) {
    return res.status(409).json({
      error: "Conflict: Model is not active. Execute POST activation first.",
    });
  }

  const updates = req.body;
  const sanitizedUpdate = {};
  const meta = MODELS_CATALOG.find((m) => m.id === modelId);

  // Handle building step safely
  if (updates.buildingStep !== undefined) {
    const parsedStep = parseInt(updates.buildingStep, 10);
    // Enhanced robustness: Explicitly block non-safe integers, NaN, or infinity
    if (!Number.isSafeInteger(parsedStep)) {
      return res
        .status(400)
        .json({ error: "buildingStep must be a valid safe integer" });
    }
    sanitizedUpdate.buildingStep = Math.min(
      Math.max(0, parsedStep),
      Math.max(0, meta.numBuildingSteps - 1),
    );
  }

  // Merge allowed boolean overrides
  ["flatColors", "smoothNormals", "displayLines", "conditionalLines"].forEach(
    (key) => {
      if (typeof updates[key] === "boolean") {
        sanitizedUpdate[key] = updates[key];
      }
    },
  );

  // Commit and dispatch
  globalViewerState = { ...globalViewerState, ...sanitizedUpdate };
  globalViewerState.currentUser = req.get("X-User") || "none";
  broadcastViewerState();

  res.json({ status: "ConfigurationMutated", state: globalViewerState });
});

/**
 * SUB-RESOURCE - DELETE /lego/v1/models/:id/display
 * EXPIRE action: clears valid visual context to trigger safe frontend unmount.
 */
app.delete("/lego/v1/models/:id/display", (req, res) => {
  if (globalViewerState.modelId === req.params.id) {
    // Setting null triggers front-end geometry cleanObject destruction implicitly
    globalViewerState.modelId = "";
    globalViewerState.currentUser = "none";
    broadcastViewerState();
  }
  res.json({ message: "Visual Context cleared." });
});

/**
 * GLOBAL EVENT STREAM - GET /lego/v1/stream
 * High-efficiency realtime subscriber hub. Captures state drift across all model resource activity.
 */
app.get("/lego/v1/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.writeHead(200);

  try {
    res.write(`data: ${JSON.stringify(globalViewerState)}\n\n`);
  } catch (e) {
    /* suppress immediate emit blip */
  }

  const clientId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now() + Math.random().toString();
  const newClient = { id: clientId, res };
  eventClients.push(newClient);

  req.on("close", () => {
    eventClients = eventClients.filter((c) => c.id !== clientId);
  });
});

// Healthcheck for Cloud Run
app.get("/lego/v1/healthz", (req, res) => res.status(200).send("OK"));

// Serve frontend statics
app.use(express.static(PUBLIC_DIR));

// Expose Vendor Asset Mapping for localized ThreeJS loading
app.use(
  "/three",
  express.static(path.join(__dirname, "../node_modules/three")),
);

// Redirect unmatched request to root (index.html)
app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Lego Builder REST API and App running on port ${PORT}`);
});
