import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  leadingIcon?: ReactNode;
  variant?: Variant;
  size?: Size;
};

const variants: Record<Variant, string> = {
  primary: "bg-gastro-action text-white hover:bg-gastro-action-hover focus-visible:ring-gastro-action",
  secondary: "border border-gastro-outline bg-white text-gastro-primary hover:bg-gastro-surface-low focus-visible:ring-gastro-action",
  ghost: "text-gastro-primary hover:bg-gastro-surface-low focus-visible:ring-gastro-action",
  danger: "bg-gastro-error text-white hover:bg-gastro-error-strong focus-visible:ring-gastro-error",
};

const sizes: Record<Size, string> = { sm: "min-h-9 px-3 text-xs", md: "min-h-10 px-4 text-sm", lg: "min-h-12 px-5 text-sm" };

export function Button({ children, className, disabled, isLoading = false, leadingIcon, size = "md", type = "button", variant = "primary", ...props }: ButtonProps) {
  return <button aria-busy={isLoading || undefined} className={cn("inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60", variants[variant], sizes[size], className)} disabled={disabled || isLoading} type={type} {...props}>
    {isLoading ? <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> : leadingIcon}
    {children}
  </button>;
}
