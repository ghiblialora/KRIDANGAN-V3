// Client-side validation for the registration flow (the backend re-validates everything).

export interface Details {
  full_name: string;
  email: string;
  mobile: string;
  college: string;
  student_id: string;
}

export const emptyDetails: Details = { full_name: "", email: "", mobile: "", college: "", student_id: "" };

export type DetailsErrors = Partial<Record<keyof Details, string>>;

export function validateDetails(d: Details): DetailsErrors {
  const errors: DetailsErrors = {};
  if (d.full_name.trim().length < 2) errors.full_name = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) errors.email = "Enter a valid email address.";
  const digits = d.mobile.replace(/[\s-]/g, "").replace(/^\+91/, "").replace(/^0(?=\d{10}$)/, "");
  if (!/^[6-9]\d{9}$/.test(digits)) errors.mobile = "Enter a valid 10-digit Indian mobile number.";
  if (d.college.trim().length < 2) errors.college = "Enter your college or institution.";
  if (d.student_id.trim().length < 2) errors.student_id = "Enter your student / college ID.";
  return errors;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export function validateScreenshot(file: File): string | null {
  if (!ACCEPTED.includes(file.type)) return "Only JPG, JPEG, PNG or WEBP images are accepted.";
  if (file.size > MAX_BYTES) return "Screenshot must be 5 MB or smaller.";
  return null;
}


// Clipboard with a legacy fallback (navigator.clipboard is unavailable on http or in some webviews).
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
