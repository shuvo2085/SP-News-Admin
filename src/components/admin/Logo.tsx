/**
 * SP News logo — faithful recreation of the संजय पेड़ा NEWS mark.
 *
 * To use the REAL logo image instead, drop the file at web/public/logo.png
 * and set USE_IMAGE_LOGO = true.
 */
const USE_IMAGE_LOGO = false;

export function Logo({ compact = false }: { compact?: boolean }) {
  if (USE_IMAGE_LOGO) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/logo.png" alt="SP News" className="h-10 w-auto" />;
  }

  return (
    <div className="flex flex-col items-center select-none leading-none">
      <div className="flex rounded-md overflow-hidden ring-[1.5px] ring-brand">
        <span className="bg-brand text-white font-extrabold px-1.5 py-1 text-[15px]">
          संजय
        </span>
        <span className="bg-white text-neutral-700 font-extrabold px-1.5 py-1 text-[15px]">
          पेड़ा
        </span>
      </div>
      {!compact && (
        <span className="text-[10px] font-black tracking-[0.35em] text-neutral-500 mt-0.5">
          NEWS
        </span>
      )}
    </div>
  );
}
