/* 방송 아카이브 뮤지엄: 왼쪽 색인 레일과 오른쪽 큐레이션 캔버스, 종이·커튼·녹화등의 대비를 유지한다. */
import { useEffect, useMemo, useState } from "react";
import comediansData from "../data/comedians.json";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Camera,
  ChevronRight,
  CircleDot,
  Clock3,
  ExternalLink,
  FileText,
  Film,
  Menu,
  Mic2,
  Play,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";

const HERO_IMAGE = "/manus-storage/comedy-archive-hero_847e9e8a.png";
const MARK_IMAGE = "/manus-storage/comedy-archive-mark_4badf9a7.png";

type BroadcasterId = "all" | "sbs" | "kbs" | "mbc" | "other";

type Profile = {
  id: string;
  name: string;
  broadcaster: Exclude<BroadcasterId, "all">;
  generation: number;
  track: string | null;
  year: string;
  recruitmentYear: string | null;
  debutYear: string | null;
  gender: string | null;
  birthDate: string | null;
  currentAge: number | null;
  agency: string | null;
  programs: string[];
  introduction: string | null;
  youtube: string | null;
  instagram: string | null;
  sourceUrls: string[];
  affiliations: { broadcaster: string; track: string | null; generation: number | null; recruitmentYear: string | null }[];
  chosung: string;
  role: string;
  note: string;
  tags: string[];
  catchphrase: string;
  catchphraseNote: string;
  activities: { year: string; title: string; detail: string; state?: string }[];
  imageUrl?: string;
  imageSource?: string;
  imageStatus?: "matched" | "not-found" | "error";
};

const broadcasters: { id: BroadcasterId; label: string; short: string }[] = [
  { id: "all", label: "전체 방송사", short: "ALL" },
  { id: "sbs", label: "SBS", short: "SBS" },
  { id: "kbs", label: "KBS", short: "KBS" },
  { id: "mbc", label: "MBC", short: "MBC" },
  { id: "other", label: "기타", short: "ETC" },
];

const defaultActivities = (name: string, track: string | null) => [
  { year: "01", title: "공채·데뷔 기록", detail: `${track} 기수와 첫 활동 정보를 확인·입력하는 영역입니다.`, state: "SOURCE" },
  { year: "02", title: "대표 프로그램 기록", detail: `${name}의 프로그램명, 코너명, 방영 기간과 역할을 정리합니다.`, state: "SLOT" },
  { year: "03", title: "유행어·캐릭터 기록", detail: "유행어가 사용된 장면과 캐릭터의 맥락을 상세히 덧붙입니다.", state: "SLOT" },
];

const profiles: Profile[] = comediansData.records.map((record) => {
  const birthDate = record.birthDate;
  const currentAge = birthDate ? Math.max(0, new Date().getFullYear() - Number(String(birthDate).slice(0, 4)) - (new Date().toISOString().slice(5, 10) < String(birthDate).slice(5, 10) ? 1 : 0)) : null;
  const generation = record.generation ?? 0;
  const track = record.track ?? "정보 확인 중";
  return {
    id: record.id,
    name: record.name,
    broadcaster: record.broadcaster as Exclude<BroadcasterId, "all">,
    generation,
    track,
    year: record.recruitmentYear ?? "",
    recruitmentYear: record.recruitmentYear,
    debutYear: record.debutYear,
    gender: record.gender,
    birthDate,
    currentAge,
    agency: record.agency,
    programs: record.programs,
    introduction: record.introduction,
    youtube: record.youtube,
    instagram: record.instagram,
    sourceUrls: record.sourceUrls,
    affiliations: record.affiliations,
    chosung: record.chosung,
    role: record.gender ? `${record.gender} 코미디언` : "코미디언 · 방송인",
    note: record.verificationNote,
    tags: [record.broadcaster === "other" ? "기타" : record.broadcaster.toUpperCase(), generation ? `${track} ${generation}기` : track, record.recruitmentYear || "YEAR TBD"],
    catchphrase: "대표 유행어 입력 슬롯",
    catchphraseNote: "방송에서 탄생한 대표 유행어와 캐릭터의 맥락을 기록해 주세요.",
    activities: defaultActivities(record.name, track),
    imageUrl: record.imageUrl ?? "",
    imageSource: record.imageSource ?? "",
    imageStatus: record.imageStatus === "matched" ? "matched" : "not-found",
  };
});

