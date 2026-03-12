type MediaItem = {
  src: string;
  alt: string;
};

export default function AuthorityMediaStrip({
  hero,
  gallery,
}: {
  hero: MediaItem;
  gallery: MediaItem[];
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]">
      <div className="grid gap-px bg-white/10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden bg-black/30">
          <img src={hero.src} alt={hero.alt} className="h-full w-full object-cover" loading="eager" />
        </div>
        <div className="grid gap-px bg-white/10 sm:grid-cols-2">
          {gallery.slice(0, 4).map((item) => (
            <div key={item.src} className="overflow-hidden bg-black/30">
              <img src={item.src} alt={item.alt} className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
