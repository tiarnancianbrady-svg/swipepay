import Image from "next/image";

export function VendorLogo({ vendorName, logoUrl }: { vendorName: string; logoUrl?: string | null }) {
  const initials = vendorName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (logoUrl) {
    return <Image src={logoUrl} alt={vendorName} width={48} height={48} className="rounded-full bg-white" />;
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-300 font-bold text-slate-700">
      {initials || "??"}
    </div>
  );
}
