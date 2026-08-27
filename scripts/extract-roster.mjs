import fs from "node:fs";
import path from "node:path";

const sourceDir = "/home/ubuntu/page_texts";
const sources = {
  sbs: path.join(sourceDir, "namu.wiki_w__EC_BD_94_EB_AF_B8_EB_94_94_EC_96_B8__EB_AA_A9_EB_A1_9D_SBS.md"),
  kbs: path.join(sourceDir, "namu.wiki_w__EC_BD_94_EB_AF_B8_EB_94_94_EC_96_B8__EB_AA_A9_EB_A1_9D_KBS.md"),
  mbc: path.join(sourceDir, "namu.wiki_w__EC_BD_94_EB_AF_B8_EB_94_94_EC_96_B8__EB_AA_A9_EB_A1_9D_MBC.md"),
};

const patterns = {
  sbs: /^(?:\d+\.\s+)?SBS\s+(?:(\d+)기|특채|공채 이전 영입|영입|MBC 영입)/,
  kbs: /^(?:\d+\.\s+)?KBS\s+(?:(\d+)기|특채|개그콘서트 특채)/,
  mbc: /^(?:\d+\.\d+\.\s+)?MBC\s+(?:(?:코미디 탤런트|개그맨 콘테스트|공채)\s+)?(?:(\d+)기|특채|공채 이전)/,
};

const hardSkip = /^(?:\[편집\]|목차|개요|공채 전|공채 이전|특채|영입|코미디언|출처|최근|분류|상위 문서|이 기수|이 문서는|MBC의|SBS의|KBS의|개그콘서트|웃찾사|문서|기수로|기수이다|연도별|이후|[0-9]+\.|\|)/;
const prose = /(이다\.?|한다\.?|했다\.?|있다\.?|된다\.?|보인다\.?|출연|활동|전업|이적|기수|공채|특채|배우|유튜브|개그콘서트|웃찾사|때문|현재|당시|이후)/;

function cleanName(raw) {
  return raw
    .replace(/^[-•·*\s]+/, "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/†/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*:\s*.*$/, "")
    .replace(/\s*\(특채\)\s*$/, "")
    .trim();
}

function extract(broadcaster, file) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).map((line) => line.trim());
  const roster = [];
  let current = null;
  for (const line of lines) {
    const match = patterns[broadcaster].exec(line);
    if (match) {
      const generation = Number(match[1] ?? 0);
      const track = line.includes("특채") ? "특채" : line.includes("영입") ? "영입" : line.includes("콘테스트") ? "콘테스트" : line.includes("탤런트") ? "코미디 탤런트" : "공채";
      const yearMatch = line.match(/(19|20)\d{2}(?:~\d{2,4})?/);
      current = { broadcaster, generation, track, year: yearMatch?.[0] ?? "", title: line, names: [] };
      roster.push(current);
      continue;
    }
    if (!current || !line || hardSkip.test(line) || prose.test(line) || line.length > 55) continue;
    const name = cleanName(line);
    if (!name || name.length < 2 || /[0-9|]/.test(name)) continue;
    if (!current.names.includes(name)) current.names.push(name);
  }
  return roster.filter((section) => section.names.length > 0);
}

const result = Object.entries(sources).flatMap(([broadcaster, file]) => extract(broadcaster, file));
const records = result.flatMap((section) => section.names.map((name, index) => ({
  id: `${section.broadcaster}-${section.track}-${section.generation || "special"}-${index + 1}-${name}`,
  broadcaster: section.broadcaster,
  generation: section.generation,
  track: section.track,
  year: section.year,
  name,
  verificationNote: "공개 편집 문서 기준 · 실제 기수/소속은 추가 확인 필요",
})));

const output = { generatedAt: new Date().toISOString(), sectionCount: result.length, recordCount: records.length, sections: result.map(({ names, ...section }) => ({ ...section, count: names.length })), records };
fs.writeFileSync("/home/ubuntu/korean-comedian-portfolio/client/src/data/roster.json", JSON.stringify(output, null, 2));
console.log(JSON.stringify({ sectionCount: output.sectionCount, recordCount: output.recordCount, byBroadcaster: Object.fromEntries(Object.keys(sources).map((key) => [key, records.filter((record) => record.broadcaster === key).length])) }, null, 2));
