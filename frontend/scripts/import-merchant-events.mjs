import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { dirname, resolve } from "node:path";

const archivePath = process.argv[2];
const outputPath = resolve(process.cwd(), "src/data/merchant-events-summary.json");

if (!archivePath) {
  console.error("Usage: node scripts/import-merchant-events.mjs /absolute/path/to/archive.zip");
  process.exit(1);
}

const products = new Map();
const totals = { views: 0, addToCart: 0, purchases: 0, revenue: 0, events: 0 };

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += character;
    }
  }

  values.push(value);
  return values;
}

function recordEvent(line) {
  const [, eventType, productId, , categoryCode, brand, rawPrice] = parseCsvLine(line);
  if (!productId || !eventType) return;

  totals.events += 1;
  const product = products.get(productId) ?? {
    productId,
    brand: brand?.trim() || "Unbranded",
    category: categoryCode?.trim() || "Uncategorised",
    views: 0,
    addToCart: 0,
    purchases: 0,
    revenue: 0,
  };

  if (eventType === "view") {
    product.views += 1;
    totals.views += 1;
  } else if (eventType === "cart") {
    product.addToCart += 1;
    totals.addToCart += 1;
  } else if (eventType === "purchase") {
    const price = Number.parseFloat(rawPrice);
    product.purchases += 1;
    product.revenue += Number.isFinite(price) ? price : 0;
    totals.purchases += 1;
    totals.revenue += Number.isFinite(price) ? price : 0;
  }

  products.set(productId, product);
}

async function importMonth(fileName) {
  const process = spawn("/usr/bin/unzip", ["-p", archivePath, fileName], { stdio: ["ignore", "pipe", "inherit"] });
  const lines = createInterface({ input: process.stdout, crlfDelay: Infinity });
  const completed = new Promise((resolveProcess, rejectProcess) => {
    process.once("error", rejectProcess);
    process.once("close", (code) => code === 0 ? resolveProcess() : rejectProcess(new Error(`${fileName} extraction failed with code ${code}`)));
  });
  let firstLine = true;
  let linesRead = 0;

  for await (const line of lines) {
    if (firstLine) {
      firstLine = false;
      continue;
    }
    recordEvent(line);
    linesRead += 1;
    if (linesRead % 5_000_000 === 0) console.log(`${fileName}: ${linesRead.toLocaleString()} events processed`);
  }

  await completed;
}

await importMonth("2019-Oct.csv");
await importMonth("2019-Nov.csv");

const topProducts = [...products.values()]
  .filter((product) => product.views + product.addToCart + product.purchases > 0)
  .sort((left, right) => right.revenue - left.revenue || right.purchases - left.purchases || right.views - left.views)
  .slice(0, 30)
  .map((product) => ({ ...product, revenue: Math.round(product.revenue * 100) / 100 }));

const summary = {
  source: "2019-Oct.csv and 2019-Nov.csv from the supplied e-commerce event archive",
  generatedAt: new Date().toISOString(),
  currency: "USD",
  totals: { ...totals, revenue: Math.round(totals.revenue * 100) / 100 },
  products: topProducts,
};

await mkdir(dirname(outputPath), { recursive: true });
const stream = createWriteStream(outputPath);
stream.end(`${JSON.stringify(summary, null, 2)}\n`);
await new Promise((resolveWrite, rejectWrite) => stream.once("finish", resolveWrite).once("error", rejectWrite));

console.log(`Created ${outputPath}`);
console.log(`Processed ${totals.events.toLocaleString()} events across ${products.size.toLocaleString()} products.`);
console.log(`Saved ${topProducts.length} top products ranked by recorded purchase revenue.`);
