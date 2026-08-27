/* 방송 아카이브 뮤지엄: 왼쪽 색인 레일과 오른쪽 큐레이션 캔버스, 종이·커튼·녹화등의 대비를 유지한다. */
import { useMemo, useState } from "react";
import rosterData from "../data/roster.json";
import {
  Archive,
  ArrowDown,
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

type BroadcasterId = "all" | "sbs" | "kbs" | "mbc";

type Profile = {
  id: string;
  name: string;
  broadcaster: Exclude<BroadcasterId, "all">;
  generation: number;
  track: string;
  year: string;
  role: string;
  note: string;
  tags: string[];
  catchphrase: string;
  catchphraseNote: string;
  activities: { year: string; title: string; detail: string; state?: string }[];
};

const broadcasters: { id: BroadcasterId; label: string; short: string }[] = [
  { id: "all", label: "전체 방송사", short: "ALL" },
  { id: "sbs", label: "SBS", short: "SBS" },
  { id: "kbs", label: "KBS", short: "KBS" },
  { id: "mbc", label: "MBC", short: "MBC" },
];

const defaultActivities = (name: string, track: string) => [
  { year: "01", title: "공채·데뷔 기록", detail: `${track} 기수와 첫 활동 정보를 확인·입력하는 영역입니다.`, state: "SOURCE" },
  { year: "02", title: "대표 프로그램 기록", detail: `${name}의 프로그램명, 코너명, 방영 기간과 역할을 정리합니다.`, state: "SLOT" },
  { year: "03", title: "유행어·캐릭터 기록", detail: "유행어가 사용된 장면과 캐릭터의 맥락을 상세히 덧붙입니다.", state: "SLOT" },
];

const profiles: Profile[] = rosterData.records.map((record) => ({
  id: record.id,
  name: record.name,
  broadcaster: record.broadcaster as Exclude<BroadcasterId, "all">,
  generation: record.generation,
  track: record.track,
  year: record.year,
  role: "코미디언 · 방송인",
  note: "공개 자료 기준 · 실제 프로필 자료를 연결할 수 있습니다.",
  tags: [record.broadcaster.toUpperCase(), record.generation ? `${record.track} ${record.generation}기` : record.track, record.year || "YEAR TBD"],
  catchphrase: "대표 유행어 입력 슬롯",
  catchphraseNote: "방송에서 탄생한 대표 유행어와 캐릭터의 맥락을 기록해 주세요.",
  activities: defaultActivities(record.name, record.track),
}));

const generations = Array.from({ length: 34 }, (_, index) => index + 1);

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Home() {
  const [broadcaster, setBroadcaster] = useState<BroadcasterId>("all");
  const [generation, setGeneration] = useState(1);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [query, setQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [notice, setNotice] = useState("");

  const selectedProfiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return profiles.filter((profile) => {
      const broadcasterMatch = broadcaster === "all" || profile.broadcaster === broadcaster;
      const generationMatch = profile.generation === generation;
      const queryMatch = !normalizedQuery || [profile.name, profile.role, ...profile.tags, profile.catchphrase].join(" ").toLowerCase().includes(normalizedQuery);
      return broadcasterMatch && generationMatch && queryMatch;
    });
  }, [broadcaster, generation, query]);

  const activeProfile = selectedProfiles.find((profile) => profile.id === selectedProfileId) ?? selectedProfiles[0];
  const activeBroadcaster = broadcasters.find((item) => item.id === broadcaster) ?? broadcasters[0];

  function chooseBroadcaster(id: BroadcasterId) {
    setBroadcaster(id);
    setGeneration(1);
    setSelectedProfileId("");
    setQuery("");
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
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
              {generations.map((item) => <button key={item} type="button" role="tab" aria-selected={generation === item} className={generation === item ? "generation-tab active" : "generation-tab"} onClick={() => setGeneration(item)}>{item}<sup>기</sup></button>)}
            </div>
            <div className="archive-intro">
              <div><p className="eyebrow"><span className="eyebrow-line" /> CURRENT SELECTION</p><h2>{activeBroadcaster.label} <span>/</span> {generation}기 기록</h2></div>
              <div className="archive-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, 유행어, 역할 검색" aria-label="프로필 검색" /></div>
            </div>
            {selectedProfiles.length > 0 ? <div className="profile-results"><div className="results-meta"><span>{selectedProfiles.length} RECORDS FOUND</span><span>SELECT A DOSSIER TO OPEN</span></div><div className="profile-results-grid">{selectedProfiles.map((profile) => <ProfileCard key={profile.id} profile={profile} onOpen={() => { setSelectedProfileId(profile.id); scrollToId("profile"); }} />)}</div></div> : <EmptyArchive broadcaster={broadcaster} generation={generation} onRequest={() => showNotice("이 기수는 자료 입력을 기다리고 있습니다.")} />}
          </div>
        </section>

        <section className="archive-note-section">
          <div className="note-image-wrap"><div className="material-still-life" role="img" aria-label="방송 큐시트와 카세트가 놓인 아카이브 책상"><div className="still-paper"><span>Q-SHEET</span><i>ON AIR</i><b>001</b></div><div className="still-tape"><span>ARCHIVE</span></div><div className="still-button" /></div><span className="image-index">FIG. 02 / SOURCE DESK / ACCESSION 004</span></div>
          <div className="note-copy"><p className="eyebrow"><span className="eyebrow-line" /> CURATOR'S NOTE</p><h2>한 사람의 이력은<br /><i>한 시대의 편성표</i>입니다.</h2><p>프로그램 제목만 남기는 대신, 그 사람이 어떤 무대에서 어떤 말투와 캐릭터로 기억되었는지 기록합니다. 이미지와 대본, 유행어의 맥락이 모이면 코미디의 역사가 됩니다.</p><button className="text-arrow-button" type="button" onClick={() => showNotice("큐레이터 노트는 다음 업데이트에서 공개됩니다.")}>아카이브 작성 원칙 <ArrowUpRight size={16} /></button></div>
          <div className="vertical-index">K-CA / NOTE / 2026</div>
        </section>

        <section id="profile" className="profile-section content-anchor">
          <div className="section-heading-row"><div><p className="eyebrow"><span className="eyebrow-line" /> PROFILE / {activeProfile ? `${activeProfile.broadcaster.toUpperCase()} ${activeProfile.generation || "SPECIAL"}G` : "EMPTY SLOT"}</p><h2>한 사람의<br /><i>웃음 기록</i></h2></div><div className="section-side-note"><span>DETAIL DOSSIER</span><br />프로필 이미지 · 활동내역 ·<br />유행어 상세 기술</div></div>
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
      {notice && <div className="notice" role="status"><Sparkles size={15} /> {notice}</div>}
    </div>
  );
}

