"use client";

type Props = {
  title?: string;
  message?: string;
};

export function AccessDenied({
  title = "Access restricted",
  message = "This section is not enabled for your account. Ask an owner to update your permissions.",
}: Props) {
  return (
    <div
      role="status"
      className="mt-4 rounded-sm border border-white/10 bg-white/[0.02] px-4 py-10 text-center sm:px-6"
    >
      <p className="text-[10px] uppercase tracking-[0.22em] text-gold">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted">{message}</p>
    </div>
  );
}
