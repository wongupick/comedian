import fs from "node:fs/promises";

const API = "https://ko.wikipedia.org/w/api.php";
const files = [
  "/home/ubuntu/korean-comedian-portfolio/client/src/data/roster.json",
  "/home/ubuntu/korean-comedian-portfolio/client/src/data/otherRoster.json",
];
const batchSize = 50;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const lookupTitle = (name) => name.replace(/\([^)]*\)$/g, "").replace(/\[[^\]]*\]/g, "").trim();

async function fetchBatch(names) {
  const titles = names.map(lookupTitle);
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    redirects: "1",
    prop: "pageimages|info|extracts",
    inprop: "url",
    piprop: "thumbnail|name",
    pilicense: "free",
    pithumbsize: "900",
    exintro: "1",
    explaintext: "1",
    titles: titles.join("|"),
  });
  const response = await fetch(`${API}?${params}`, { headers: { "User-Agent": "K-Comedy-Archive/1.0 (public archive image metadata)" } });
  if (!response.ok) return new Map();
  const payload = await response.json();
  const pages = Object.values(payload.query?.pages ?? {});
  const map = new Map();
  for (const page of pages) {
    if (page.missing !== undefined || !page.thumbnail?.source) continue;
    const summary = page.extract ?? "";
    const comedianSignal = /코미디언|개그맨|개그우먼|희극인|희극배우|방송인/.test(summary);
    if (!comedianSignal) continue;
    map.set(lookupTitle(page.title), {
      imageStatus: "matched",
      imageUrl: page.thumbnail.source,
      imageSource: page.fullurl || `https://ko.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
      imageTitle: page.title,
    });
  }
  return map;
}

async function enrich(records) {
  const allNames = [...new Set(records.map((record) => lookupTitle(record.name)))];
  const images = new Map();
  for (let index = 0; index < allNames.length; index += batchSize) {
    const batch = allNames.slice(index, index + batchSize);
    const found = await fetchBatch(batch);
    for (const [name, image] of found) images.set(name, image);
    await wait(250);
  }
  return records.map((record) => ({
    ...record,
    ...(images.get(lookupTitle(record.name)) ?? { imageStatus: "not-found", imageUrl: "", imageSource: "" }),
    imageAlt: `${record.name} 프로필 이미지`,
  }));
}

for (const file of files) {
  const raw = JSON.parse(await fs.readFile(file, "utf8"));
  const records = Array.isArray(raw) ? raw : raw.records;
  const enriched = await enrich(records);
  if (Array.isArray(raw)) {
    await fs.writeFile(file, JSON.stringify(enriched, null, 2) + "\n");
    console.log(`${file}: ${enriched.filter((record) => record.imageStatus === "matched").length}/${enriched.length} matched`);
  } else {
    const matched = enriched.filter((record) => record.imageStatus === "matched").length;
    await fs.writeFile(file, JSON.stringify({ ...raw, imageMatched: matched, imageMissing: enriched.length - matched, records: enriched }, null, 2) + "\n");
    console.log(`${file}: ${matched}/${enriched.length} matched`);
  }
}
