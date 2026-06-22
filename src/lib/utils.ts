import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskWhatsAppNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  let out = "";
  if (digits.length > 0) out += "+" + digits.slice(0, 2);
  if (digits.length > 2) out += " (" + digits.slice(2, 4);
  if (digits.length >= 4) out += ")";
  if (digits.length > 4) out += " " + digits.slice(4, 9);
  if (digits.length > 9) out += "-" + digits.slice(9, 13);
  return out;
}
