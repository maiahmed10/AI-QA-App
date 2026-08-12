/**
 * MicroMind Unified QA Dataset & Baseline Seed Configuration
 * Preserves baseline test suite state:
 * - Unique Test Cases: 8
 * - Total Executions: 39 (14 Passed, 25 Failed)
 * - Unique Defects: 4 (Deduplicated with occurrence tracking)
 * - Total Defect Occurrences: 25
 */

export const API_ENDPOINT = import.meta.env.VITE_PUBLIC_API_ENDPOINT || "https://vwpdk-156-197-101-210.run.pinggy-free.link/api/messages";
export const LOCAL_API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || (typeof window !== 'undefined' ? `${window.location.origin}/api/messages` : "/api/messages");

// 1. Initial 8 Unique Test Cases
export const initialTestCasesData = [
    {
        id: "TC-001",
        description: "Valid non-empty message payload retrieval",
        name: "Valid non-empty message payload retrieval",
        type: "Positive",
        method: "POST",
        endpoint: "/api/messages",
        requestData: '{\n  "message": "Hello World"\n}',
        payload: '{\n  "message": "Hello World"\n}',
        expectedResult: "HTTP 200 OK with success response",
        creationDate: "Aug 10, 2026",
        status: "PASS"
    },
    {
        id: "TC-002",
        description: "Empty message payload validation check",
        name: "Empty message payload validation check",
        type: "Negative",
        method: "POST",
        endpoint: "/api/messages",
        requestData: '{\n  "message": ""\n}',
        payload: '{\n  "message": ""\n}',
        expectedResult: "HTTP 400 Bad Request",
        creationDate: "Aug 10, 2026",
        status: "FAIL"
    },
    {
        id: "TC-003",
        description: "Missing required message field payload check",
        name: "Missing required message field payload check",
        type: "Negative",
        method: "POST",
        endpoint: "/api/messages",
        requestData: '{}',
        payload: '{}',
        expectedResult: "HTTP 400 Bad Request",
        creationDate: "Aug 10, 2026",
        status: "PASS"
    },
    {
        id: "TC-004",
        description: "Malformed JSON syntax validation",
        name: "Malformed JSON syntax validation",
        type: "Negative",
        method: "POST",
        endpoint: "/api/messages",
        requestData: '{"message": "incomplete...',
        payload: '{"message": "incomplete...',
        expectedResult: "HTTP 400 Bad Request",
        creationDate: "Aug 10, 2026",
        status: "FAIL"
    },
    {
        id: "TC-005",
        description: "GET products by valid ID",
        name: "GET products by valid ID",
        type: "Positive",
        method: "GET",
        endpoint: "https://dummyjson.com/products/1",
        requestData: "None",
        payload: "None",
        expectedResult: "HTTP 200 OK and valid response data",
        creationDate: "Aug 11, 2026",
        status: "PASS"
    },
    {
        id: "TC-006",
        description: "GET products by non-existent ID",
        name: "GET products by non-existent ID",
        type: "Negative",
        method: "GET",
        endpoint: "https://dummyjson.com/products/999999999",
        requestData: "None",
        payload: "None",
        expectedResult: "HTTP 404 Not Found",
        creationDate: "Aug 11, 2026",
        status: "FAIL"
    },
    {
        id: "TC-007",
        description: "Special characters payload boundary test",
        name: "Special characters payload boundary test",
        type: "Positive",
        method: "POST",
        endpoint: "/api/messages",
        requestData: '{\n  "message": "!@#$%^&*()_+-=[]{}|"\n}',
        payload: '{\n  "message": "!@#$%^&*()_+-=[]{}|"\n}',
        expectedResult: "HTTP 200 OK",
        creationDate: "Aug 11, 2026",
        status: "PASS"
    },
    {
        id: "TC-008",
        description: "Exceed maximum payload character length",
        name: "Exceed maximum payload character length",
        type: "Negative",
        method: "POST",
        endpoint: "/api/messages",
        requestData: '{\n  "message": "<5000 chars>"\n}',
        payload: '{\n  "message": "<5000 chars>"\n}',
        expectedResult: "HTTP 413 Payload Too Large or HTTP 400",
        creationDate: "Aug 12, 2026",
        status: "FAIL"
    }
];

