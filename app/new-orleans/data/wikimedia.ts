export interface WikimediaImage {
  id: string;
  title: string;
  url: string;
  originalFileUrl: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  alt: string;
  caption: string;
  attributionText: string;
  changesMade?: string;
}

export const WIKIMEDIA_IMAGES: Record<string, WikimediaImage> = {
  "oak-alley-front": {
    id: "oak-alley-front",
    title: "Oak alley - view from front",
    url: "/images/wikimedia/originals/oak-alley-front.jpg",
    originalFileUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Oak_alley_-_view_from_front.jpg",
    author: "Sven Krosse",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Oak_alley_-_view_from_front.jpg",
    alt: "View of the antebellum Oak Alley Plantation house framed by 300-year-old oak trees",
    caption: "Oak Alley Plantation in Vacherie, Louisiana",
    attributionText: "Sven Krosse",
    changesMade: "Downloaded from original source."
  }
};
