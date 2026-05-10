import http from 'http';

/**
 * Verification suite for verifying that filesystem details are effectively redacted
 * from API payloads and rerouted transparently through abstract proxies.
 */

function makeRequest(options, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                   resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch(e) { resolve({ status: res.statusCode, body: data }); }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTest() {
    console.log("🚀 Initiating Security/Decoupling integration audit...");
    
    const baseUrl = { hostname: 'localhost', port: 8080 };
    
    try {
        // Test 1: Verify general catalog redaction
        console.log("\nAudit 1: Testing GET /lego/v1/models for filename redaction...");
        const catalog = await makeRequest({ ...baseUrl, path: '/lego/v1/models', method: 'GET' });
        
        if (catalog.status === 200 && Array.isArray(catalog.body)) {
            const itemsWithFilename = catalog.body.filter(m => 'fileName' in m);
            if (itemsWithFilename.length === 0) {
                console.log("[PASS] Public catalog does not include 'fileName' parameter.");
            } else {
                console.error("[FAIL] Catalog leaked internal filename structures:", itemsWithFilename[0]);
                process.exit(1);
            }
        } else {
             console.error("[FAIL] Catalog retrieval failed.");
             process.exit(1);
        }

        // Test 2: Verify targeted item redaction
        console.log("\nAudit 2: Testing GET /lego/v1/models/helicopter for filename redaction...");
        const helicopter = await makeRequest({ ...baseUrl, path: '/lego/v1/models/helicopter', method: 'GET' });
        if (!('fileName' in helicopter.body)) {
            console.log("[PASS] Targeted lookup successfully redacted internal storage pointers.");
        } else {
            console.error("[FAIL] Targeted lookup leaked internal filename structures.");
            process.exit(1);
        }

        // Test 3: Verify operational proxy accessibility
        console.log("\nAudit 3: Testing proxy retrieval via GET /lego/v1/models/helicopter/file...");
        const proxy = await makeRequest({ ...baseUrl, path: '/lego/v1/models/helicopter/file', method: 'GET' });
        
        if (proxy.status === 200 && proxy.body && proxy.body.length > 500) {
            console.log("[PASS] Abstraction proxy is operational and effectively transparently streaming binaries.");
        } else {
            console.error("[FAIL] Proxy download error. Status:", proxy.status, "Content Length:", proxy.body ? proxy.body.length : 0);
            process.exit(1);
        }

        console.log("\n✅ DECOUPLING VERIFICATION CHECKS COMPLETED SUCCESSFULLY.");
        process.exit(0);
        
    } catch (e) {
        console.error("\n[FATAL ERROR] Unable to contact active test server:", e.message);
        process.exit(1);
    }
}

runTest();
