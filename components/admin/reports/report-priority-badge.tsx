import type { FC } from "react";
import {
  Circle,
  CircleAlert,
  TriangleAlert,
  OctagonAlert,
  type LucideIcon,
} from "lucide-react";
import type { ReportPriority } from "@/types/database";

interface PriorityBadgeProps {
  priority: ReportPriority;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

interface PriorityMeta {
  label: string;
  icon: LucideIcon;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

export const PRIORITY_META: Record<ReportPriority, PriorityMeta> = {
  low: {
    label: "Rendah",
    icon: Circle,
    textColor: "text-[#747686]",
    bgColor: "bg-[#F0F3FF]",
    borderColor: "border-[#D9DEE7]",
  },
  medium: {
    label: "Sedang",
    icon: CircleAlert,
    textColor: "text-[#0033A7]",
    bgColor: "bg-[#EEF2FC]",
    borderColor: "border-[#C4D3F8]",
  },
  high: {
    label: "Tinggi",
    icon: TriangleAlert,
    textColor: "text-[#B2640A]",
    bgColor: "bg-[#FEF3E6]",
    borderColor: "border-[#FCD7A9]",
  },
  critical: {
    label: "Kritis",
    icon: OctagonAlert,
    textColor: "text-[#BA1A1A]",
    bgColor: "bg-[#FFDAD6]",
    borderColor: "border-[#FFB4AB]",
  },
};

export const ReportPriorityBadge: FC<PriorityBadgeProps> = ({
  priority,
  size = "md",
  showIcon = true,
  className = "",
}) => {
  const meta = PRIORITY_META[priority] || PRIORITY_META.medium;
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
