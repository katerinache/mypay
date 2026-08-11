import Link from "next/link";

export function Logo({
  size = "md",
  onDark = false,
}: {
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
}) {
  const text =
    size === "lg" ? "text-3xl sm:text-4xl" : size === "sm" ? "text-lg" : "text-xl";

  return (
    <Link href="/" className={`font-display font-bold tracking-tight ${text}`} aria-label="Мой Агент">
      <span className={onDark ? "text-orange-300" : "text-accent"}>Мой</span>
      <span className={onDark ? "text-sky-300" : "text-primary"}>Агент</span>
    </Link>
  );
}
