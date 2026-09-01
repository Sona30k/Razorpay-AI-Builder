#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import url from 'url';

// Load .env.local if present (manual parser to avoid extra deps)
try {
    const dotenvPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(dotenvPath)) {
        const content = fs.readFileSync(dotenvPath, 'utf8');
        for (const line of content.split(/\r?\n/)) {
            const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
            if (m) {
                let val = m[2];
                // strip surrounding quotes
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                process.env[m[1]] = val;
            }
        }
    }
} catch (e) {
    // ignore
}

const MOCK = process.env.MOCK_AI_MODE === 'true';
if (MOCK) {
    console.log('MOCK_AI_MODE=true — skipping real Gemini test.');
    process.exit(0);
}

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || 'gemini-3.7-flash';
if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in environment (.env.local).');
    process.exit(2);
}

(async () => {
    try {
        const genai = await import('@google/genai');
        if (!genai) {
            console.error('Gemini SDK import returned null/undefined.');
            process.exit(3);
        }
        const GoogleGenAI = genai.GoogleGenAI ?? genai.default ?? genai;
        if (!GoogleGenAI) {
            console.error('Gemini SDK does not expose GoogleGenAI.');
            process.exit(4);
        }
        const ai = new GoogleGenAI({ apiKey });
        const prompt = 'Respond with a single-line JSON object exactly like: {"test": true, "note": "gemini test"}';
        // Try the interactions.create API
        const genResponse = await ai.interactions.create?.({
            input: { type: 'text', text: prompt },
            model
        }).catch((e) => { throw e; });
        const payload = genResponse ?? {};
        const candidate = payload?.candidates?.[0]?.content?.map((c) => c?.text).filter(Boolean).join('\n')
            || payload?.candidates?.[0]?.text
            || payload?.output?.[0]?.content?.map((c) => c?.text).filter(Boolean).join('\n')
            || JSON.stringify(payload);
        const text = typeof candidate === 'string' ? candidate : JSON.stringify(candidate);
        console.log('Gemini SDK call succeeded. Model used:', model);
        console.log('Raw response excerpt:', text.slice(0, 1000));
        process.exit(0);
    } catch (err) {
        console.error('Gemini SDK test failed:');
        if (err instanceof Error) console.error(err.stack || err.message);
        else console.error(String(err));
        process.exit(5);
    }
})();