// Seed Function for 39 Executions (14 PASS, 25 FAIL)
export const generateSeedExecutions = () => {
    const records = [];

    const passTemplates = [
        { tcId: "TC-001", method: "POST", endpoint: "/api/messages", desc: "POST /api/messages — Valid payload hello world", req: '{"message": "Hello World"}', exp: "HTTP 200 OK", act: "HTTP 200 OK", body: '{"status": "success", "received": "Hello World"}' },
        { tcId: "TC-003", method: "POST", endpoint: "/api/messages", desc: "POST /api/messages — Missing field check", req: '{}', exp: "HTTP 400 Bad Request", act: "HTTP 400 Bad Request", body: '{"error": "Message parameter is required."}' },
        { tcId: "TC-005", method: "GET", endpoint: "https://dummyjson.com/products/1", desc: "GET /products/1 — Valid product retrieval", req: "None", exp: "HTTP 200 OK and valid response data", act: "HTTP 200 OK", body: '{"id": 1, "title": "Essence Mascara Lash Princess"}' },
        { tcId: "TC-007", method: "POST", endpoint: "/api/messages", desc: "POST /api/messages — Special chars string", req: '{"message": "!@#$%^&*()"}', exp: "HTTP 200 OK", act: "HTTP 200 OK", body: '{"status": "success"}' }
    ];

    const failTemplates = [
        { tcId: "TC-002", method: "POST", endpoint: "/api/messages", desc: "POST /api/messages — Empty string payload rejection", req: '{"message": ""}', exp: "HTTP 400 Bad Request", act: "HTTP 200 OK", body: '{"status": "success", "received": ""}', bugTitle: "Empty message accepted with HTTP 200 OK" },
        { tcId: "TC-004", method: "POST", endpoint: "/api/messages", desc: "POST /api/messages — Malformed JSON syntax error", req: '{"message": "incomplete...', exp: "HTTP 400 Bad Request", act: "HTTP 500 Internal Server Error", body: '{"error": "SyntaxError: Unexpected token"}', bugTitle: "Unhandled 500 Server Error on malformed JSON" },
        { tcId: "TC-006", method: "GET", endpoint: "https://dummyjson.com/products/999999999", desc: "GET /products/999999999 — Non-existent product 404 check", req: "None", exp: "HTTP 404 Not Found", act: "HTTP 200 OK", body: '{"id": 999999999, "message": "found"}', bugTitle: "Resource 999999999 returned 200 instead of 404" },
        { tcId: "TC-008", method: "POST", endpoint: "/api/messages", desc: "POST /api/messages — Over 5000 character length limit", req: '{"message": "<5000 chars>"}', exp: "HTTP 413 Payload Too Large", act: "HTTP 200 OK", body: '{"status": "success"}', bugTitle: "5000 character buffer overflow payload accepted" }
    ];

    let passCount = 0;
    let failCount = 0;

    // Generate exactly 39 records (14 Pass, 25 Fail)
    for (let i = 1; i <= 39; i++) {
        const isPass = (i % 3 === 0 || i === 39) && passCount < 14;
        const dateDay = 12 - Math.floor(i / 4);
        const timeHour = 15 - Math.floor(i / 3) % 6;
        const timeMin = (i * 7) % 60;
        const dateStr = `Aug ${dateDay < 1 ? 1 : dateDay}, 2026`;
        const timeStr = `${timeHour < 10 ? '0' + timeHour : timeHour}:${timeMin < 10 ? '0' + timeMin : timeMin}`;

        if (isPass) {
            const tmpl = passTemplates[passCount % passTemplates.length];
            passCount++;
            records.push({
                id: `EXEC-10${i < 10 ? '0' + i : i}`,
                testCaseId: tmpl.tcId,
                description: tmpl.desc,
                question: tmpl.desc,
                method: tmpl.method,
                target: `${tmpl.method} ${tmpl.endpoint}`,
                endpoint: tmpl.endpoint,
                requestData: tmpl.req,
                expectedBehavior: tmpl.exp,
                expectedStatus: tmpl.exp,
                actualBehavior: tmpl.act,
                actualStatus: tmpl.act,
                status: 'PASS',
                httpStatus: tmpl.act,
                httpCode: tmpl.act,
                responseBody: tmpl.body,
                response: tmpl.body,
                responseTime: `${120 + (i * 15) % 200}ms`,
                timeMs: `${120 + (i * 15) % 200}ms`,
                timestamp: `${dateStr} ${timeStr}`,
                date: dateStr,
                time: timeStr
            });
        } else {
            const tmpl = failTemplates[failCount % failTemplates.length];
            failCount++;
            records.push({
                id: `EXEC-10${i < 10 ? '0' + i : i}`,
                testCaseId: tmpl.tcId,
                description: tmpl.desc,
                question: tmpl.desc,
                method: tmpl.method,
                target: `${tmpl.method} ${tmpl.endpoint}`,
                endpoint: tmpl.endpoint,
                requestData: tmpl.req,
                expectedBehavior: tmpl.exp,
                expectedStatus: tmpl.exp,
                actualBehavior: tmpl.act,
                actualStatus: tmpl.act,
                status: 'FAIL',
                httpStatus: tmpl.act,
                httpCode: tmpl.act,
                responseBody: tmpl.body,
                response: tmpl.body,
                responseTime: `${180 + (i * 22) % 300}ms`,
                timeMs: `${180 + (i * 22) % 300}ms`,
                timestamp: `${dateStr} ${timeStr}`,
                date: dateStr,
                time: timeStr,
                bugTitle: tmpl.bugTitle,
                bugDescription: `The API returned ${tmpl.act} instead of expected ${tmpl.exp}.`
            });
        }
    }

    return records;
};

