/* K-Comedy Search Platform: white canvas, sans-serif hierarchy, chip filters, photo-first cards, and data-first detail view. */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUp,
  ChevronDown,
  ExternalLink,
  Filter,
  Play,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import comediansData from "../data/comedians.json";

type BroadcasterId = "all" | "sbs" | "kbs" | "mbc" | "other";
type QuickCategory = BroadcasterId | "cobig" | "male" | "female";
type SortOrder = "name" | "debutAsc" | "debutDesc";

type Affiliation = {
  broadcaster: string;
  track: string | null;
  generation: number | null;
  recruitmentYear: string | null;
};

type Comedian = {
  id: string;
  name: string;
  gender: string | null;
  birthDate: string | null;
  debutYear: string | null;
  broadcaster: BroadcasterId;
  generation: number | null;
  track: string | null;
  recruitmentYear: string | null;
  agency: string | null;
  programs: string[];
  introduction: string | null;
  youtube: string | null;
  instagram: string | null;
  imageUrl: string | null;
  imageSource: string | null;
  imageStatus: string;
  sourceUrls: string[];
  chosung: string;
  affiliations: Affiliation[];
};

const comedians = comediansData.records as Comedian[];
const initials = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const debutYears = Array.from(new Set(comedians.flatMap((person) => [person.debutYear, person.recruitmentYear]).filter(Boolean) as string[])).sort();
const broadcasters: { id: BroadcasterId; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "kbs", label: "KBS" },
  { id: "mbc", label: "MBC" },
  { id: "sbs", label: "SBS" },
  { id: "other", label: "기타" },
];
const quickCategories: { id: QuickCategory; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "kbs", label: "KBS" },
  { id: "mbc", label: "MBC" },
  { id: "sbs", label: "SBS" },
  { id: "cobig", label: "코미디빅리그" },
  { id: "male", label: "남성" },
  { id: "female", label: "여성" },
];

function getAge(birthDate: string | null) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const birthdayPassed = today.getMonth() > birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!birthdayPassed) age -= 1;
  return age > 0 ? age : null;
}

function isBroadcasterMatch(person: Comedian, broadcaster: BroadcasterId) {
  return broadcaster === "all" || person.broadcaster === broadcaster || person.affiliations.some((affiliation) => affiliation.broadcaster === broadcaster);
}

