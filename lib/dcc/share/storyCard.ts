export const STORY_CARD_WIDTH = 1080;
export const STORY_CARD_HEIGHT = 1920;

export type StoryCardPayload = {
  title: string;
  subtitle: string;
  timestamp: string;
  lines: string[];
  footer?: string;
  heroImage?: string;
};

const APPROVED_MEDIA_PREFIX = "/images/authority/";

function isApprovedHeroPath(value: string): boolean {
  return value.startsWith(APPROVED_MEDIA_PREFIX);
}

export function toApprovedHeroPath(value: string | undefined, fallback: string): string {
  if (value && isApprovedHeroPath(value)) return value;
  return fallback;
}

function createGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, 0, 0, STORY_CARD_HEIGHT);
  gradient.addColorStop(0, "#0a0f1a");
  gradient.addColorStop(0.55, "#111827");
  gradient.addColorStop(1, "#030712");
  return gradient;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function drawMultiline(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3
): number {
  const lines = wrapText(ctx, text, maxWidth).slice(0, maxLines);
  lines.forEach((line, idx) => {
    ctx.fillText(line, x, y + idx * lineHeight);
  });
  return y + lines.length * lineHeight;
}

export async function renderStoryCardToBlob(payload: StoryCardPayload): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = STORY_CARD_WIDTH;
  canvas.height = STORY_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.fillStyle = createGradient(ctx);
  ctx.fillRect(0, 0, STORY_CARD_WIDTH, STORY_CARD_HEIGHT);

  const heroImage = payload.heroImage && isApprovedHeroPath(payload.heroImage) ? payload.heroImage : undefined;
  if (heroImage) {
    try {
      const img = await loadImage(heroImage);
      ctx.save();
      ctx.globalAlpha = 0.28;
      const scale = Math.max(STORY_CARD_WIDTH / img.width, STORY_CARD_HEIGHT / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (STORY_CARD_WIDTH - w) / 2;
      const y = (STORY_CARD_HEIGHT - h) / 2;
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();
    } catch {
      // No-op: export should continue even if hero image fails to render.
    }
  }

  const overlay = ctx.createLinearGradient(0, 0, 0, STORY_CARD_HEIGHT);
  overlay.addColorStop(0, "rgba(0, 0, 0, 0.42)");
  overlay.addColorStop(0.55, "rgba(0, 0, 0, 0.58)");
  overlay.addColorStop(1, "rgba(0, 0, 0, 0.76)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, STORY_CARD_WIDTH, STORY_CARD_HEIGHT);

  const contentX = 84;
  const contentWidth = STORY_CARD_WIDTH - contentX * 2;

  ctx.fillStyle = "#93c5fd";
  ctx.font = "700 30px ui-sans-serif, system-ui, -apple-system";
  ctx.fillText(payload.subtitle.toUpperCase(), contentX, 116);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "800 74px ui-sans-serif, system-ui, -apple-system";
  let cursorY = drawMultiline(ctx, payload.title, contentX, 220, contentWidth, 90, 3);

  ctx.fillStyle = "rgba(226, 232, 240, 0.9)";
  ctx.font = "500 34px ui-sans-serif, system-ui, -apple-system";
  cursorY = drawMultiline(ctx, `Updated ${payload.timestamp}`, contentX, cursorY + 26, contentWidth, 42, 2);

  ctx.strokeStyle = "rgba(226, 232, 240, 0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(contentX, cursorY + 22);
  ctx.lineTo(contentX + contentWidth, cursorY + 22);
  ctx.stroke();

  cursorY += 86;
  const bodyLines = payload.lines.slice(0, 6);
  ctx.fillStyle = "#f1f5f9";
  ctx.font = "500 40px ui-sans-serif, system-ui, -apple-system";
  for (const line of bodyLines) {
    const rendered = line.startsWith("•") ? line : `• ${line}`;
    cursorY = drawMultiline(ctx, rendered, contentX, cursorY, contentWidth, 52, 3) + 18;
    if (cursorY > STORY_CARD_HEIGHT - 210) break;
  }

  const footer = payload.footer || "destinations.cc";
  ctx.fillStyle = "rgba(203, 213, 225, 0.9)";
  ctx.font = "500 30px ui-sans-serif, system-ui, -apple-system";
  ctx.fillText(footer, contentX, STORY_CARD_HEIGHT - 92);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to render story card blob"));
      },
      "image/png",
      0.95
    );
  });
}

export function downloadBlobAsFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function shareBlobAsFile(options: {
  blob: Blob;
  filename: string;
  title: string;
  text: string;
  url: string;
}): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  try {
    const file = new File([options.blob], options.filename, { type: "image/png" });
    const payload: ShareData = {
      title: options.title,
      text: options.text,
      url: options.url,
      files: [file],
    };

    if (typeof navigator.canShare === "function" && !navigator.canShare({ files: [file] })) {
      return false;
    }

    await navigator.share(payload);
    return true;
  } catch {
    return false;
  }
}
