import type { Result } from "@/lib/types";

const styles: Record<Result, string> = {
  W: "bg-win/15 text-win",
  D: "bg-draw/15 text-draw",
  L: "bg-loss/15 text-loss"
};

export function FormPills({ form }: { form: Result[] }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Recent form, oldest to newest: ${form.join(" ")}`}>
      {form.map((r, i) => (
        <span
          key={i}
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${styles[r]} ${
            i === form.length - 1 ? "ring-1 ring-current" : ""
          }`}
        >
          {r}
        </span>
      ))}
    </div>
  );
}