export default function Home() {
  const [quickCategory, setQuickCategory] = useState<QuickCategory>("all");
  const [broadcaster, setBroadcaster] = useState<BroadcasterId>("all");
  const [gender, setGender] = useState("all");
  const [initial, setInitial] = useState("all");
  const [debutYear, setDebutYear] = useState("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("name");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showTop, setShowTop] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return comedians.filter((person) => {
      const quickMatch = quickCategory === "all" || (quickCategory === "male" && person.gender === "남성") || (quickCategory === "female" && person.gender === "여성") || (quickCategory === "cobig" && person.programs.some((program) => program.includes("코미디빅리그"))) || (quickCategory !== "male" && quickCategory !== "female" && quickCategory !== "cobig" && isBroadcasterMatch(person, quickCategory));
      const broadcasterMatch = isBroadcasterMatch(person, broadcaster);
      const genderMatch = gender === "all" || person.gender === gender;
      const initialMatch = initial === "all" || person.chosung.startsWith(initial);
      const year = person.debutYear ?? person.recruitmentYear;
      const debutMatch = debutYear === "all" || year?.startsWith(debutYear);
      const haystack = [person.name, person.agency, person.introduction, person.broadcaster, person.track, ...person.programs].filter(Boolean).join(" ").toLowerCase();
      return quickMatch && broadcasterMatch && genderMatch && initialMatch && debutMatch && (!normalized || haystack.includes(normalized));
    }).sort((a, b) => {
      if (sortOrder === "name") return a.name.localeCompare(b.name, "ko");
      const aYear = Number(a.debutYear ?? a.recruitmentYear) || 9999;
      const bYear = Number(b.debutYear ?? b.recruitmentYear) || 9999;
      return sortOrder === "debutAsc" ? aYear - bYear : bYear - aYear;
    });
  }, [broadcaster, debutYear, gender, initial, query, quickCategory, sortOrder]);

  useEffect(() => setVisibleCount(24), [broadcaster, debutYear, gender, initial, query, quickCategory, sortOrder]);

  const activeProfile = filtered.find((person) => person.id === selectedId) ?? filtered[0] ?? null;
  const visibleProfiles = filtered.slice(0, visibleCount);
  const hasFilters = Boolean(query || broadcaster !== "all" || gender !== "all" || initial !== "all" || debutYear !== "all" || quickCategory !== "all");

  function resetFilters() {
    setQuickCategory("all");
    setBroadcaster("all");
    setGender("all");
    setInitial("all");
    setDebutYear("all");
    setQuery("");
    setSortOrder("name");
  }

  function openProfile(id: string) {
    setSelectedId(id);
    window.setTimeout(() => document.getElementById("profile-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  return (
    <div className="search-platform">
      <header className="platform-header">
        <a className="platform-logo" href="#top" aria-label="K-Comedy Archive 홈"><span className="logo-dot" /> <span>K-COMEDY</span><small>ARCHIVE</small></a>
        <nav className="platform-nav" aria-label="주요 메뉴"><a href="#directory">개그맨 찾기</a><a href="#directory">카테고리</a><a href="#profile-detail">아카이브 소개</a></nav>
      </header>

      <main id="top">
        <section className="search-hero" aria-labelledby="page-title">
          <div className="page-eyebrow">K-COMEDY / PEOPLE DIRECTORY</div>
          <h1 id="page-title">대한민국 개그맨을<br /><em>찾아보세요.</em></h1>
          <p>방송사, 데뷔연도, 프로그램 등 다양한 조건으로<br className="desktop-only" /> 개그맨 프로필을 검색해보세요.</p>
          <div className="hero-search"><Search size={20} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="개그맨 이름, 프로그램, 소속사 검색" aria-label="개그맨 이름, 프로그램, 소속사 검색" />{query && <button type="button" aria-label="검색어 지우기" onClick={() => setQuery("")}><X size={18} /></button>}</div>
        </section>

        <section id="directory" className="directory-section">
          <div className="category-row" aria-label="빠른 카테고리 필터">{quickCategories.map((category) => <button type="button" key={category.id} className={quickCategory === category.id ? "category-chip active" : "category-chip"} onClick={() => setQuickCategory(category.id)}>{category.label}</button>)}</div>
          <div className="filter-toolbar">
            <button type="button" className="mobile-filter-trigger" onClick={() => setMobileFiltersOpen((open) => !open)}><SlidersHorizontal size={16} /> 필터</button>
            <div className={mobileFiltersOpen ? "filter-controls open" : "filter-controls"}>
              <SelectFilter label="방송사" value={broadcaster} onChange={(value) => setBroadcaster(value as BroadcasterId)} options={broadcasters.map((item) => ({ value: item.id, label: item.label }))} />
              <SelectFilter label="성별" value={gender} onChange={setGender} options={[{ value: "all", label: "전체 성별" }, { value: "남성", label: "남성" }, { value: "여성", label: "여성" }]} />
              <SelectFilter label="초성" value={initial} onChange={setInitial} options={[{ value: "all", label: "전체 초성" }, ...initials.map((item) => ({ value: item, label: item }))]} />
              <SelectFilter label="데뷔연도" value={debutYear} onChange={setDebutYear} options={[{ value: "all", label: "전체 연도" }, ...debutYears.map((item) => ({ value: item, label: item }))]} />
              {hasFilters && <button type="button" className="reset-button" onClick={resetFilters}><RotateCcw size={14} /> 초기화</button>}
            </div>
            <div className="sort-control"><span>정렬</span><select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} aria-label="결과 정렬"><option value="name">가나다순</option><option value="debutAsc">데뷔 빠른순</option><option value="debutDesc">데뷔 최신순</option></select><ChevronDown size={14} /></div>
          </div>

          <div className="result-heading"><div><h2>개그맨 <strong>{filtered.length}</strong>명</h2><p>{hasFilters ? "선택한 조건에 맞는 프로필입니다." : "공개 자료 기반으로 정리한 코미디언 프로필입니다."}</p></div><span className="result-index">{visibleProfiles.length} / {filtered.length} 표시</span></div>
          {visibleProfiles.length > 0 ? <div className="comedian-grid">{visibleProfiles.map((person) => <ComedianCard key={person.id} person={person} onOpen={() => openProfile(person.id)} />)}</div> : <div className="no-results"><Filter size={22} /><h3>검색 결과가 없습니다.</h3><p>다른 검색어 또는 필터 조건을 선택해보세요.</p><button type="button" onClick={resetFilters}>필터 초기화</button></div>}
          {visibleCount < filtered.length && <button type="button" className="load-more" onClick={() => setVisibleCount((count) => count + 24)}>더보기 <span>{Math.min(visibleCount + 24, filtered.length)} / {filtered.length}</span></button>}
        </section>

        <section id="profile-detail" className="profile-detail-section" aria-labelledby="detail-title">
          <div className="detail-section-heading"><div><span className="page-eyebrow">PROFILE / DETAIL VIEW</span><h2 id="detail-title">프로필 상세</h2></div><p>카드를 선택하면 해당 인물의<br className="desktop-only" /> 공개 프로필 정보를 확인할 수 있습니다.</p></div>
          {activeProfile ? <ProfileDetail person={activeProfile} /> : <div className="detail-empty"><UserRound size={26} /><p>프로필 카드를 선택해 상세 정보를 확인하세요.</p></div>}
        </section>
      </main>

      <footer className="platform-footer"><span>K-COMEDY ARCHIVE</span><span>대한민국 코미디언 프로필 아카이브</span><span>DATA / {comedians.length}</span></footer>
      {showTop && <button type="button" className="top-widget" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="페이지 상단으로 이동"><ArrowUp size={17} /><span>TOP</span></button>}
    </div>
  );
}

function SelectFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <label className="select-filter"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} aria-label={`${label} 필터`}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown size={14} /></label>;
}

function ComedianCard({ person, onOpen }: { person: Comedian; onOpen: () => void }) {
  const year = person.debutYear ?? person.recruitmentYear;
  const broadcaster = person.broadcaster === "other" ? "기타" : person.broadcaster.toUpperCase();
  return <article className="comedian-card" tabIndex={0} role="button" onClick={onOpen} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(); } }} aria-label={`${person.name} 프로필 보기`}><div className="card-photo">{person.imageStatus === "matched" && person.imageUrl ? <img src={person.imageUrl} alt={`${person.name} 프로필 이미지`} loading="lazy" decoding="async" /> : <div className="image-placeholder"><UserRound size={31} /><span>{person.name.slice(0, 1)}</span></div>}<span className="photo-status">{person.imageStatus === "matched" ? "IMAGE" : "PROFILE"}</span></div><div className="card-body"><div className="card-name-row"><h3>{person.name}</h3><span>{broadcaster}</span></div><p className="card-meta">{year ? `${year}년 데뷔` : "데뷔연도 정보 확인 중"}</p>{person.programs.length > 0 && <p className="card-programs">{person.programs.slice(0, 2).join(" · ")}</p>}</div></article>;
}

function ProfileDetail({ person }: { person: Comedian }) {
  const age = getAge(person.birthDate);
  const broadcaster = person.broadcaster === "other" ? "기타" : person.broadcaster.toUpperCase();
  return <div className="detail-panel"><div className="detail-image">{person.imageStatus === "matched" && person.imageUrl ? <img src={person.imageUrl} alt={`${person.name} 프로필 이미지`} /> : <div className="detail-placeholder"><UserRound size={48} /><strong>{person.name.slice(0, 1)}</strong><span>PROFILE IMAGE<br />확인 중</span></div>}{person.imageSource && <a href={person.imageSource} target="_blank" rel="noreferrer" className="source-link">이미지 출처 <ExternalLink size={13} /></a>}</div><div className="detail-copy"><div className="detail-label">{broadcaster} · {person.generation ? `${person.track} ${person.generation}기` : person.track ?? "공개 자료"}</div><h3>{person.name}</h3><p className="detail-intro">{person.introduction ?? "공식 소개 자료 확인 중"}</p><div className="detail-facts"><Fact label="생년월일" value={person.birthDate ?? "정보 확인 중"} /><Fact label="현재 나이" value={age ? `${age}세` : "정보 확인 중"} /><Fact label="데뷔연도" value={person.debutYear ?? person.recruitmentYear ?? "정보 확인 중"} /><Fact label="소속사" value={person.agency ?? "정보 확인 중"} /><Fact label="주요 프로그램" value={person.programs.length ? person.programs.join(" · ") : "정보 확인 중"} wide /></div><div className="detail-source-list"><span>정보 출처</span>{person.sourceUrls.slice(0, 3).map((url) => <a key={url} href={url} target="_blank" rel="noreferrer">공개 자료 <ExternalLink size={12} /></a>)}</div><div className="detail-media-note"><Play size={15} /><span>영상 및 활동내역 자료는 해당 인물의 상세 아카이브에 순차적으로 연결됩니다.</span></div></div></div>;
}

function Fact({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={wide ? "fact wide" : "fact"}><span>{label}</span><b>{value}</b></div>;
}
