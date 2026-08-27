import fs from "node:fs/promises";

const API = "https://commons.wikimedia.org/w/api.php";
const rosterPath = "/home/ubuntu/korean-comedian-portfolio/client/src/data/roster.json";
const otherPath = "/home/ubuntu/korean-comedian-portfolio/client/src/data/otherRoster.json";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const titleOf = (name) => name.replace(/\([^)]*\)$/g, "").replace(/\[[^\]]*\]/g, "").trim();

async function findCommonsImage(name) {
  const title = titleOf(name);
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrnamespace: "6",
    gsrlimit: "5",
    gsrsearch: title,
    prop: "imageinfo|info",
    inprop: "url",
    iiprop: "url|mime|extmetadata",
    iiurlwidth: "900",
  });
  try {
    const response = await fetch(`${API}?${params}`, { headers: { "User-Agent": "K-Comedy-Archive/1.0 (public archive image metadata)" } });
    if (!response.ok) return null;
    const payload = await response.json();
    const pages = Object.values(payload.query?.pages ?? {});
    const normalized = title.replace(/\s+/g, "").toLowerCase();
    const candidate = pages.find((page) => {
      const pageTitle = String(page.title ?? "").replace(/^File:/i, "").replace(/\s+/g, "").toLowerCase();
      const description = String(page.imageinfo?.[0]?.extmetadata?.ImageDescription?.value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, "").toLowerCase();
      return page.imageinfo?.[0]?.thumburl && (pageTitle.includes(normalized) || description.includes(normalized));
    });
    const info = candidate?.imageinfo?.[0];
    if (!candidate || !info?.thumburl) return null;
    return { imageStatus: "matched", imageUrl: info.thumburl, imageSource: candidate.fullurl || info.descriptionurl || "https://commons.wikimedia.org/", imageTitle: candidate.title };
  } catch {
    return null;
  }
}

async function enrich(records) {
  const output = [...records];
  let cursor = 0;
  async function worker() {
    while (cursor < output.length) {
      const index = cursor++;
      if (output[index].imageUrl) continue;
      const image = await findCommonsImage(output[index].name);
      if (image) output[index] = { ...output[index], ...image };
      await wait(250);
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  return output;
}

const roster = JSON.parse(await fs.readFile(rosterPath, "utf8"));
const rosterRecords = await enrich(roster.records);
const rosterMatched = rosterRecords.filter((record) => record.imageStatus === "matched").length;
await fs.writeFile(rosterPath, JSON.stringify({ ...roster, imageMatched: rosterMatched, imageMissing: rosterRecords.length - rosterMatched, records: rosterRecords }, null, 2) + "\n");
console.log(`${rosterPath}: ${rosterMatched}/${rosterRecords.length} matched`);

const other = JSON.parse(await fs.readFile(otherPath, "utf8"));
const otherRecords = await enrich(other);
await fs.writeFile(otherPath, JSON.stringify(otherRecords, null, 2) + "\n");
console.log(`${otherPath}: ${otherRecords.filter((record) => record.imageStatus === "matched").length}/${otherRecords.length} matched`);
