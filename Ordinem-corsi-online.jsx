import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search, Play, Clock, Star, Users, FileText, Award, ChevronLeft, ChevronRight,
  Check, X, ArrowLeft, Volume2, Lock, Upload, RefreshCw, Link2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* PAYMENTS — talks to your own backend, which talks to Stripe.        */
/* The site never touches your bank account or Stripe secret key       */
/* directly — see /server in this project for that piece.             */
/* ------------------------------------------------------------------ */

// ⚠️ Sostituisci con l'URL del tuo backend una volta pubblicato
// (es. https://ordinem-backend.onrender.com)
const API_BASE = "https://luancer-learn-courses.onrender.com";

async function startCheckout({ courseId, title, price, lang }) {
  const res = await fetch(`${API_BASE}/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courseId, title, price, lang }),
  });
  if (!res.ok) throw new Error("checkout request failed");
  const data = await res.json();
  if (!data.url) throw new Error("no checkout url returned");
  window.location.href = data.url; // il cliente paga su Stripe, non sul nostro sito
}

/* ------------------------------------------------------------------ */
/* BRAND — colors sampled from the Luancer & Co. logo                  */
/* ------------------------------------------------------------------ */

const C = {
  bg: "#F1F6F1",
  bgAlt: "#E7F0E8",
  card: "#FFFFFF",
  sage50: "#EAF1EB",
  sage200: "#C9DACD",
  sage400: "#9FBBA8",
  sage500: "#84A491",
  sage600: "#6A8B77",
  sage700: "#4F6B5C",
  sage900: "#28362E",
  ink: "#13140F",
  muted: "#6B756E",
  border: "#D8E3DA",
};

function Logo({ size = "md" }) {
  const big = size === "lg";
  return (
    <div className="flex items-center gap-3">
      <span
        className="font-serif uppercase"
        style={{ color: C.sage600, letterSpacing: "0.16em", fontSize: big ? 22 : 14 }}
      >
        Luancer & Co.
      </span>
      <div style={{ width: 1, height: big ? 30 : 22, background: C.border }} />
      <div className="flex flex-col items-start leading-none gap-0.5">
        <span style={{ fontSize: big ? 11 : 9, fontWeight: 700, letterSpacing: "0.12em", color: C.ink }} className="uppercase">
          Courses
        </span>
        <span style={{ fontSize: big ? 30 : 20, fontWeight: 800, letterSpacing: "0.01em", color: C.ink }} className="uppercase">
          Learn
        </span>
      </div>
    </div>
  );
}

function Button({ children, variant = "primary", className = "", disabled, ...props }) {
  const styles = {
    primary: { background: C.ink, color: "#fff" },
    accent: { background: C.sage600, color: "#fff" },
    ghost: { background: "transparent", color: C.ink, border: `1px solid ${C.border}` },
  };
  return (
    <button
      {...props}
      disabled={disabled}
      style={{ ...styles[variant], opacity: disabled ? 0.6 : 1, cursor: disabled ? "default" : "pointer" }}
      className={`px-5 py-3 rounded-md text-sm font-medium transition-opacity ${disabled ? "" : "hover:opacity-85"} ${className}`}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* DATA GENERATION                                                     */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  "Sviluppo Web", "Sviluppo Mobile", "Data Science e AI", "Cybersecurity",
  "Cloud Computing", "Marketing Digitale", "Business e Management",
  "Finanza e Investimenti", "Design Grafico", "UX/UI Design", "Fotografia",
  "Video Editing e Produzione", "Musica e Produzione Audio",
  "Scrittura e Content Creation", "Psicologia e Crescita Personale",
  "Salute e Fitness", "Cucina e Enogastronomia", "Ingegneria",
  "Architettura e Interior Design", "Diritto e Consulenza Legale",
];

const SUBJECT_STEMS = [
  "Fondamenti", "Guida Completa", "Dalla Teoria alla Pratica", "Tecniche Avanzate",
  "Progetti Reali", "Strumenti e Piattaforme", "Percorso Professionale",
  "Casi di Studio", "Strategie di Crescita", "Automazione e Ottimizzazione",
  "Metodologie Moderne", "Applicazioni sul Campo", "Certificazione Pratica",
  "Analisi e Misurazione", "Innovazione e Tendenze",
];

const LEVELS = [
  { name: "Beginner", hours: [10, 15], price: [50, 80], premium: false },
  { name: "Intermediate", hours: [16, 25], price: [85, 130], premium: false },
  { name: "Advanced", hours: [26, 40], price: [135, 200], premium: false },
  { name: "Professional", hours: [41, 55], price: [205, 280], premium: false },
  { name: "All-in-One", hours: [56, 70], price: [285, 360], premium: true },
  { name: "Master", hours: [71, 85], price: [365, 440], premium: true },
  { name: "MBA", hours: [86, 100], price: [445, 500], premium: true },
];

function seeded(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function within(seed, min, max) {
  return Math.round(min + seeded(seed) * (max - min));
}

function buildCourses() {
  const list = [];
  let id = 0;
  CATEGORIES.forEach((cat) => {
    SUBJECT_STEMS.forEach((stem) => {
      LEVELS.forEach((lvl) => {
        id += 1;
        const seed = id * 7.919;
        const hours = within(seed, lvl.hours[0], lvl.hours[1]);
        const price = within(seed + 1, lvl.price[0], lvl.price[1]);
        const rating = (3.8 + seeded(seed + 2) * 1.2).toFixed(1);
        const students = within(seed + 3, 40, 6200);
        const modules = Math.max(4, Math.round(hours / 3));
        list.push({
          id, title: `${stem}: ${cat} (${lvl.name})`, category: cat, level: lvl.name, premium: lvl.premium,
          hours, price, rating, students, modules,
          description: `Un percorso ${lvl.name.toLowerCase()} pensato per chi vuole padroneggiare ${cat.toLowerCase()} in modo strutturato: ogni modulo unisce una lezione video e slide di sintesi, curate per restare utili nel tempo.`,
        });
      });
    });
  });
  return list;
}

// languages the course content itself can be delivered in — chosen at purchase
const COURSE_LANGUAGES = [
  ["Italiano", "🇮🇹"], ["English", "🇬🇧"], ["Español", "🇪🇸"], ["Français", "🇫🇷"],
  ["Deutsch", "🇩🇪"], ["Português", "🇵🇹"], ["中文", "🇨🇳"], ["日本語", "🇯🇵"],
  ["العربية", "🇸🇦"], ["हिन्दी", "🇮🇳"], ["Русский", "🇷🇺"], ["한국어", "🇰🇷"],
].map(([name, flag], i) => ({ code: `l${i}`, name, flag }));

const LANGUAGES = [
  ["Inglese", "🇬🇧"], ["Spagnolo", "🇪🇸"], ["Francese", "🇫🇷"], ["Tedesco", "🇩🇪"],
  ["Portoghese", "🇵🇹"], ["Portoghese Brasiliano", "🇧🇷"], ["Olandese", "🇳🇱"],
  ["Svedese", "🇸🇪"], ["Norvegese", "🇳🇴"], ["Danese", "🇩🇰"], ["Finlandese", "🇫🇮"],
  ["Islandese", "🇮🇸"], ["Polacco", "🇵🇱"], ["Ceco", "🇨🇿"], ["Slovacco", "🇸🇰"],
  ["Ungherese", "🇭🇺"], ["Rumeno", "🇷🇴"], ["Bulgaro", "🇧🇬"], ["Greco", "🇬🇷"],
  ["Russo", "🇷🇺"], ["Ucraino", "🇺🇦"], ["Serbo", "🇷🇸"], ["Croato", "🇭🇷"],
  ["Sloveno", "🇸🇮"], ["Albanese", "🇦🇱"], ["Turco", "🇹🇷"], ["Arabo", "🇸🇦"],
  ["Ebraico", "🇮🇱"], ["Persiano", "🇮🇷"], ["Hindi", "🇮🇳"], ["Urdu", "🇵🇰"],
  ["Bengalese", "🇧🇩"], ["Punjabi", "🇮🇳"], ["Tamil", "🇮🇳"], ["Telugu", "🇮🇳"],
  ["Gujarati", "🇮🇳"], ["Marathi", "🇮🇳"], ["Nepalese", "🇳🇵"], ["Singalese", "🇱🇰"],
  ["Cinese Mandarino", "🇨🇳"], ["Cinese Cantonese", "🇭🇰"], ["Giapponese", "🇯🇵"],
  ["Coreano", "🇰🇷"], ["Vietnamita", "🇻🇳"], ["Thailandese", "🇹🇭"],
  ["Indonesiano", "🇮🇩"], ["Malese", "🇲🇾"], ["Filippino", "🇵🇭"], ["Khmer", "🇰🇭"],
  ["Lao", "🇱🇦"], ["Birmano", "🇲🇲"], ["Mongolo", "🇲🇳"], ["Swahili", "🇰🇪"],
  ["Amarico", "🇪🇹"], ["Zulu", "🇿🇦"], ["Afrikaans", "🇿🇦"], ["Yoruba", "🇳🇬"],
  ["Igbo", "🇳🇬"], ["Hausa", "🇳🇬"], ["Somalo", "🇸🇴"], ["Malgascio", "🇲🇬"],
  ["Georgiano", "🇬🇪"], ["Armeno", "🇦🇲"], ["Azero", "🇦🇿"], ["Kazako", "🇰🇿"],
  ["Uzbeko", "🇺🇿"], ["Curdo", "🇮🇶"], ["Pashto", "🇦🇫"], ["Tagico", "🇹🇯"],
  ["Estone", "🇪🇪"], ["Lettone", "🇱🇻"], ["Lituano", "🇱🇹"], ["Bielorusso", "🇧🇾"],
  ["Macedone", "🇲🇰"], ["Bosniaco", "🇧🇦"], ["Maltese", "🇲🇹"], ["Gallese", "🏴"],
  ["Irlandese", "🇮🇪"], ["Basco", "🇪🇸"],
  ["Catalano", "🇪🇸"], ["Yiddish", "🇮🇱"], ["Esperanto", "🌍"],
  ["Haitiano Creolo", "🇭🇹"],
  ["Quechua", "🇵🇪"], ["Guarani", "🇵🇾"], ["Nahuatl", "🇲🇽"], ["Maori", "🇳🇿"],
  ["Samoano", "🇼🇸"], ["Tibetano", "🏔️"],
  ["Sindhi", "🇵🇰"], ["Malayalam", "🇮🇳"], ["Kannada", "🇮🇳"], ["Oriya", "🇮🇳"],
  ["Assamese", "🇮🇳"], ["Cebuano", "🇵🇭"], ["Tagalog", "🇵🇭"], ["Xhosa", "🇿🇦"],
  ["Sesotho", "🇱🇸"], ["Wolof", "🇸🇳"], ["Lingala", "🇨🇩"],
].map(([name, flag], i) => ({
  id: i + 1, name, flag,
  tutor: ["Elena", "Marco", "Sofia", "Diego", "Anya", "Kenji", "Leila", "Omar", "Priya", "Noah"][i % 10],
  learners: within(i * 3.3 + 1, 300, 48000),
}));

/* ------------------------------------------------------------------ */
/* VIDEO EMBED HELPERS — YouTube / Vimeo link -> embeddable URL        */
/* ------------------------------------------------------------------ */

function parseVideoUrl(input) {
  try {
    const url = new URL(input.trim());
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      if (id) return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${id}` };
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v");
        if (id) return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${id}` };
      }
      if (url.pathname.startsWith("/embed/")) return { type: "youtube", embedUrl: input.trim() };
      if (url.pathname.startsWith("/shorts/")) {
        const id = url.pathname.split("/")[2];
        if (id) return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${id}` };
      }
    }
    if (host === "vimeo.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      const id = parts[0];
      if (id && /^\d+$/.test(id)) return { type: "vimeo", embedUrl: `https://player.vimeo.com/video/${id}` };
    }
    if (host === "player.vimeo.com") return { type: "vimeo", embedUrl: input.trim() };
  } catch (e) { /* not a valid URL */ }
  return null;
}

