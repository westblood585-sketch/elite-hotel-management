const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
const allowedOrigins = allowedOriginsEnv?.split(',') || ['http://localhost:5173'];

console.log(`Configured Allowed Origins: ${JSON.stringify(allowedOrigins)}`);

const corsLogic = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
    } else {
        callback(new Error('Not allowed by CORS'));
    }
}

// Test cases
const tests = [
    { origin: undefined, expected: true, desc: "No origin (mobile/postman)" },
    { origin: 'http://localhost:5173', expected: true, desc: "Default origin" },
    { origin: 'http://evil.com', expected: false, desc: "Disallowed origin" }
];

console.log('--- Running Tests ---');
tests.forEach(t => {
    corsLogic(t.origin, (err, success) => {
        if (t.expected) {
            if (success) console.log(`[PASS] ${t.desc}`);
            else console.log(`[FAIL] ${t.desc}: Expected success, got error: ${err}`);
        } else {
            if (err) console.log(`[PASS] ${t.desc}`);
            else console.log(`[FAIL] ${t.desc}: Expected error, got success`);
        }
    });
});
