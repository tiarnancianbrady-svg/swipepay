export type VendorLogoInput = {
  logoUrl?: string | null;
  vendorDomain?: string | null;
};

export function getVendorLogoUrl(vendor: VendorLogoInput): string | null {
  if (vendor.logoUrl) return vendor.logoUrl;
  if (!vendor.vendorDomain) return null;

  const normalizedDomain = vendor.vendorDomain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .trim();

  return normalizedDomain ? `https://logo.clearbit.com/${normalizedDomain}` : null;
}
