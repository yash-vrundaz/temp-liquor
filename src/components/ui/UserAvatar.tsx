import { cn } from "@/lib/utils";

type Props = {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
};

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function UserAvatar({ name, src, size = 40, className }: Props) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover ring-1 ring-white/10", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-(--gold)/15 font-medium tracking-wide text-gold ring-1 ring-(--gold)/25",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.32) }}
      aria-hidden
    >
      {initialsFor(name)}
    </span>
  );
}
