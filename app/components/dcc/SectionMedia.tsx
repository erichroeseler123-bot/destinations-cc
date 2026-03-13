import Image from "next/image";
import type { DccMediaAsset } from "@/lib/dcc/media/schema";

type Props = {
  title: string;
  assets: DccMediaAsset[];
};

export default function SectionMedia({ title, assets }: Props) {
  if (!assets.length) return null;

  return (
    <section className="space-y-3">
      <h3 className="text-xl font-bold">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {assets.map((asset) => (
          <figure
            key={asset.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
          >
            <Image
              src={asset.optimized_path}
              alt={asset.alt}
              width={asset.width}
              height={asset.height}
              className="h-auto w-full object-cover"
              style={{ objectPosition: asset.focal }}
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 800px"
            />
            <figcaption className="px-3 py-2 text-xs text-zinc-400">
              {asset.attribution}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
