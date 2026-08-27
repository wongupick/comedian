import fs from "node:fs/promises";

const rosterPath = "/home/ubuntu/korean-comedian-portfolio/client/src/data/roster.json";
const otherPath = "/home/ubuntu/korean-comedian-portfolio/client/src/data/otherRoster.json";
const falsePositiveNames = new Set(["네팔", "돌리 파튼"]);

function clean(records) {
  return records.map((record) => {
    if (!falsePositiveNames.has(record.name)) return record;
    return { ...record, imageStatus: "not-found", imageUrl: "", imageSource: "", imageTitle: "" };
  });
}

const roster = JSON.parse(await fs.readFile(rosterPath, "utf8"));
const rosterRecords = clean(roster.records);
const rosterMatched = rosterRecords.filter((record) => record.imageStatus === "matched").length;
await fs.writeFile(rosterPath, JSON.stringify({ ...roster, imageMatched: rosterMatched, imageMissing: rosterRecords.length - rosterMatched, records: rosterRecords }, null, 2) + "\n");

const other = JSON.parse(await fs.readFile(otherPath, "utf8"));
await fs.writeFile(otherPath, JSON.stringify(clean(other), null, 2) + "\n");
console.log(`cleaned false positives; remaining matched: ${rosterMatched}`);
