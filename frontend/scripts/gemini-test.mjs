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
const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
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
        if (process.argv.includes('--list-models')) {
            const pager = await ai.models.list();
            const page = await pager.page;
            const models = (page ?? []).map((item) => item?.name).filter((name) => typeof name === 'string' && name.includes('flash'));
            console.log('Available Flash models:', models.join(', '));
            process.exit(0);
        }
        const prompt = 'Respond with this JSON object only: {"test":true,"note":"gemini test"}';
        const genResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { responseMimeType: 'application/json', temperature: 0, maxOutputTokens: 1000 }
        });
        const text = genResponse?.text;
        if (typeof text !== 'string' || !text.trim()) throw new Error('Gemini returned no text.');
        const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned);
        console.log('Gemini SDK call succeeded. Model used:', model);
        console.log('Structured JSON response was validated.');
        process.exit(0);
    } catch (err) {
        console.error('Gemini SDK test failed:');
        if (err instanceof Error) console.error(err.stack || err.message);
        else console.error(String(err));
        process.exit(5);
    }
})();
