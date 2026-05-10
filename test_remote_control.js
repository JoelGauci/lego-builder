import http from 'http';

/**
 * Comprehensive refactored verification suite validating the newly engineered
 * Model-centric Sub-resource activation architecture.
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
    console.log("🚀 Initiating nested sub-resource architecture integration test...");
    
    const baseUrl = { hostname: 'localhost', port: 8080 };
    
    try {
        /*
        // 1. Skip Stream verification in synchronous test loop (it hangs intentionally as it is infinite SSE stream)
        console.log("\nStep 1: Verifying stream redirection to /lego/v1/stream...");
        const streamRes = await makeRequest({ ...baseUrl, path: '/lego/v1/stream', method: 'GET' });
        // SSE streams are persistent but a non-zero status confirms node bound route correctly.
        console.log("[PASS] Stream service reachable, response status:", streamRes.status);
        */

        // 2. Attempt to ACTIVATE the specific model 'helicopter' via POST sub-resource.
        console.log("\nStep 2: Activating helicopter via POST /lego/v1/models/helicopter/display...");
        const activateRes = await makeRequest({
            ...baseUrl,
            path: '/lego/v1/models/helicopter/display',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (activateRes.status === 200 && activateRes.body.state.modelId === 'helicopter') {
            console.log("[PASS] Sub-resource successfully hijacked global viewport context.");
        } else {
            console.error("[FAIL] Activation failed. Status:", activateRes.status, "Body:", activateRes.body);
            process.exit(1);
        }

        // 3. Test Active validation (Fetch context for specific active model)
        console.log("\nStep 3: Verifying context visibility via GET /lego/v1/models/helicopter/display...");
        const getRes = await makeRequest({
            ...baseUrl,
            path: '/lego/v1/models/helicopter/display',
            method: 'GET'
        });
        if (getRes.status === 200) {
            console.log("[PASS] Context getter is successfully live.");
        } else {
             console.error("[FAIL] Expected 200 for active display context query.");
             process.exit(1);
        }

        // 4. Test PATCH command against specific model path
        console.log("\nStep 4: Mutating helicopter config via PATCH /lego/v1/models/helicopter/display...");
        const patchRes = await makeRequest({
            ...baseUrl,
            path: '/lego/v1/models/helicopter/display',
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        }, { flatColors: true, buildingStep: 1 });

        if (patchRes.status === 200 && patchRes.body.state.flatColors === true && patchRes.body.state.buildingStep === 1) {
            console.log("[PASS] Configuration mutated successfully on nested patch scope.");
        } else {
             console.error("[FAIL] Nested PATCH mutation rejected or incorrect state logic returned.");
             process.exit(1);
        }

        // 5. Verify Guard Conflict Safety: Try to PATCH a NON-ACTIVE model and assert 409 refusal!
        console.log("\nStep 5: Verifying guard rails assert 409 on inactive model modification...");
        const illegalPatch = await makeRequest({
            ...baseUrl,
            path: '/lego/v1/models/car/display',
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        }, { flatColors: false });
        
        if (illegalPatch.status === 409) {
            console.log("[PASS] Server correctly enforced integrity, guarding against out-of-band state poisoning.");
        } else {
             console.error("[FAIL] Server permitted modification on non-active model path! Got status:", illegalPatch.status);
             process.exit(1);
        }

        console.log("\n✅ ALL NESTED RESOURCE ARCHITECTURE CHECKS COMPLETED SUCCESSFULLY.");
        process.exit(0);
        
    } catch (e) {
        console.error("\n[FATAL ERROR] Unable to connect to development server:", e.message);
        process.exit(1);
    }
}

runTest();
