"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { getVendorLogoUrl } from "@/lib/get-vendor-logo-url";

type VendorLogoProps = {
  vendorName: string;
  logoUrl?: string | null;
  vendorDomain?: string | null;
  size?: number;
  className?: string;
};

export function VendorLogo({ vendorName, logoUrl, vendorDomain, size = 72, className = "" }: VendorLogoProps) {
  const [isBroken, setIsBroken] = useState(false);
  const resolvedLogoUrl = useMemo(() => getVendorLogoUrl({ logoUrl, vendorDomain }), [logoUrl, vendorDomain]);

  const initials = vendorName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (resolvedLogoUrl && !isBroken) {
    return (
      <Image
        src={resolvedLogoUrl}
        alt={`${vendorName} logo`}
        width={size}
        height={size}
        className={`rounded-2xl border border-slate-200 bg-white object-contain p-2 shadow-sm ${className}`}
        onError={() => setIsBroken(true)}
      />
    );
  }

  if (initials) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 font-bold text-white shadow-sm ${className}`}
        style={{ width: size, height: size }}
        aria-label={`${vendorName} initials avatar`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-slate-200 text-slate-600 shadow-sm ${className}`}
      style={{ width: size, height: size }}
      aria-label="Generic vendor icon"
    >
      <Building2 size={Math.max(22, Math.floor(size * 0.45))} />
    </div>
  );
}
