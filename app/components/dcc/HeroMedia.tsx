import Image from "next/image";
import type { DccMediaAsset } from "@/lib/dcc/media/schema";

type Props = {
  asset: DccMediaAsset;
};

export default function HeroMedia({ asset }: Props) {
  return (
    <figure className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
      <Image
        src={asset.optimized_path}
        alt={asset.alt}
        width={asset.width}
        height={asset.height}
        className="h-auto w-full object-cover"
        style={{ objectPosition: asset.focal }}
        priority
        sizes="(max-width: 1024px) 100vw, 1200px"
      />
      <figcaption className="px-4 py-3 text-xs text-zinc-400">
        {asset.attribution} · Source: {asset.source}
      </figcaption>
    </figure>
  );
}
