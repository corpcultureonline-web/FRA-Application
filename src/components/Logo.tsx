import Image from "next/image";
import logo from "@/assets/logo.png";
import logoInverted from "@/assets/logo-inverted.png";

/**
 * The Corporate Culture logo, as used on corpculture.co. `inverted` has white
 * lettering for dark backgrounds (the orange mark is unchanged); `compact` is
 * the smaller size for the audit header.
 *
 * Served as-is (unoptimized): it is a small PNG, and the PDF render should not
 * depend on the image optimiser.
 */
export function Logo({
  inverted = false,
  compact = false,
}: {
  inverted?: boolean;
  compact?: boolean;
}) {
  return (
    <Image
      src={inverted ? logoInverted : logo}
      alt="Corporate Culture"
      unoptimized
      priority={!inverted}
      className={`w-auto ${compact ? "h-11 sm:h-12" : "h-12 sm:h-14"}`}
    />
  );
}
