// Hand-written mirrors of backend/models/registration.py — keep in sync with the Pydantic models.

export type GameId = "freefire" | "chess" | "efootball";
export type RegStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface GameConfig {
  id: GameId;
  title: string;
  fee: number | null;
  fee_display: string;
  registration_type: string;
  mode: string;
  rulebook_url: string;
}

export interface PaymentConfig {
  upi_id: string;
  qr_code: string;
}

export interface RegistrationConfig {
  games: GameConfig[];
  payment: PaymentConfig;
  organizer_email: string;
}

export interface RegistrationSubmitted {
  registration_id: string;
  game: GameId;
  game_title: string;
  registration_fee: number | null;
  fee_display: string;
  payment_status: RegStatus;
  registration_status: RegStatus;
  created_at: string;
}

export interface StatusLookup {
  registration_id: string;
  email?: string;
}

export interface PublicStatus {
  registration_id: string;
  game: GameId;
  game_title: string;
  payment_status: RegStatus;
  registration_status: RegStatus;
  created_at: string;
  verified_at: string | null;
}

// ---------------- admin ----------------

export interface AdminLogin {
  username: string;
  password: string;
}

export interface AdminMe {
  username: string;
}

export interface Registration {
  registration_id: string;
  full_name: string;
  email: string;
  mobile: string;
  college: string;
  student_id: string;
  game: GameId;
  game_title: string;
  registration_type: string;
  mode: string;
  rulebook_url: string;
  rulebook_accepted: boolean;
  game_details: Record<string, unknown>;
  registration_fee: number | null;
  fee_display: string;
  utr_number: string;
  payment_screenshot_url: string;
  payment_status: RegStatus;
  registration_status: RegStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
  verified_by: string | null;
}

export interface DuplicateWarning {
  kind: "utr" | "participant";
  message: string;
  registration_ids: string[];
}

export interface RegistrationDetail {
  registration: Registration;
  warnings: DuplicateWarning[];
}

export interface RegistrationPage {
  items: Registration[];
  total: number;
  page: number;
  page_size: number;
}

export interface GameCount {
  game: GameId;
  title: string;
  total: number;
  pending: number;
  verified: number;
}

export interface Stats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  games: GameCount[];
}

export interface RejectInput {
  reason: string;
}

export interface NoteInput {
  admin_note: string;
}

// Shape of a FastAPI validation error body ({detail: [...]}) or our HTTPException ({detail: string}).
export interface ApiErrorBody {
  detail?: string | { field?: string; message?: string; msg?: string; loc?: (string | number)[] }[];
}
