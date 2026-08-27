import fs from "node:fs/promises";

const API = "https://ko.wikipedia.org/w/api.php";
const files = [
  "/home/ubuntu/korean-comedian-portfolio/client/src/data/roster.json",
  "/home/ubuntu/korean-comedian-portfolio/client/src/data/otherRoster.json",
];
const concurrency = 8;

function lookupTitle(name) {
  return name.replace(/\([^)]*\)$/g, "").replace(/\[[^\]]*\]/g, "").trim();
}

async function fetchImage(name) {
  const title = lookupTitle(name);
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    redirects: "1",
    prop: "pageimages|info",
    inprop: "url",
    piprop: "thumbnail|name",
    pilicense: "free",
    pithumbsize: "900",
    titles: title,
  });
  try {
    const response = await fetch(`${API}?${params}`, {
      headers: { "User-Agent": "K-Comedy-Archive/1.0 (public archive image metadata)" },
    });
    if (!response.ok) return { imageStatus: "not-found", imageUrl: "", imageSource: "" };
    const payload = await response.json();
    const page = Object.values(payload.query?.pages ?? {})[0];
    if (!page || page.missing !== undefined || !page.thumbnail?.source) return { imageStatus: "not-found", imageUrl: "", imageSource: "" };
    return {
      imageStatus: "matched",
      imageUrl: page.thumbnail.source,
      imageSource: page.fullurl || `https://ko.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      imageTitle: page.title || title,
    };
  } catch {
    return { imageStatus: "error", imageUrl: "", imageSource: "" };
  }
}

async function enrichRecords(records) {
  const output = new Array(records.length);
  let cursor = 0;
  async function worker() {
    while (cursor < records.length) {
      const index = cursor++;
      const record = records[index];
      const image = await fetchImage(record.name);
      output[index] = { ...record, ...image, imageAlt: `${record.name} 프로필 이미지` };
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, records.length) }, worker));
  return output;
}

for (const file of files) {
  const raw = JSON.parse(await fs.readFile(file, "utf8"));
  const records = Array.isArray(raw) ? raw : raw.records;
  const enriched = await enrichRecords(records);
  if (Array.isArray(raw)) {
    await fs.writeFile(file, JSON.stringify(enriched, null, 2) + "\n");
  } else {
    const matched = enriched.filter((record) => record.imageStatus === "matched").length;
    await fs.writeFile(file, JSON.stringify({ ...raw, imageMatched: matched, imageMissing: enriched.length - matched, records: enriched }, null, 2) + "\n");
    console.log(`${file}: ${matched}/${enriched.length} matched`);
  }
}
