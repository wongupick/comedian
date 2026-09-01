import fs from "node:fs";

const roster = JSON.parse(fs.readFileSync("client/src/data/roster.json", "utf8"));
const other = JSON.parse(fs.readFileSync("client/src/data/otherRoster.json", "utf8"));
const records = [...roster.records, ...other];
const names = new Map();
for (const record of records) {
  const name = String(record.name ?? "").trim();
  names.set(name, (names.get(name) ?? 0) + 1);
}
const fields = [...new Set(records.flatMap((record) => Object.keys(record)))].sort();
const duplicateNames = [...names.entries()].filter(([, count]) => count > 1);
const byBroadcaster = Object.fromEntries([...new Set(records.map((record) => record.broadcaster))].map((key) => [key, records.filter((record) => record.broadcaster === key).length]));
console.log(JSON.stringify({ recordCount: records.length, uniqueNameCount: names.size, duplicateNames, byBroadcaster, fields, sample: records.slice(0, 3) }, null, 2));
