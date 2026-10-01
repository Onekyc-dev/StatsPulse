import Image from "next/image";
import Link from "next/link";

/** The mark shown next to the hamburger on phones (the full sidebar wordmark covers desktop). */
export function LogoLink() {
  return (
    <Link href="/" className="flex items-center gap-2 lg:hidden" aria-label="StatPulse home">
      <Image src="/images/logo/logo-mark.png" alt="" width={36} height={40} priority className="h-9 w-auto" />
    </Link>
  );
}
