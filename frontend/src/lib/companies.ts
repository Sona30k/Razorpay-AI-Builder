import type { Company } from "@/types/company";

export const CITY_METERS_TO_SCENE = 0.00018;
const CITY_MAP_RADIUS_KM = 35;

export type MappableCompany = Company & { latitude: number; longitude: number };

function sourceText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  return text && text.toLowerCase() !== "nan" ? text : undefined;
}

function sourceField(company: Company, field: string) {
  return sourceText(company.original?.[field]);
}

export function companyText(value: unknown) {
  return sourceText(value);
}

export function companyCityId(company: Company) {
  return company.city.trim().toLowerCase();
}

export function hasUsableCoordinates(company: Company): company is MappableCompany {
  return typeof company.latitude === "number"
    && typeof company.longitude === "number"
    && Number.isFinite(company.latitude)
    && Number.isFinite(company.longitude)
    && Math.abs(company.latitude) <= 90
    && Math.abs(company.longitude) <= 180;
}

export function isNearCity(company: Company, latitude: number, longitude: number): company is MappableCompany {
  if (!hasUsableCoordinates(company)) return false;
  const latitudeKm = (company.latitude - latitude) * 110.54;
  const longitudeKm = (company.longitude - longitude) * 111.32 * Math.cos((latitude * Math.PI) / 180);
  return Math.hypot(latitudeKm, longitudeKm) <= CITY_MAP_RADIUS_KM;
}

export function companyIndustry(company: Company) {
  return companyText(company.industry) ?? sourceField(company, "Industry Vertical");
}

export function companyFunding(company: Company) {
  return companyText(company.funding) ?? sourceField(company, "Amount in USD");
}

export function companyInvestors(company: Company) {
  return companyText(company.investors) ?? sourceField(company, "Investors Name");
}

export function filterCompanies(companies: Company[], cityId: string, search = "") {
  const query = search.trim().toLowerCase();
  return companies.filter((company) => {
    if (companyCityId(company) !== cityId) return false;
    if (!query) return true;

    return [company.name, company.category, companyIndustry(company), company.city]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(query));
  });
}

export function companyDiagnostics(companies: Company[], cityId: string, latitude: number, longitude: number) {
  const cityCompanies = filterCompanies(companies, cityId);
  const withCoordinates = cityCompanies.filter(hasUsableCoordinates);
  const mappable = withCoordinates.filter((company) => isNearCity(company, latitude, longitude));
  return {
    total: cityCompanies.length,
    withCoordinates: withCoordinates.length,
    mappable: mappable.length,
    outsideCityArea: withCoordinates.length - mappable.length
  };
}
