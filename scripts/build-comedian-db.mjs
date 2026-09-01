import fs from "node:fs";

const roster = JSON.parse(fs.readFileSync("client/src/data/roster.json", "utf8"));
const other = JSON.parse(fs.readFileSync("client/src/data/otherRoster.json", "utf8"));
const sourceByBroadcaster = {
  sbs: "https://programs.sbs.co.kr/enter/smilepeople/main",
  kbs: "https://news.kbs.co.kr/news/view.do?ncd=8154064",
  mbc: "https://program.imbc.com/Cast/1000370100000100000",
  other: "https://ko.wikipedia.org/wiki/%EC%9C%A0%EB%B3%91%EC%9E%AC",
};
const listSourceByBroadcaster = {
  sbs: "https://namu.wiki/w/%EC%BD%94%EB%AF%B8%EB%94%94%EC%96%B8/%EB%AA%A9%EB%A1%9D/SBS",
  kbs: "https://namu.wiki/w/%EC%BD%94%EB%AF%B8%EB%94%94%EC%96%B8/%EB%AA%A9%EB%A1%9D/KBS",
  mbc: "https://namu.wiki/w/%EC%BD%94%EB%AF%B8%EB%94%94%EC%96%B8/%EB%AA%A9%EB%A1%9D/MBC",
  other: "https://ko.wikipedia.org/wiki/%EC%BD%94%EB%AF%B8%EB%94%94%EC%96%B8",
};
const junk = /저작권|나무위키|문서의|기여하신|콘텐츠|라이선스|연락처|이용약관|Operado|Hecho con|Impulsado|Contáctenos|Términos|UTC|실종 사건|JLPT|오디세이|사비뉴|lck|네팔|돌리 파튼/;
const award = /\([^)]*\)$/;
const initials = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
function cleanName(value) {
  return String(value ?? "").replace(/\[\d+\]/g, "").replace(award, "").replace(/[·•]/g, "").replace(/\s+/g, "").trim();
}
function isPersonName(name) {
  return name.length >= 2 && name.length <= 6 && /[가-힣]/.test(name) && !junk.test(name) && !/[0-9]|https?:|[!?]/.test(name);
}
function choseong(name) {
  return [...name].map((char) => {
    const code = char.charCodeAt(0) - 0xac00;
    return code >= 0 && code <= 11171 ? initials[Math.floor(code / 588)] : char;
  }).join("");
}
function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-");
}
function sourceFor(record) {
  return sourceByBroadcaster[record.broadcaster] ?? sourceByBroadcaster.other;
}
const input = [...roster.records, ...other];
const byName = new Map();
const dropped = [];
for (const record of input) {
  const name = cleanName(record.name);
  if (!isPersonName(name)) { dropped.push(record.name); continue; }
  const existing = byName.get(name);
  const affiliation = {
    broadcaster: record.broadcaster,
    track: record.track ?? null,
    generation: Number(record.generation) || null,
    recruitmentYear: record.year || null,
    sourceUrl: sourceFor(record),
  };
  if (existing) {
    existing.aliases = [...new Set([...existing.aliases, record.name].filter(Boolean))];
    existing.affiliations.push(affiliation);
    existing.sourceUrls = [...new Set([...existing.sourceUrls, sourceFor(record), listSourceByBroadcaster[record.broadcaster] ?? listSourceByBroadcaster.other])];
    if (existing.imageStatus !== "matched" && record.imageStatus === "matched") {
      existing.imageUrl = record.imageUrl;
      existing.imageSource = record.imageSource;
      existing.imageStatus = "matched";
    }
  } else {
    byName.set(name, {
      id: `comedian-${slug(name)}`,
      name,
      aliases: record.name && record.name !== name ? [record.name] : [],
      gender: null,
      birthDate: null,
      debutYear: null,
      broadcaster: record.broadcaster,
      generation: Number(record.generation) || null,
      track: record.track ?? null,
      recruitmentYear: record.year || null,
      agency: null,
      programs: [],
      introduction: null,
      youtube: null,
      instagram: null,
      imageUrl: record.imageUrl || null,
      imageSource: record.imageSource || null,
      imageStatus: record.imageStatus === "matched" ? "matched" : "placeholder",
      sourceUrls: [sourceFor(record), listSourceByBroadcaster[record.broadcaster] ?? listSourceByBroadcaster.other],
      verificationStatus: "needs-review",
      verificationNote: "공개 목록 기반 항목입니다. 공식 프로필로 추가 확인이 필요합니다.",
      chosung: choseong(name),
      affiliations: [affiliation],
    });
  }
}
const records = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, "ko"));
const stats = {
  inputRecords: input.length,
  cleanedUniqueRecords: records.length,
  droppedRecords: dropped.length,
  duplicateMerged: input.length - dropped.length - records.length,
  byBroadcaster: Object.fromEntries(["sbs","kbs","mbc","other"].map((b) => [b, records.filter((r) => r.broadcaster === b).length])),
  matchedImages: records.filter((r) => r.imageStatus === "matched").length,
  placeholders: records.filter((r) => r.imageStatus === "placeholder").length,
  needsReview: records.filter((r) => r.verificationStatus === "needs-review").length,
};
fs.writeFileSync("client/src/data/comedians.json", JSON.stringify({ generatedAt: new Date().toISOString(), stats, records }, null, 2) + "\n");
fs.writeFileSync("client/src/data/comedians-stats.json", JSON.stringify(stats, null, 2) + "\n");
console.log(JSON.stringify(stats, null, 2));
