import type { Result } from "@/lib/types";

const styles: Record<Result, string> = {
  W: "bg-win/15 text-win",
  D: "bg-draw/15 text-draw",
  L: "bg-loss/15 text-loss"
};

export function FormPills({ form, size = "md" }: { form: Result[]; size?: "sm" | "md" }) {
  return (
    <div className={`flex items-center ${size === "sm" ? "gap-1" : "gap-1.5"}`} aria-label={`Recent form, oldest to newest: ${form.join(" ")}`}>
      {form.map((r, i) => (
        <span
          key={i}
          className={`flex items-center justify-center font-bold ${size === "sm" ? "h-5 w-5 rounded-md text-[10px]" : "h-7 w-7 rounded-lg text-xs"} ${styles[r]} ${
            i === form.length - 1 ? "ring-1 ring-current" : ""
          }`}
        >
          {r}
        </span>
      ))}
    </div>
  );
}
