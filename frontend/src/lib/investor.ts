import type { Company } from "@/types/company";
import { companyFunding, companyIndustry, companyInvestors } from "@/lib/companies";

export function investorNames(company: Company) {
  const value = companyInvestors(company);
  if (!value) return [];
  return Array.from(new Set(value.split(/[,;|]/).map((name) => name.trim()).filter(Boolean)));
}

export function fundingAmount(company: Company) {
  const value = companyFunding(company);
  if (!value) return null;
  const number = Number(value.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(number) || number <= 0) return null;
  const lower = value.toLowerCase();
  if (lower.includes("billion")) return number * 1_000_000_000;
  if (lower.includes("million") || lower.includes("mn")) return number * 1_000_000;
  if (lower.includes("crore") || lower.includes(" cr")) return number * 10_000_000;
  return number;
}

export function formatFunding(company: Company) {
  const amount = fundingAmount(company);
  if (!amount) return "Not disclosed";
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(amount >= 100_000_000 ? 0 : 1)} Cr`;
  if (amount >= 1_000_000) return `₹${(amount / 1_000_000).toFixed(1)} M`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function companySector(company: Company) {
  return companyIndustry(company) ?? company.category ?? "Not available";
}