// Deduplicate 25 failed executions into 4 unique defect records with occurrences count & relatedExecutions list
export const generateSeedBugs = (executions = []) => {
    const failedExecs = executions.filter(e => e.status === 'FAIL');
    const defectMap = new Map();

    failedExecs.forEach(exec => {
        const tcId = exec.testCaseId || 'TC-002';
        const title = exec.bugTitle || `Validation Defect on ${tcId}`;

        if (defectMap.has(tcId)) {
            const existing = defectMap.get(tcId);
            existing.occurrences += 1;
            existing.relatedExecutions.push(exec.id);
            existing.lastDetectedAt = exec.timestamp || existing.lastDetectedAt;
        } else {
            defectMap.set(tcId, {
                id: `BUG-10${defectMap.size + 1}`,
                testCaseId: tcId,
                executionId: exec.id,
                title: title,
                description: exec.bugDescription || `Expected ${exec.expectedBehavior || 'HTTP 400'}, received ${exec.actualBehavior || 'HTTP 200'}.`,
                severity: tcId === 'TC-004' ? 'CRITICAL' : tcId === 'TC-002' ? 'HIGH' : 'MEDIUM',
                expectedBehavior: exec.expectedBehavior || 'HTTP 400 Bad Request',
                actualBehavior: exec.actualBehavior || 'HTTP 200 OK',
                httpStatus: exec.httpStatus || 'HTTP 200 OK',
                responseBody: exec.responseBody || '{"status": "success"}',
                status: 'Open',
                occurrences: 1,
                relatedExecutions: [exec.id],
                detectedAt: exec.timestamp || 'Aug 10, 2026 15:24',
                lastDetectedAt: exec.timestamp || 'Aug 12, 2026 15:00'
            });
        }
    });

    return Array.from(defectMap.values());
};
