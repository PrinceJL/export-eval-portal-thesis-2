export default function StatCard({ title, value, subtitle }) {
  const sentiment = String(subtitle || "").toLowerCase();

  const tone = sentiment.includes("positive")
    ? {
        valueClass: "text-emerald-500",
        pillClass:
          "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30",
      }
    : sentiment.includes("negative")
      ? {
          valueClass: "text-rose-500",
          pillClass: "bg-rose-500/10 text-rose-500 border border-rose-500/30",
        }
      : {
          valueClass: "text-sky-500",
          pillClass: "bg-sky-500/10 text-sky-500 border border-sky-500/30",
        };

  const formattedValue =
    typeof value === "number" ? value.toFixed(1).replace(/\.0$/, "") : value;

  return (
    <article className="rounded-xl border border-base-300/80 bg-base-100/70 p-4 shadow-sm backdrop-blur-sm transition-colors hover:border-base-content/20">
      <h3 className="text-sm font-semibold text-base-content/70">{title}</h3>
      <p className={`mt-3 text-3xl font-bold leading-none ${tone.valueClass}`}>
        {formattedValue}
      </p>
      {subtitle ? (
        <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone.pillClass}`}>
          {subtitle}
        </span>
      ) : null}
    </article>
  );
}
