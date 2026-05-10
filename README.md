# Lego Builder Viewer API

A Node.js application powered by Express and Three.js that serves as a viewer and remote-control API for LDraw LEGO models. It supports real-time rendering updates and exposes a REST API for managing active models on display.

## Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [npm](https://www.npmjs.com/)
- [gcloud CLI](https://cloud.google.com/sdk/docs/install) (for deployment)

---

## Local Setup & Testing

### 1. Installation
Navigate to the project root and install the production and development dependencies:
```bash
npm install
```

### 2. Running the Server
Launch the local server. It defaults to port `8080`:
```bash
npm start
```
The visualizer UI will be accessible via browser at `http://localhost:8080`.

### 3. API Reference & Local cURL Examples

The REST API conforms to the OpenAPI 3.0 standard, with the full specification source documented in [`openapi.yaml`](./openapi.yaml).

Key functionalities enabled by the interface:
* **Catalog Discovery**: Enumerate all supported LEGO models along with parsed metadata.
* **Remote Control Rendering**: Directly command the active Three.js viewport state (mounting, partial visual toggles).
* **Live Events subscription**: Stream reactive application states via standard HTTP Server-Sent Events (SSE).

#### Endpoint Summary (Base Path `/lego/v1`)

| Method | Endpoint Path | Description |
|:---|:---|:---|
| `GET` | `/models` | Enumerate catalog of all supported models |
| `GET` | `/models/{id}` | Retrieve configuration metrics for a designated model |
| `GET` | `/models/{id}/file` | Stream abstract LDraw geometry binary payload |
| `GET` | `/models/{id}/display` | Query active rendering properties of the viewport |
| `POST` | `/models/{id}/display` | Activate/Mount target model on visualizer screen |
| `PATCH` | `/models/{id}/display` | Partially mutate current view config (steps, smoothNormals) |
| `DELETE`| `/models/{id}/display` | Deactivate and clear currently active context |
| `GET` | `/stream` | Subscribe to global Server-Sent Event push stream |
| `GET` | `/healthz` | Standard service availability health check |

#### Base Local URL
```bash
export BASE_URL="http://localhost:8080"
```

#### A. Retrieve Catalog
Get a list of all parsed Lego models available for display:
```bash
curl -X GET "${BASE_URL}/lego/v1/models" -H "Accept: application/json" | jq .
```

#### B. Get Model Details
Query specific constraints or metadata for a designated model:
```bash
curl -X GET "${BASE_URL}/lego/v1/models/car" -H "Accept: application/json" | jq .
```

#### C. Download Model Asset File
Retrieve the raw LDraw geometry file directly:
```bash
curl -X GET "${BASE_URL}/lego/v1/models/car/file" --output model_car.mpd
```

#### D. Activate / Display Model
Command the active viewport browser to load and render a specific model:
```bash
curl -X POST "${BASE_URL}/lego/v1/models/x-wing/display" \
     -H "Content-Type: application/json" \
     -d '{ "flatColors": false, "displayLines": true }' | jq .
```

#### E. Patch Display State
Real-time injection of visual configuration (e.g., changing current building step dynamically):
```bash
curl -X PATCH "${BASE_URL}/lego/v1/models/x-wing/display" \
     -H "Content-Type: application/json" \
     -d '{ "buildingStep": 5, "smoothNormals": true }' | jq .
```

#### F. Check Active Display Status
```bash
curl -X GET "${BASE_URL}/lego/v1/models/x-wing/display" | jq .
```

#### G. Deactivate / Clear Screen
Force the visualizer to unmount the model:
```bash
curl -X DELETE "${BASE_URL}/lego/v1/models/x-wing/display" | jq .
```

#### H. Subscribe to Event Stream
Listen for real-time Server-Sent Events (SSE) pushed when application state shifts:
```bash
curl -N "${BASE_URL}/lego/v1/stream"
```

#### I. Health Check
```bash
curl -I "${BASE_URL}/lego/v1/healthz"
```

---

## Cloud Run Deployment

This service runs containerized and can be effortlessly deployed to Google Cloud Run using Cloud Build.

### 1. Preparation
Configure your Google Cloud CLI environment to target your specific project:
```bash
# Replace with your actual Google Cloud Project ID
export PROJECT_ID="<YOUR_PROJECT_ID>"

gcloud config set project $PROJECT_ID
```

### 2. Enable Required APIs
Ensure that Cloud Build and Cloud Run administrative APIs are active on the project:
```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

### 3. Deploy the Service
Execute the deploy command directly from the source directory. The `--allow-unauthenticated` flag ensures a public service endpoint URL is provisioned.
```bash
gcloud run deploy threejs-lego-api \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 8080
```

### 4. Verification
Once the deployment script finishes, it lists a `Service URL`. Assign it to a variable and test the deployed healthcheck:
```bash
# Example URL: https://threejs-lego-api-xxxx.europe-west1.run.app
export REMOTE_URL="<PASTE_YOUR_CLOUDRUN_URL_HERE>"

curl -I "${REMOTE_URL}/lego/v1/healthz"
```
