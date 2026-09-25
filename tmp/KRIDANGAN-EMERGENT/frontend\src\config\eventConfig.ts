export const eventConfig = {
  eventName: "KRIDANGAN",
  season: "Season 1",
  organizer: "NxtGen Esports Club",
  parentEvent: "JamRang",
  parentEventFull: "JamRang Fest",
  university: "Vijaybhoomi University",
  venue: "Vijaybhoomi University Campus, Jamrung, Karjat, Raigad, Maharashtra",
  eventDate: {
    display: "29–30 October 2026",
    start: "2026-10-29",
    end: "2026-10-30",
  },
  eventDetails: {
    schedule: "29–30 October 2026 · Detailed timings will be shared soon",
    rules: "Official game formats & Rule Books published",
    registrationFee: "Free Fire ₹199 · Chess ₹99 · E-Football ₹99",
  },
  prizePool: "₹40,000",
  prizeBreakdown: {
    freefire: "₹20,000",
    chess: "₹10,000",
    efootball: "₹8,000",
  },
  logoPaths: {
    kridanganOnDark: "https://customer-assets-v7afamib.emergentagent.net/job_kridangan-esports/artifacts/d2xzyx2u_IMG-20260910-WA0027.jpg-removebg-preview.png",
    kridanganOnLight: "https://customer-assets-v7afamib.emergentagent.net/job_kridangan-esports/artifacts/kyrknxdl_IMG-20260910-WA0026.jpg.jpeg",
    jamrang: "https://customer-assets-v7afamib.emergentagent.net/job_kridangan-esports/artifacts/s3pv5dg9_IMG-20260920-WA0004.jpg-removebg-preview.png",
    nxtgen: "https://customer-assets-v7afamib.emergentagent.net/job_kridangan-esports/artifacts/5anh5746_Screenshot_20260921_121214.jpg-removebg-preview.png",
    eventArtwork: "https://customer-assets-v7afamib.emergentagent.net/job_kridangan-esports/artifacts/wl1lmcmq_IMG-20260910-WA0033.jpg.jpeg",
    university: "https://customer-assets-v7afamib.emergentagent.net/job_kridangan-esports/artifacts/9n4luer3_Vijaybhoomi_University_Logo.png",
    universityTransparent: "/assets/vijaybhoomi-logo-transparent.svg",
  },
  // Registration happens on-site at /register (manual UPI + admin verification).
  // Fees and the UPI ID / QR path are configured in backend/lib/event_config.py and fetched
  // from GET /api/registration/config so the backend is the single source of truth.
  registration: {
    path: "/register",
    statusPath: "/registration-status",
  },
  contact: {
    email: "nxtgenesportsclub@gmail.com",
    instagram: {
      esports: "https://www.instagram.com/esports.vu?stkn=OWl4ODI0ZXNwaDVi",
      jamrang: "https://www.instagram.com/jamrang.vu?stkn=MTQ1bTl5NHQ3MTBnbA==",
      university: "https://www.instagram.com/vijaybhoomiuniversity?stkn=cjNpdzY0cmRtM3c=",
    },
  },
} as const;

export type GameId = "freefire" | "chess" | "efootball";

export type Game = {
  id: GameId;
  title: string;
  genre: string;
  platform: string;
  description: string;
  number: string;
  accent: string;
  imageUrl: string;
  imageAlt: string;
};

export const games: Game[] = [
  {
    id: "freefire",
    title: "Free Fire",
    genre: "Battle Royale",
    platform: "Mobile",
    description: "Competitive esports action built around fast battles and dominating the lobby.",
    number: "01",
    accent: "#F97316",
    imageUrl: "https://customer-assets-v7afamib.emergentagent.net/job_kridangan-esports/artifacts/w6b33s2x_image.png",
    imageAlt: "Free Fire characters assembled for battle",
  },
  {
    id: "chess",
    title: "Chess",
    genre: "Tactical Strategy",
    platform: "PC / Mobile",
    description: "A battle of strategy, patience and calculated moves where every decision matters.",
    number: "02",
    accent: "#FDBA74",
    imageUrl: "https://customer-assets-v7afamib.emergentagent.net/job_kridangan-esports/artifacts/w196q6zm_image.png",
    imageAlt: "Black and white chess pieces surrounded by cinematic mist",
  },
  {
    id: "efootball",
    title: "E-Football",
    genre: "Sports Simulation",
    platform: "Console / Mobile",
    description: "Competitive virtual football where skill, strategy and quick decisions decide the game.",
    number: "03",
    accent: "#FB923C",
    imageUrl: "https://customer-assets-v7afamib.emergentagent.net/job_kridangan-esports/artifacts/zkewiya5_image.png",
    imageAlt: "E-Football logo",
  },
];