/* ------------------------------------------------------------------ */
/* REAL VIDEO PLAYER — YouTube/Vimeo embed link, or a local file       */
/* ------------------------------------------------------------------ */

function VideoPlayer({ resetKey, caption }) {
  const [mode, setMode] = useState("link"); // link | file
  const [embed, setEmbed] = useState(null); // { type, embedUrl }
  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState(false);
  const inputRef = useRef(null);

  // switching lesson/course clears whatever was loaded
  useEffect(() => {
    setEmbed(null);
    setFileUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setFileName("");
    setLinkInput("");
    setLinkError(false);
    setMode("link");
  }, [resetKey]);

  useEffect(() => () => { if (fileUrl) URL.revokeObjectURL(fileUrl); }, [fileUrl]);

  function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setEmbed(null);
  }

  function submitLink() {
    const parsed = parseVideoUrl(linkInput);
    if (!parsed) { setLinkError(true); return; }
    setLinkError(false);
    setEmbed(parsed);
    setFileUrl(null);
  }

  function reset() {
    setEmbed(null);
    setFileUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setFileName("");
    setLinkInput("");
    setLinkError(false);
  }

  const loaded = embed || fileUrl;

  if (!loaded) {
    return (
      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <div className="flex" style={{ borderBottom: `1px solid ${C.border}` }}>
          <button
            onClick={() => setMode("link")}
            className="flex-1 text-xs font-medium py-2 inline-flex items-center justify-center gap-1.5"
            style={mode === "link" ? { color: C.ink, background: C.bgAlt } : { color: C.muted }}
          >
            <Link2 size={13} /> Link YouTube o Vimeo
          </button>
          <button
            onClick={() => setMode("file")}
            className="flex-1 text-xs font-medium py-2 inline-flex items-center justify-center gap-1.5"
            style={mode === "file" ? { color: C.ink, background: C.bgAlt } : { color: C.muted }}
          >
            <Upload size={13} /> File locale
          </button>
        </div>

        {mode === "link" ? (
          <div className="aspect-video flex flex-col items-center justify-center gap-3 px-8" style={{ background: C.bg }}>
            <Link2 size={24} style={{ color: C.sage600 }} />
            <p className="text-sm font-medium text-center" style={{ color: C.ink }}>Incolla il link del video</p>
            <div className="w-full max-w-xs">
              <input
                value={linkInput}
                onChange={(e) => { setLinkInput(e.target.value); setLinkError(false); }}
                onKeyDown={(e) => e.key === "Enter" && submitLink()}
                placeholder="https://youtube.com/watch?v=..."
                style={{ border: `1px solid ${linkError ? "#C24444" : C.border}`, background: C.card }}
                className="w-full px-3 py-2 rounded text-sm focus:outline-none"
              />
              {linkError && <p className="text-xs mt-1.5" style={{ color: "#C24444" }}>Link non valido: usa un link YouTube o Vimeo</p>}
            </div>
            <button onClick={submitLink} style={{ background: C.ink, color: "#fff" }} className="px-4 py-2 rounded text-sm font-medium hover:opacity-85">
              Carica video
            </button>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current && inputRef.current.click()}
            style={{ background: C.bgAlt }}
            className="aspect-video flex flex-col items-center justify-center gap-2 cursor-pointer text-center px-6"
          >
            <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/ogg" className="hidden" onChange={handleFile} />
            <Upload size={24} style={{ color: C.sage600 }} />
            <p className="text-sm font-medium" style={{ color: C.ink }}>Carica il video di questa lezione</p>
            <p className="text-xs" style={{ color: C.muted }}>MP4, WebM o Ogg — resta caricato solo in questa sessione del browser</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "#000" }}>
      {embed ? (
        <iframe
          src={embed.embedUrl}
          className="w-full aspect-video block"
          style={{ border: 0 }}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={caption || "video"}
        />
      ) : (
        <video src={fileUrl} controls className="w-full aspect-video block" />
      )}
      <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs" style={{ background: C.sage900, color: C.sage200 }}>
        <span className="truncate">
          {caption ? `${caption} · ` : ""}
          {embed ? (embed.type === "youtube" ? "YouTube" : "Vimeo") : fileName}
        </span>
        <button onClick={reset} className="inline-flex items-center gap-1 shrink-0 hover:underline">
          <RefreshCw size={12} /> Cambia video
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SMALL UI PIECES                                                     */
/* ------------------------------------------------------------------ */

function LevelBadge({ level, premium }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium"
      style={premium ? { background: C.ink, color: C.sage200 } : { background: C.sage50, color: C.sage700 }}
    >
      {level}
    </span>
  );
}

