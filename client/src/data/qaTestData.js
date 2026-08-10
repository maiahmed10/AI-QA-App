/**
 * MicroMind QA Test Suite & Bugs Dataset
 * Used by the MicroMind QA Dashboard to dynamically calculate metrics.
 */

export const API_ENDPOINT = "https://vwpdk-156-197-101-210.run.pinggy-free.link/api/messages";
export const LOCAL_API_ENDPOINT = "http://localhost:3000/api/messages";

export const initialTestCasesData = [
    {
        id: "TC-001",
        name: "Valid non-empty message",
        payload: '{"message": "Hello World"}',
        expectedResult: "HTTP 200 OK with success payload",
        actualResult: "HTTP 200 OK received",
        status: "PASS",
        note: null,
        reason: null
    },
    {
        id: "TC-002",
        name: "Empty message validation check",
        payload: '{"message": ""}',
        expectedResult: "HTTP 400 Bad Request (validation error)",
        actualResult: "HTTP 200 OK (Accepted empty string)",
        status: "FAIL",
        bugId: "BUG-001",
        note: "Triggered BUG-001: Empty string bypasses validation.",
        reason: null
    },
    {
        id: "TC-003",
        name: "Missing \"message\" field",
        payload: '{}',
        expectedResult: "HTTP 400 Bad Request",
        actualResult: "HTTP 400 Bad Request received",
        status: "PASS",
        note: null,
        reason: null
    },
    {
        id: "TC-004",
        name: "Malformed JSON",
        payload: '{"message": "incomplete...',
        expectedResult: "HTTP 400 Bad Request / Syntax Error",
        actualResult: "Not Executed",
        status: "NOT EXECUTED",
        note: null,
        reason: "MicroMind Core Requests tool cannot send raw malformed JSON."
    },
    {
        id: "TC-005",
        name: "GET instead of POST",
        payload: "N/A (HTTP Method: GET)",
        expectedResult: "HTTP 405 Method Not Allowed / 404",
        actualResult: "Not Executed",
        status: "NOT EXECUTED",
        note: null,
        reason: "MicroMind Core Requests tool supports POST only."
    },
    {
        id: "TC-006",
        name: "Special characters",
        payload: '{"message": "!@#$%^&*()_+-=[]{}|;:\',.<>?/~`"}',
        expectedResult: "HTTP 200 OK with escaped string",
        actualResult: "HTTP 200 OK received",
        status: "PASS",
        note: null,
        reason: null
    },
    {
        id: "TC-007",
        name: "Long input",
        payload: '{"message": "<string of moderate length>"}',
        expectedResult: "HTTP 200 OK",
        actualResult: "HTTP 200 OK received",
        status: "PASS",
        note: "The executed payload was not actually 5,000 characters.",
        reason: null
    },
    {
        id: "TC-008",
        name: "Actual ~5,000-character input",
        payload: '{"message": "<5,000 chars>"}',
        expectedResult: "HTTP 200 OK or payload size limit check",
        actualResult: "Blocked / Timeout",
        status: "NOT EXECUTED",
        note: null,
        reason: "MicroMind Core returned no response."
    }
];

export const initialBugsData = [
    {
        id: "BUG-001",
        description: "Empty message is accepted as valid input (returns HTTP 200 instead of HTTP 400)",
        severity: "Medium",
        status: "Open",
        testCaseId: "TC-002"
    }
];