function ProfileCard({ profile, onOpen }: { profile: Profile; onOpen: () => void }) {
  return <article className="profile-card"><div className="profile-card-visual"><div className="portrait-slot"><div className="portrait-placeholder"><Mic2 size={42} /><span>PORTRAIT<br />SOURCE SLOT</span></div><span className="slot-corner">IMG / 001</span></div><div className="card-vertical">K-COMEDY / ARCHIVE</div></div><div className="profile-card-copy"><div className="profile-card-top"><div><p className="eyebrow"><span className="eyebrow-line" /> {profile.tags[0]} / {profile.tags[1]}</p><h3>{profile.name}</h3><p className="profile-role">{profile.role}</p></div><span className="profile-number">001</span></div><p className="profile-note">{profile.note}</p><div className="tag-row">{profile.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><button type="button" className="text-arrow-button" onClick={onOpen}>상세 프로필 열기 <ArrowUpRight size={16} /></button></div></article>;
}

function EmptyArchive({ broadcaster, generation, onRequest }: { broadcaster: BroadcasterId; generation: number; onRequest: () => void }) {
  return <div className="empty-archive"><div className="empty-file-icon"><FileText size={27} /></div><div><p className="eyebrow"><span className="eyebrow-line" /> SOURCE SLOT / {broadcaster === "all" ? "ALL" : broadcaster.toUpperCase()} / {generation}G</p><h3>아직 펼쳐지지 않은 기록</h3><p>이 기수의 프로필, 활동내역, 유행어 자료를<br />추가할 수 있는 빈 아카이브 슬롯입니다.</p><button type="button" className="text-arrow-button" onClick={onRequest}>자료 입력 안내 <ArrowUpRight size={16} /></button></div><span className="empty-code">NO DATA<br />YET</span></div>;
}

function ProfileDetail({ profile }: { profile: Profile }) {
  return <div className="detail-layout"><div className="detail-lead"><div className="detail-photo-slot"><Mic2 size={52} /><span>PROFILE IMAGE<br />SOURCE SLOT</span><small>4 : 5 PORTRAIT</small></div><div className="detail-lead-caption"><span>FIG. 03</span><span>{profile.name.toUpperCase()} / DOSSIER</span></div></div><div className="detail-content"><div className="detail-title-row"><div><span className="generation-chip">{profile.broadcaster.toUpperCase()} · {profile.track} {profile.generation || "특별"}기{profile.year && ` / ${profile.year}`}</span><h3>{profile.name}</h3><p>{profile.role} / {profile.note}</p></div><span className="detail-id">ID: KCA-001</span></div><div className="catchphrase-box"><div className="box-label"><Sparkles size={14} /> CATCHPHRASE / 유행어 상세</div><h4>“{profile.catchphrase}”</h4><p>{profile.catchphraseNote}</p><div className="input-hint">+ 방송 장면, 사용 시기, 캐릭터 설명을 함께 입력할 수 있습니다.</div></div><div className="activity-header"><div><span className="box-label"><Clock3 size={14} /> ACTIVITY LOG</span><h4>활동내역</h4></div><span className="activity-count">{String(profile.activities.length).padStart(2, "0")} ENTRIES</span></div><div className="activity-list">{profile.activities.map((activity) => <div className="activity-item" key={activity.year}><span className="activity-number">{activity.year}</span><div><h5>{activity.title}</h5><p>{activity.detail}</p></div><span className="activity-state">{activity.state}</span></div>)}</div><div className="activity-image-slot"><div><Camera size={21} /><span>ACTIVITY IMAGE SLOT</span></div><p>활동내역별 방송 캡처·포스터·현장 이미지를<br />하단에 보존할 수 있도록 비워 둔 영역입니다.</p><button type="button" aria-label="활동내역 이미지 추가 슬롯" onClick={() => window.alert("활동내역 이미지를 연결할 수 있는 슬롯입니다.")}><Plus size={18} /></button></div></div></div>;
}

function DetailEmpty() {
  return <div className="detail-empty"><span>PROFILE IMAGE / ACTIVITY / CATCHPHRASE</span><h3>선택한 기수의<br />상세 기록을 기다리고 있습니다.</h3><p>좌측 색인에서 등록된 기수를 선택하면<br />프로필과 활동내역이 이 자리에 펼쳐집니다.</p></div>;
}