function Stars({ rating }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm" style={{ color: C.sage700 }}>
      <Star size={14} style={{ fill: C.sage500, color: C.sage500 }} />
      <span className="font-medium">{rating}</span>
    </span>
  );
}

function CourseCard({ course, onOpen }) {
  return (
    <button
      onClick={() => onOpen(course.id)}
      className="text-left rounded-lg p-4 flex flex-col gap-3 transition-colors"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs" style={{ color: C.muted }}>{course.category}</span>
        <LevelBadge level={course.level} premium={course.premium} />
      </div>
      <h3 className="font-serif text-lg leading-snug" style={{ color: C.ink }}>{course.title}</h3>
      <div className="flex items-center gap-3 text-sm" style={{ color: C.muted }}>
        <span className="inline-flex items-center gap-1"><Clock size={14} />{course.hours}h</span>
        <span className="inline-flex items-center gap-1"><Users size={14} />{course.students.toLocaleString("it-IT")}</span>
        <Stars rating={course.rating} />
      </div>
      <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${C.bgAlt}` }}>
        <span className="inline-flex items-center gap-2 text-xs" style={{ color: C.muted }}>
          <Play size={13} /> video <FileText size={13} className="ml-1" /> slide
        </span>
        <span className="font-serif text-lg" style={{ color: C.ink }}>{course.price}€</span>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* PAGES                                                                */
/* ------------------------------------------------------------------ */

function Header({ view, setView }) {
  const nav = [
    { key: "home", label: "Home" },
    { key: "catalog", label: "Corsi" },
    { key: "languages", label: "Lingue" },
  ];
  return (
    <header className="sticky top-0 z-20 backdrop-blur" style={{ background: `${C.bg}F2`, borderBottom: `1px solid ${C.border}` }}>
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <button onClick={() => setView({ name: "home" })}>
          <Logo />
        </button>
        <nav className="hidden sm:flex items-center gap-7">
          {nav.map((n) => (
            <button
              key={n.key}
              onClick={() => setView({ name: n.key })}
              className="text-sm"
              style={{ color: view.name === n.key ? C.ink : C.muted, fontWeight: view.name === n.key ? 600 : 400 }}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <Button variant="primary" className="!px-4 !py-2">Accedi</Button>
      </div>
    </header>
  );
}

function HomePage({ setView, courses }) {
  const featuredCats = CATEGORIES.slice(0, 8);
  return (
    <div>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <p className="text-sm mb-4" style={{ color: C.sage600 }}>2.100 corsi · 20 discipline · 100 lingue da imparare</p>
        <h1 className="font-serif leading-tight mb-6 max-w-2xl" style={{ color: C.ink, fontSize: "clamp(2.2rem, 5vw, 3.4rem)" }}>
          Impara qualcosa di nuovo, un modulo alla volta.
        </h1>
        <p className="text-lg mb-8 max-w-xl" style={{ color: C.muted }}>
          Videocorsi e slide di sintesi per ogni livello, da beginner a MBA, in qualsiasi lingua tu voglia seguirli.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => setView({ name: "catalog" })}>Esplora i corsi</Button>
          <Button variant="ghost" onClick={() => setView({ name: "languages" })}>Impara una lingua</Button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-serif text-2xl" style={{ color: C.ink }}>Discipline</h2>
          <button onClick={() => setView({ name: "catalog" })} className="text-sm hover:underline" style={{ color: C.sage600 }}>Vedi tutte</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {featuredCats.map((c) => (
            <button
              key={c}
              onClick={() => setView({ name: "catalog", category: c })}
              className="text-left p-4 rounded-lg transition-colors"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <p className="font-medium text-sm" style={{ color: C.ink }}>{c}</p>
              <p className="text-xs mt-1" style={{ color: C.muted }}>{SUBJECT_STEMS.length * LEVELS.length} corsi</p>
            </button>
          ))}
        </div>
      </section>

      <section style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="font-serif text-2xl mb-6" style={{ color: C.ink }}>In evidenza</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.slice(0, 6).map((c) => (
              <CourseCard key={c.id} course={c} onOpen={(id) => setView({ name: "course", id })} />
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm mb-2" style={{ color: C.sage600 }}>Nuova sezione</p>
            <h2 className="font-serif text-2xl mb-4" style={{ color: C.ink }}>100 lingue, insegnate da chi le parla davvero</h2>
            <p className="mb-6 max-w-md" style={{ color: C.muted }}>
              Ogni lezione è un video di un madrelingua, seguito da esercizi rapidi in stile Duolingo per fissare quello che hai appena visto.
            </p>
            <Button variant="primary" onClick={() => setView({ name: "languages" })}>Scegli una lingua</Button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {LANGUAGES.slice(0, 16).map((l) => (
              <button
                key={l.id}
                onClick={() => setView({ name: "lesson", langId: l.id })}
                className="aspect-square rounded-lg flex flex-col items-center justify-center gap-1"
                style={{ background: C.card, border: `1px solid ${C.border}` }}
              >
                <span className="text-xl">{l.flag}</span>
                <span className="text-[10px] text-center px-1 leading-tight" style={{ color: C.muted }}>{l.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function CatalogPage({ courses, setView, initialCategory }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory || "");
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);
  const perPage = 24;

  const filtered = useMemo(() => {
    let list = courses.filter((c) => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (category && c.category !== category) return false;
      if (level && c.level !== level) return false;
      return true;
    });
    if (sort === "priceAsc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "priceDesc") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    else list = [...list].sort((a, b) => b.students - a.students);
    return list;
  }, [courses, search, category, level, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const shown = filtered.slice((page - 1) * perPage, page * perPage);
  const inputStyle = { border: `1px solid ${C.border}`, background: C.card };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="font-serif text-3xl mb-1" style={{ color: C.ink }}>Catalogo corsi</h1>
      <p className="mb-8" style={{ color: C.muted }}>{filtered.length.toLocaleString("it-IT")} corsi trovati</p>

      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        <aside className="space-y-6">
          <div>
            <label className="text-xs mb-2 block" style={{ color: C.muted }}>Cerca</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5" style={{ color: C.muted }} />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Titolo del corso"
                style={inputStyle}
                className="w-full pl-9 pr-3 py-2 rounded text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs mb-2 block" style={{ color: C.muted }}>Disciplina</label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              style={inputStyle}
              className="w-full px-3 py-2 rounded text-sm"
            >
              <option value="">Tutte</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs mb-2 block" style={{ color: C.muted }}>Livello</label>
            <div className="space-y-1.5">
              <button
                onClick={() => { setLevel(""); setPage(1); }}
                style={level === "" ? { background: C.ink, color: "#fff" } : { color: C.muted }}
                className="block w-full text-left px-2 py-1.5 rounded text-sm"
              >
                Tutti i livelli
              </button>
              {LEVELS.map((l) => (
                <button
                  key={l.name}
                  onClick={() => { setLevel(l.name); setPage(1); }}
                  style={level === l.name ? { background: C.ink, color: "#fff" } : { color: C.muted }}
                  className="block w-full text-left px-2 py-1.5 rounded text-sm"
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm" style={{ color: C.muted }}>Pagina {page} di {totalPages}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={inputStyle} className="px-3 py-1.5 rounded text-sm">
              <option value="popular">Più popolari</option>
              <option value="rating">Voto più alto</option>
              <option value="priceAsc">Prezzo crescente</option>
              <option value="priceDesc">Prezzo decrescente</option>
            </select>
          </div>

          {shown.length === 0 ? (
            <div className="text-center py-20" style={{ color: C.muted }}>Nessun corso corrisponde ai filtri scelti.</div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {shown.map((c) => (
                <CourseCard key={c.id} course={c} onOpen={(id) => setView({ name: "course", id })} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-10">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} style={{ border: `1px solid ${C.border}` }} className="p-2 rounded disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm" style={{ color: C.muted }}>{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} style={{ border: `1px solid ${C.border}` }} className="p-2 rounded disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CourseDetailPage({ course, setView, initialEnrolledLang, paymentCanceled }) {
  const [tab, setTab] = useState("programma");
  const [courseLang, setCourseLang] = useState(initialEnrolledLang || null);
  const [langError, setLangError] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [payError, setPayError] = useState(false);

  if (!course) return null;
  const modulesList = Array.from({ length: course.modules }, (_, i) => ({
    n: i + 1,
    title: `Modulo ${i + 1} — ${SUBJECT_STEMS[i % SUBJECT_STEMS.length]}`,
    minutes: Math.round((course.hours * 60) / course.modules),
  }));

  async function handleEnroll() {
    if (!courseLang) { setLangError(true); return; }
    setLangError(false);
    setPayError(false);
    setCheckingOut(true);
    try {
      await startCheckout({ courseId: course.id, title: course.title, price: course.price, lang: courseLang });
      // se tutto va bene il browser viene reindirizzato a Stripe qui sopra:
      // il codice sotto non viene quasi mai raggiunto.
    } catch (e) {
      setPayError(true);
      setCheckingOut(false);
    }
  }

  return (
    <div>
      <div style={{ background: C.bgAlt, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-5xl mx-auto px-6 py-12">
          <button onClick={() => setView({ name: "catalog" })} className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: C.muted }}>
            <ArrowLeft size={15} /> Torna al catalogo
          </button>
          <p className="text-sm mb-2" style={{ color: C.sage600 }}>{course.category}</p>
          <h1 className="font-serif text-3xl md:text-4xl mb-4 max-w-2xl" style={{ color: C.ink }}>{course.title}</h1>
          <p className="max-w-xl mb-6" style={{ color: C.muted }}>{course.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: C.muted }}>
            <LevelBadge level={course.level} premium={course.premium} />
            <span className="inline-flex items-center gap-1"><Clock size={14} />{course.hours} ore</span>
            <span className="inline-flex items-center gap-1"><Users size={14} />{course.students.toLocaleString("it-IT")} iscritti</span>
            <Stars rating={course.rating} />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-[1fr_320px] gap-10">
        <div>
          <div className="flex gap-6 mb-6" style={{ borderBottom: `1px solid ${C.border}` }}>
            {["programma", "obiettivi", "recensioni"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="pb-3 text-sm capitalize"
                style={tab === t ? { borderBottom: `2px solid ${C.ink}`, color: C.ink, fontWeight: 600 } : { color: C.muted }}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "programma" && (
            <div>
              <p className="text-xs mb-2" style={{ color: C.muted }}>Anteprima — Modulo 1</p>
              <VideoPlayer resetKey={course.id} caption={modulesList[0]?.title} />
              <ul className="space-y-2 mt-4">
              {modulesList.map((m) => (
                <li key={m.n} className="flex items-center justify-between p-3 rounded" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs w-6" style={{ color: C.muted }}>{m.n}</span>
                    <div>
                      <p className="text-sm" style={{ color: C.ink }}>{m.title}</p>
                      <p className="text-xs inline-flex items-center gap-2 mt-0.5" style={{ color: C.muted }}>
                        <Play size={12} /> video <FileText size={12} className="ml-1" /> slide · {m.minutes} min
                      </p>
                    </div>
                  </div>
                  {m.n === 1 ? <Play size={16} style={{ color: C.sage600 }} /> : <Lock size={14} style={{ color: C.sage200 }} />}
                </li>
              ))}
              </ul>
            </div>
          )}

          {tab === "obiettivi" && (
            <ul className="space-y-3 text-sm" style={{ color: C.ink }}>
              {["Costruire basi solide e verificabili con esercizi pratici", "Applicare quanto imparato a un progetto reale, non solo teorico", "Ottenere un attestato di completamento spendibile nel CV", "Accedere agli aggiornamenti futuri del corso senza costi aggiuntivi"].map((g, i) => (
                <li key={i} className="flex gap-2"><Check size={16} style={{ color: C.sage600 }} className="shrink-0 mt-0.5" />{g}</li>
              ))}
            </ul>
          )}

          {tab === "recensioni" && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: C.ink }}>Studente {i}</span>
                    <Stars rating={(4 + seeded(i * 12.3)).toFixed(1)} />
                  </div>
                  <p className="text-sm" style={{ color: C.muted }}>Corso ben strutturato, slide chiare e video che vanno dritti al punto.</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="h-fit p-5 rounded-lg sticky top-24" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <p className="font-serif text-3xl mb-5" style={{ color: C.ink }}>{course.price}€</p>

          {!enrolled ? (
            <>
              {paymentCanceled && (
                <p className="text-xs mb-3 px-3 py-2 rounded" style={{ background: "#FBEAEA", color: "#8C2E2E" }}>
                  Pagamento annullato. Puoi riprovare quando vuoi.
                </p>
              )}
              <p className="text-xs mb-2" style={{ color: C.muted }}>Lingua del corso</p>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {COURSE_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setCourseLang(l.code); setLangError(false); }}
                    title={l.name}
                    style={
                      courseLang === l.code
                        ? { background: C.ink, borderColor: C.ink }
                        : { background: C.bg, borderColor: langError ? "#C24444" : C.border }
                    }
                    className="aspect-square rounded flex items-center justify-center text-base"
                  >
                    {l.flag}
                  </button>
                ))}
              </div>
              {courseLang ? (
                <p className="text-xs mb-4" style={{ color: C.sage700 }}>
                  {COURSE_LANGUAGES.find((l) => l.code === courseLang)?.name} selezionato
                </p>
              ) : (
                <p className="text-xs mb-4" style={{ color: langError ? "#C24444" : C.muted }}>
                  {langError ? "Seleziona una lingua per continuare" : "Scegli in che lingua seguire video e slide"}
                </p>
              )}
              {payError && (
                <p className="text-xs mb-3" style={{ color: "#C24444" }}>
                  Non è stato possibile avviare il pagamento. Riprova tra poco.
                </p>
              )}
              <Button variant="primary" className="w-full" onClick={handleEnroll} disabled={checkingOut}>
                {checkingOut ? "Reindirizzamento a Stripe…" : "Iscriviti al corso"}
              </Button>
              <p className="text-xs text-center mt-2" style={{ color: C.muted }}>Pagamento sicuro gestito da Stripe</p>
            </>
          ) : (
            <div className="text-center py-2">
              <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: C.sage50 }}>
                <Check size={20} style={{ color: C.sage700 }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: C.ink }}>Iscrizione confermata</p>
              <p className="text-xs" style={{ color: C.muted }}>
                Corso in {COURSE_LANGUAGES.find((l) => l.code === courseLang)?.name}
              </p>
            </div>
          )}

          <ul className="text-sm space-y-2 pt-4 mt-4" style={{ color: C.ink, borderTop: `1px solid ${C.bgAlt}` }}>
            <li className="flex items-center gap-2"><Clock size={14} style={{ color: C.muted }} />{course.hours} ore di contenuti</li>
            <li className="flex items-center gap-2"><Play size={14} style={{ color: C.muted }} />{course.modules} video lezioni</li>
            <li className="flex items-center gap-2"><FileText size={14} style={{ color: C.muted }} />Slide scaricabili per modulo</li>
            <li className="flex items-center gap-2"><Award size={14} style={{ color: C.muted }} />Attestato finale</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

function LanguagesPage({ setView }) {
  const [search, setSearch] = useState("");
  const filtered = LANGUAGES.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="font-serif text-3xl mb-1" style={{ color: C.ink }}>100 lingue</h1>
      <p className="mb-6 max-w-xl" style={{ color: C.muted }}>Ogni lingua ha un tutor madrelingua in video e una serie di esercizi rapidi dopo ogni lezione, in stile Duolingo.</p>
      <div className="relative max-w-sm mb-8">
        <Search size={16} className="absolute left-3 top-2.5" style={{ color: C.muted }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca una lingua"
          style={{ border: `1px solid ${C.border}`, background: C.card }}
          className="w-full pl-9 pr-3 py-2 rounded text-sm focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((l) => (
          <button
            key={l.id}
            onClick={() => setView({ name: "lesson", langId: l.id })}
            className="text-left p-4 rounded-lg transition-colors"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <span className="text-2xl">{l.flag}</span>
            <p className="font-medium text-sm mt-2" style={{ color: C.ink }}>{l.name}</p>
            <p className="text-xs mt-0.5" style={{ color: C.muted }}>{l.learners.toLocaleString("it-IT")} studenti</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function LessonPage({ lang, setView }) {
  const [step, setStep] = useState("video");
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);

  if (!lang) return null;

  const questions = [
    { prompt: `Ascolta ${lang.tutor} nel video: quale saluto ha usato all'inizio?`, options: ["Il saluto informale", "Il saluto formale", "Una domanda", "Un ringraziamento"], correct: 0 },
    { prompt: "Che tono aveva la frase finale del video?", options: ["Una domanda", "Un'affermazione", "Un comando", "Un'esclamazione"], correct: 1 },
    { prompt: "Quale parola è stata ripetuta più spesso nel video?", options: ["La parola introdotta nel titolo della lezione", "Un numero", "Un nome proprio", "Un colore"], correct: 0 },
  ];
  const q = questions[qIndex];

  function selectAnswer(i) {
    setSelected(i);
    if (i === q.correct) setCorrectCount((c) => c + 1);
  }
  function next() {
    if (qIndex < questions.length - 1) { setQIndex((i) => i + 1); setSelected(null); }
    else setStep("done");
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <button onClick={() => setView({ name: "languages" })} className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: C.muted }}>
        <ArrowLeft size={15} /> Tutte le lingue
      </button>

      <div className="flex items-center gap-3 mb-8">
        <span className="text-3xl">{lang.flag}</span>
        <div>
          <h1 className="font-serif text-2xl" style={{ color: C.ink }}>{lang.name}</h1>
          <p className="text-sm" style={{ color: C.muted }}>Lezione 1 · Tutor madrelingua: {lang.tutor}</p>
        </div>
      </div>

      {step === "video" && (
        <div>
          <div className="mb-4">
            <VideoPlayer resetKey={lang.id} caption={`${lang.tutor} · ${lang.name}`} />
          </div>
          <p className="text-xs inline-flex items-center gap-1 mb-4" style={{ color: C.sage600 }}><Volume2 size={12} /> Il video caricato può includere sottotitoli</p>
          <p className="text-sm mb-6" style={{ color: C.muted }}>
            In questo video {lang.tutor}, madrelingua {lang.name.toLowerCase()}, comunica in una situazione quotidiana. Le domande dopo il video si basano su quello che senti e vedi.
          </p>
          <Button variant="primary" onClick={() => setStep("quiz")}>Ho guardato, inizia gli esercizi</Button>
        </div>
      )}

      {step === "quiz" && (
        <div>
          <div className="w-full h-1.5 rounded-full mb-6 overflow-hidden" style={{ background: C.sage50 }}>
            <div className="h-full transition-all" style={{ width: `${(qIndex / questions.length) * 100}%`, background: C.sage600 }} />
          </div>
          <p className="text-xs mb-2" style={{ color: C.muted }}>Domanda {qIndex + 1} di {questions.length}</p>
          <h2 className="font-serif text-xl mb-5" style={{ color: C.ink }}>{q.prompt}</h2>
          <div className="space-y-2 mb-6">
            {q.options.map((opt, i) => {
              const isCorrect = selected !== null && i === q.correct;
              const isWrong = selected === i && i !== q.correct;
              let style = { border: `1px solid ${C.border}`, background: C.card, color: C.ink };
              if (isCorrect) style = { border: "1px solid #4F6B5C", background: C.sage50, color: C.sage700 };
              if (isWrong) style = { border: "1px solid #C24444", background: "#FBEAEA", color: "#8C2E2E" };
              if (selected !== null && !isCorrect && !isWrong) style = { border: `1px solid ${C.border}`, background: C.card, color: C.muted };
              return (
                <button key={i} onClick={() => selected === null && selectAnswer(i)} style={style} className="w-full text-left px-4 py-3 rounded text-sm flex items-center justify-between">
                  {opt}
                  {isCorrect && <Check size={16} />}
                  {isWrong && <X size={16} />}
                </button>
              );
            })}
          </div>
          {selected !== null && (
            <Button variant="primary" onClick={next}>{qIndex < questions.length - 1 ? "Continua" : "Vedi risultato"}</Button>
          )}
        </div>
      )}

      {step === "done" && (
        <div className="text-center py-10">
          <p className="font-serif text-3xl mb-2" style={{ color: C.ink }}>{correctCount} / {questions.length}</p>
          <p className="mb-8" style={{ color: C.muted }}>risposte corrette in questa lezione</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="ghost" onClick={() => { setStep("video"); setQIndex(0); setSelected(null); setCorrectCount(0); }}>Rivedi la lezione</Button>
            <Button variant="primary" onClick={() => setView({ name: "languages" })}>Scegli un'altra lingua</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* APP                                                                  */
/* ------------------------------------------------------------------ */

function getInitialView() {
  if (typeof window === "undefined") return { name: "home" };
  const params = new URLSearchParams(window.location.search);
  const courseId = Number(params.get("course"));
  if (params.get("success") === "1" && courseId) {
    return { name: "course", id: courseId, enrolledLang: params.get("lang") || null, justPaid: true };
  }
  if (params.get("canceled") === "1" && courseId) {
    return { name: "course", id: courseId, paymentCanceled: true };
  }
  return { name: "home" };
}

export default function App() {
  const courses = useMemo(() => buildCourses(), []);
  const [view, setView] = useState(getInitialView);

  const activeCourse = view.name === "course" ? courses.find((c) => c.id === view.id) : null;
  const activeLang = view.name === "lesson" ? LANGUAGES.find((l) => l.id === view.langId) : null;

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bg }}>
      <Header view={view} setView={setView} />
      {view.name === "home" && <HomePage setView={setView} courses={courses} />}
      {view.name === "catalog" && <CatalogPage courses={courses} setView={setView} initialCategory={view.category} />}
        {view.name === "course" && (
        <CourseDetailPage
          course={activeCourse}
          setView={setView}
          initialEnrolledLang={view.enrolledLang}
          paymentCanceled={view.paymentCanceled}
        />
      )}
      {view.name === "languages" && <LanguagesPage setView={setView} />}
      {view.name === "lesson" && <LessonPage lang={activeLang} setView={setView} />}
      <footer style={{ borderTop: `1px solid ${C.border}` }} className="py-10 mt-10">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <Logo />
          <span className="text-sm" style={{ color: C.muted }}>Prototipo dimostrativo</span>
        </div>
      </footer>
    </div>
  );
}