const generations = Array.from({ length: 34 }, (_, index) => index + 1);
const initialOptions = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const debutOptions = Array.from(new Set(profiles.map((profile) => profile.recruitmentYear).filter((year): year is string => Boolean(year)))).sort();

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Home() {
  const [broadcaster, setBroadcaster] = useState<BroadcasterId>("all");
  const [generation, setGeneration] = useState<number | "all">("all");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [query, setQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [initialFilter, setInitialFilter] = useState("all");
  const [debutFilter, setDebutFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("name");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [notice, setNotice] = useState("");
  const [showTopButton, setShowTopButton] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    const handleScroll = () => setShowTopButton(window.scrollY > 560);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const selectedProfiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return profiles.filter((profile) => {
      const broadcasterMatch = broadcaster === "all" || profile.broadcaster === broadcaster || profile.affiliations.some((affiliation) => affiliation.broadcaster === broadcaster);
      const generationMatch = broadcaster === "other" ? profile.generation === 0 : generation === "all" || profile.generation === generation;
      const genderMatch = genderFilter === "all" || profile.gender === genderFilter;
      const initialMatch = initialFilter === "all" || profile.chosung.startsWith(initialFilter);
      const debutMatch = debutFilter === "all" || (profile.debutYear ?? profile.recruitmentYear)?.startsWith(debutFilter);
      const queryMatch = !normalizedQuery || [profile.name, profile.role, profile.agency ?? "", profile.introduction ?? "", ...profile.programs, ...profile.tags, profile.catchphrase].join(" ").toLowerCase().includes(normalizedQuery);
      return broadcasterMatch && generationMatch && genderMatch && initialMatch && debutMatch && queryMatch;
    }).sort((a, b) => sortOrder === "debut" ? (Number(a.recruitmentYear) || 9999) - (Number(b.recruitmentYear) || 9999) : a.name.localeCompare(b.name, "ko"));
  }, [broadcaster, generation, query, genderFilter, initialFilter, debutFilter, sortOrder]);

  useEffect(() => {
    setVisibleCount(24);
  }, [broadcaster, generation, query, genderFilter, initialFilter, debutFilter, sortOrder]);

  const visibleProfiles = selectedProfiles.slice(0, visibleCount);
  const activeProfile = selectedProfiles.find((profile) => profile.id === selectedProfileId) ?? selectedProfiles[0];
  const activeBroadcaster = broadcasters.find((item) => item.id === broadcaster) ?? broadcasters[0];

  function chooseBroadcaster(id: BroadcasterId) {
    setBroadcaster(id);
    setGeneration("all");
    setSelectedProfileId("");
    setQuery("");
    setGenderFilter("all");
    setInitialFilter("all");
    setDebutFilter("all");
    setSortOrder("name");
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="archive-shell">
      <header className="site-header">
        <a className="brand-lockup" href="#top" aria-label="K-Comedy Archive 홈">
          <span className="brand-seal"><img src={MARK_IMAGE} alt="" className="brand-mark" /><Mic2 size={15} /></span>
          <span className="brand-wordmark"><b>K</b>-COMEDY <em>ARCHIVE</em></span>
        </a>
        <button className="mobile-menu-button" type="button" aria-label={mobileNavOpen ? "메뉴 닫기" : "메뉴 열기"} onClick={() => setMobileNavOpen((open) => !open)}>
          {mobileNavOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
        <nav className={mobileNavOpen ? "main-nav is-open" : "main-nav"} aria-label="주요 메뉴">
          <button type="button" onClick={() => { scrollToId("archive"); setMobileNavOpen(false); }}>ARCHIVE <span>01</span></button>
          <button type="button" onClick={() => { scrollToId("profile"); setMobileNavOpen(false); }}>PROFILE <span>02</span></button>
          <button type="button" onClick={() => { scrollToId("video"); setMobileNavOpen(false); }}>VIDEO <span>03</span></button>
        </nav>
        <div className="header-status"><CircleDot size={11} fill="currentColor" /> ON AIR / 2026</div>
      </header>

      <main id="top">
        <section className="hero-section" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
          <div className="hero-wash" />
          <div className="hero-content">
            <p className="eyebrow light"><span className="eyebrow-line" /> A LIVING INDEX OF KOREAN COMEDY</p>
            <h1>웃음은 사라지지 않고,<br /><i>편성표 사이에</i> 남습니다.</h1>
            <p className="hero-description">공채 기수부터 무대 위 한 문장까지.<br />한국 코미디의 장면을 다시 펼쳐보는 기록 보관소.</p>
            <button className="text-arrow-button light-button" type="button" onClick={() => scrollToId("archive")}>기수별 자료 펼치기 <ArrowDown size={16} /></button>
          </div>
          <div className="hero-caption"><span>FIG. 01</span><span>MICROPHONE / STAGE / MEMORY</span></div>
          <div className="hero-stamp">ON<br />AIR</div>
        </section>

        <section id="archive" className="archive-section content-anchor">
          <aside className="archive-rail">
            <div className="section-kicker"><Archive size={14} /> INDEX / 001</div>
            <div className="rail-heading"><span>01</span><h2>방송사<br />색인</h2></div>
            <p className="rail-copy">공채 기수라는 좌표로<br />웃음의 계보를 찾습니다.</p>
            <div className="broadcast-list" role="tablist" aria-label="방송사 선택">
              {broadcasters.map((item) => {
                const count = item.id === "all" ? profiles.length : profiles.filter((profile) => profile.broadcaster === item.id).length;
                return <button key={item.id} type="button" role="tab" aria-selected={broadcaster === item.id} className={broadcaster === item.id ? "broadcast-tab active" : "broadcast-tab"} onClick={() => chooseBroadcaster(item.id)}><span>{item.short}</span><small>{item.label}</small><b>{String(count).padStart(2, "0")}</b></button>;
              })}
            </div>
            <div className="rail-note"><span className="note-dot" /> 기수 데이터는 계속 추가됩니다.<br /><em>Last updated / 2026.08</em></div>
          </aside>

          <div className="archive-canvas">
            <div className="canvas-topline"><span>ARCHIVE / {activeBroadcaster.short}</span><span>SELECT GENERATION <ChevronRight size={13} /></span></div>
            <div className="generation-bar" role="tablist" aria-label="공채 기수 선택">
              {broadcaster === "other" ? <span className="generation-context-chip"><CircleDot size={11} /> 현재 기준 · 비공채 / 독립 데뷔 자료</span> : <><button type="button" role="tab" aria-selected={generation === "all"} className={generation === "all" ? "generation-tab active" : "generation-tab"} onClick={() => setGeneration("all")}>ALL</button>{generations.map((item) => <button key={item} type="button" role="tab" aria-selected={generation === item} className={generation === item ? "generation-tab active" : "generation-tab"} onClick={() => setGeneration(item)}>{item}<sup>기</sup></button>)}</>}
            </div>
            <div className="archive-intro">
              <div><p className="eyebrow"><span className="eyebrow-line" /> CURRENT SELECTION</p><h2>{activeBroadcaster.label} <span>/</span> {broadcaster === "other" ? "현재 자료" : generation === "all" ? "전체 기록" : `${generation}기 기록`}</h2></div>
              <div className="archive-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, 프로그램, 소속사 검색" aria-label="프로필 검색" /></div>
            </div>
            <div className="filter-row" aria-label="상세 검색 필터">
              <label>성별<select value={genderFilter} onChange={(event) => setGenderFilter(event.target.value)}><option value="all">전체 성별</option><option value="남성">남성</option><option value="여성">여성</option></select></label>
              <label>초성<select value={initialFilter} onChange={(event) => setInitialFilter(event.target.value)}><option value="all">전체 초성</option>{initialOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              <label>데뷔연도<select value={debutFilter} onChange={(event) => setDebutFilter(event.target.value)}><option value="all">전체 연도</option>{debutOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              <label>정렬<select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option value="name">가나다순</option><option value="debut">데뷔연도순</option></select></label>
            </div>
            {selectedProfiles.length > 0 ? <div className="profile-results"><div className="results-meta"><span>{selectedProfiles.length} RECORDS FOUND</span><span>SELECT A DOSSIER TO OPEN</span></div><div className="profile-results-grid">{visibleProfiles.map((profile) => <ProfileCard key={profile.id} profile={profile} onOpen={() => { setSelectedProfileId(profile.id); scrollToId("profile"); }} />)}</div>{visibleCount < selectedProfiles.length && <button className="load-more-button" type="button" onClick={() => setVisibleCount((count) => count + 24)}>더보기 <span>{Math.min(visibleCount + 24, selectedProfiles.length)} / {selectedProfiles.length}</span></button>}</div> : <EmptyArchive broadcaster={broadcaster} generation={generation} onRequest={() => showNotice("이 기수는 자료 입력을 기다리고 있습니다.")} />}
          </div>
        </section>

        <section className="archive-note-section">
          <div className="note-image-wrap"><div className="material-still-life" role="img" aria-label="방송 큐시트와 카세트가 놓인 아카이브 책상"><div className="still-paper"><span>Q-SHEET</span><i>ON AIR</i><b>001</b></div><div className="still-tape"><span>ARCHIVE</span></div><div className="still-button" /></div><span className="image-index">FIG. 02 / SOURCE DESK / ACCESSION 004</span></div>
          <div className="note-copy"><p className="eyebrow"><span className="eyebrow-line" /> CURATOR'S NOTE</p><h2>한 사람의 이력은<br /><i>한 시대의 편성표</i>입니다.</h2><p>프로그램 제목만 남기는 대신, 그 사람이 어떤 무대에서 어떤 말투와 캐릭터로 기억되었는지 기록합니다. 이미지와 대본, 유행어의 맥락이 모이면 코미디의 역사가 됩니다.</p><button className="text-arrow-button" type="button" onClick={() => showNotice("큐레이터 노트는 다음 업데이트에서 공개됩니다.")}>아카이브 작성 원칙 <ArrowUpRight size={16} /></button></div>
          <div className="vertical-index">K-CA / NOTE / 2026</div>
        </section>

        <section id="profile" className="profile-section content-anchor">
          <div className="section-heading-row"><div><p className="eyebrow"><span className="eyebrow-line" /> PROFILE / {activeProfile ? `${activeProfile.broadcaster === "other" ? "ETC" : activeProfile.broadcaster.toUpperCase()} ${activeProfile.generation || "SPECIAL"}G` : "EMPTY SLOT"}</p><h2>한 사람의<br /><i>웃음 기록</i></h2></div><div className="section-side-note"><span>DETAIL DOSSIER</span><br />프로필 이미지 · 활동내역 ·<br />유행어 상세 기술</div></div>
          {activeProfile ? <ProfileDetail profile={activeProfile} /> : <DetailEmpty />}
        </section>

        <section id="video" className="video-section content-anchor">
          <div className="video-heading"><p className="eyebrow light"><span className="eyebrow-line" /> VIDEO ARCHIVE / 003</p><h2>무대의 공기는<br /><i>영상으로 남습니다.</i></h2><p>방송 클립, 무대 영상, 인터뷰를 연결할 수 있는 영상 자료실입니다. 지금은 첫 번째 슬롯을 비워 두었습니다.</p></div>
          <div className={videoPlaying ? "video-card is-playing" : "video-card"}>
            {!videoPlaying ? <><div className="video-monitor-art" role="img" aria-label="빈티지 방송 모니터와 릴 테이프"><div className="monitor-screen"><span>ARCHIVE<br />SIGNAL</span></div><div className="monitor-base" /><div className="reel-tape" /></div><div className="video-overlay" /><button className="play-button" type="button" aria-label="영상 슬롯 재생" onClick={() => setVideoPlaying(true)}><Play size={18} fill="currentColor" /></button><div className="video-card-meta"><span>VIDEO SLOT / 001</span><span>00:00 — 00:00</span></div></> : <div className="video-placeholder-playing"><div className="playing-symbol"><CircleDot size={42} /></div><span>VIDEO SOURCE SLOT</span><strong>영상 링크를 연결해 주세요.</strong><button type="button" onClick={() => setVideoPlaying(false)}>슬롯 닫기</button></div>}
          </div>
          <div className="video-footnote"><Film size={15} /><span>VIDEO CONTENT WILL BE ADDED HERE</span><button type="button" onClick={() => showNotice("영상 보존 슬롯이 준비되면 링크를 연결할 수 있습니다.")}><Plus size={14} /> OPEN SOURCE SLOT</button></div>
        </section>

        <section className="contribute-section">
          <div className="contribute-label"><Camera size={18} /><span>SOURCE SLOT / 004</span></div>
          <div><h2>당신이 가진 장면을<br /><i>기록에 보태주세요.</i></h2><p>활동내역 이미지, 방송 캡처, 포스터와 영상 링크를 차례로 추가할 수 있도록 비워 둔 자리입니다.</p></div>
          <button type="button" className="outline-button" onClick={() => showNotice("SOURCE DOSSIER가 아직 열리지 않았습니다.")}>SOURCE DOSSIER 열기 <ArrowUpRight size={15} /></button>
        </section>
      </main>

      <footer className="site-footer"><div className="footer-brand"><span className="brand-seal footer-seal"><img src={MARK_IMAGE} alt="" className="brand-mark" /><Mic2 size={11} /></span><span>K-COMEDY ARCHIVE</span></div><p>한국 코미디의 순간을 기수와 장면으로 기록합니다.</p><div className="footer-meta"><span>BUILT FOR THE NEXT LAUGH</span><span>© 2026 K-CA</span></div></footer>
      {showTopButton && <button className="back-to-top" type="button" aria-label="페이지 맨 위로 이동" title="맨 위로" onClick={scrollToTop}><ArrowUp size={16} /><span>TOP</span></button>}
      {notice && <div className="notice" role="status"><Sparkles size={15} /> {notice}</div>}
    </div>
  );
}

function ProfileCard({ profile, onOpen }: { profile: Profile; onOpen: () => void }) {
  return <article className="profile-card"><div className="profile-card-visual"><div className="portrait-slot">{profile.imageStatus === "matched" && profile.imageUrl ? <img className="profile-card-image" src={profile.imageUrl} alt={`${profile.name} 프로필 이미지`} loading="lazy" /> : <div className="portrait-placeholder"><Mic2 size={42} /><span>PORTRAIT<br />SOURCE SLOT</span></div>}<span className="slot-corner">{profile.imageStatus === "matched" ? "PUBLIC / IMG" : "IMG / SLOT"}</span></div><div className="card-vertical">K-COMEDY / ARCHIVE</div></div><div className="profile-card-copy"><div className="profile-card-top"><div><p className="eyebrow"><span className="eyebrow-line" /> {profile.tags[0]} / {profile.tags[1]}</p><h3>{profile.name}</h3><p className="profile-role">{profile.role}</p></div><span className="profile-number">001</span></div><p className="profile-note">{profile.note}</p><div className="tag-row">{profile.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><button type="button" className="text-arrow-button" onClick={onOpen}>상세 프로필 열기 <ArrowUpRight size={16} /></button></div></article>;
}

function EmptyArchive({ broadcaster, generation, onRequest }: { broadcaster: BroadcasterId; generation: number | "all"; onRequest: () => void }) {
  return <div className="empty-archive"><div className="empty-file-icon"><FileText size={27} /></div><div><p className="eyebrow"><span className="eyebrow-line" /> SOURCE SLOT / {broadcaster === "all" ? "ALL" : broadcaster.toUpperCase()} / {generation === "all" ? "ALL" : `${generation}G`}</p><h3>아직 펼쳐지지 않은 기록</h3><p>이 기수의 프로필, 활동내역, 유행어 자료를<br />추가할 수 있는 빈 아카이브 슬롯입니다.</p><button type="button" className="text-arrow-button" onClick={onRequest}>자료 입력 안내 <ArrowUpRight size={16} /></button></div><span className="empty-code">NO DATA<br />YET</span></div>;
}

function ProfileDetail({ profile }: { profile: Profile }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const imageUrl = profile.imageUrl && failedImage !== profile.imageUrl ? profile.imageUrl : "";
  return <div className="detail-layout"><div className="detail-lead"><div className="detail-photo-slot">{imageUrl ? <img src={imageUrl} alt={`${profile.name} 프로필 이미지`} onError={() => setFailedImage(profile.imageUrl ?? "")} /> : <div className="photo-fallback"><Mic2 size={52} /><span>{profile.imageStatus === "matched" ? "IMAGE LOAD FAILED" : "PROFILE IMAGE\nSOURCE SLOT"}</span></div>}<small>{imageUrl ? "PUBLIC PROFILE IMAGE" : "4 : 5 PORTRAIT"}</small></div>{profile.imageSource && imageUrl && <a className="image-source" href={profile.imageSource} target="_blank" rel="noreferrer">IMAGE SOURCE ↗</a>}<div className="detail-lead-caption"><span>FIG. 03</span><span>{profile.name.toUpperCase()} / DOSSIER</span></div></div><div className="detail-content"><div className="detail-title-row"><div><span className="generation-chip">{profile.broadcaster === "other" ? "ETC" : profile.broadcaster.toUpperCase()} · {profile.generation ? `${profile.track} ${profile.generation}기` : profile.track}{profile.year && ` / ${profile.year}`}</span><h3>{profile.name}</h3><p>{profile.role} / {profile.note}</p></div><span className="detail-id">ID: KCA-001</span></div><div className="profile-facts"><div><span>생년월일</span><b>{profile.birthDate ?? "정보 확인 중"}</b></div><div><span>현재 나이</span><b>{profile.currentAge ? `${profile.currentAge}세` : "정보 확인 중"}</b></div><div><span>데뷔연도</span><b>{profile.debutYear ?? profile.recruitmentYear ?? "정보 확인 중"}</b></div><div><span>소속사</span><b>{profile.agency ?? "정보 확인 중"}</b></div><div className="wide"><span>주요 프로그램</span><b>{profile.programs.length ? profile.programs.join(" · ") : "정보 확인 중"}</b></div></div><div className="profile-extra"><span>소개</span><p>{profile.introduction ?? "공식 소개 자료 확인 중"}</p><div className="profile-links"><span>출처</span>{profile.sourceUrls.slice(0, 3).map((url) => <a key={url} href={url} target="_blank" rel="noreferrer">SOURCE ↗</a>)}</div>{profile.youtube && <a href={profile.youtube} target="_blank" rel="noreferrer">YouTube ↗</a>}{profile.instagram && <a href={profile.instagram} target="_blank" rel="noreferrer">Instagram ↗</a>}</div><div className="catchphrase-box"><div className="box-label"><Sparkles size={14} /> CATCHPHRASE / 유행어 상세</div><h4>“{profile.catchphrase}”</h4><p>{profile.catchphraseNote}</p><div className="input-hint">+ 방송 장면, 사용 시기, 캐릭터 설명을 함께 입력할 수 있습니다.</div></div><div className="activity-header"><div><span className="box-label"><Clock3 size={14} /> ACTIVITY LOG</span><h4>활동내역</h4></div><span className="activity-count">{String(profile.activities.length).padStart(2, "0")} ENTRIES</span></div><div className="activity-list">{profile.activities.map((activity) => <div className="activity-item" key={activity.year}><span className="activity-number">{activity.year}</span><div><h5>{activity.title}</h5><p>{activity.detail}</p></div><span className="activity-state">{activity.state}</span></div>)}</div><div className="activity-image-slot"><div><Camera size={21} /><span>ACTIVITY IMAGE SLOT</span></div><p>활동내역별 방송 캡처·포스터·현장 이미지를<br />하단에 보존할 수 있도록 비워 둔 영역입니다.</p><button type="button" aria-label="활동내역 이미지 추가 슬롯" onClick={() => window.alert("활동내역 이미지를 연결할 수 있는 슬롯입니다.")}><Plus size={18} /></button></div></div></div>;
}

function DetailEmpty() {
  return <div className="detail-empty"><span>PROFILE IMAGE / ACTIVITY / CATCHPHRASE</span><h3>선택한 기수의<br />상세 기록을 기다리고 있습니다.</h3><p>좌측 색인에서 등록된 기수를 선택하면<br />프로필과 활동내역이 이 자리에 펼쳐집니다.</p></div>;
}
