import type { FC } from "react";
import {
  Inbox,
  SearchCheck,
  CircleCheck,
  LoaderCircle,
  CheckCircle2,
  CircleX,
  Copy,
  PencilLine,
  type LucideIcon,
} from "lucide-react";
import type { ReportStatus } from "@/types/database";

interface StatusBadgeProps {
  status: ReportStatus;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

interface StatusMeta {
  label: string;
  icon: LucideIcon;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

export const STATUS_META: Record<ReportStatus, StatusMeta> = {
  submitted: {
    label: "Laporan Masuk",
    icon: Inbox,
    textColor: "text-[#0033A7]",
    bgColor: "bg-[#EEF2FC]",
    borderColor: "border-[#C4D3F8]",
  },
  verifying: {
    label: "Verifikasi",
    icon: SearchCheck,
    textColor: "text-[#B2640A]",
    bgColor: "bg-[#FEF3E6]",
    borderColor: "border-[#FCD7A9]",
  },
  verified: {
    label: "Terverifikasi",
    icon: CircleCheck,
    textColor: "text-[#16845B]",
    bgColor: "bg-[#EDF7F2]",
    borderColor: "border-[#B5E2CD]",
  },
  in_progress: {
    label: "Dalam Proses",
    icon: LoaderCircle,
    textColor: "text-[#1749D2]",
    bgColor: "bg-[#EEF2FC]",
    borderColor: "border-[#C4D3F8]",
  },
  resolved: {
    label: "Selesai",
    icon: CheckCircle2,
    textColor: "text-[#16845B]",
    bgColor: "bg-[#EDF7F2]",
    borderColor: "border-[#B5E2CD]",
  },
  rejected: {
    label: "Ditolak",
    icon: CircleX,
    textColor: "text-[#BA1A1A]",
    bgColor: "bg-[#FFDAD6]",
    borderColor: "border-[#FFB4AB]",
  },
  duplicate: {
    label: "Duplikat",
    icon: Copy,
    textColor: "text-[#747686]",
    bgColor: "bg-[#F0F3FF]",
    borderColor: "border-[#D9DEE7]",
  },
  draft: {
    label: "Draf",
    icon: PencilLine,
    textColor: "text-[#747686]",
    bgColor: "bg-[#F0F3FF]",
    borderColor: "border-[#D9DEE7]",
  },
};

export const ReportStatusBadge: FC<StatusBadgeProps> = ({
  status,
  size = "md",
  showIcon = true,
  className = "",
}) => {
  const meta = STATUS_META[status] || STATUS_META.submitted;
  const Icon = meta.icon;

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2 py-0.5 gap-1"
      : "text-[12px] px-2.5 py-1 gap-1.5";

  const iconSize = size === "sm" ? 12 : 14;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${meta.bgColor} ${meta.textColor} ${meta.borderColor} ${sizeClasses} ${className}`}
    >
      {showIcon && <Icon size={iconSize} strokeWidth={2} aria-hidden="true" />}
      <span>{meta.label}</span>
    </span>
  );
};
