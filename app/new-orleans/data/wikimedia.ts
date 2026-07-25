export interface WikimediaImage {
  id: string;
  originalTitle: string;
  displayTitle: string;
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
  publicDomainRationale?: string;
  editorialNote?: string;
}

export const WIKIMEDIA_IMAGES: Record<string, WikimediaImage> = {
  "oak-alley-front": {
    id: "oak-alley-front",
    originalTitle: "Oak alley - view from front",
    displayTitle: "Oak Alley Plantation",
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
  },
  "st-louis-cemetery-1-gates": {
    id: "st-louis-cemetery-1-gates",
    originalTitle: "St. Louis Cemetery No 1 New Orleans",
    displayTitle: "St. Louis Cemetery No. 1",
    url: "/images/wikimedia/originals/st-louis-cemetery-1-gates.jpg",
    originalFileUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1c/St._Louis_Cemetery_No_1_New_Orleans%2C_27_August_2022_-_01.jpg",
    author: "Tom Hilton",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:St._Louis_Cemetery_No_1_New_Orleans,_27_August_2022_-_01.jpg",
    alt: "Gates of St. Louis Cemetery No. 1 in New Orleans",
    caption: "St. Louis Cemetery No. 1, New Orleans",
    attributionText: "Tom Hilton",
    changesMade: "Downloaded from original source."
  },
  "above-ground-tomb": {
    id: "above-ground-tomb",
    originalTitle: "St Louis Cemetery No 1, New Orleans January 2026",
    displayTitle: "St. Louis Cemetery No. 1 Above Ground Tomb",
    url: "/images/wikimedia/originals/above-ground-tomb.jpg",
    originalFileUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ab/St_Louis_Cemetery_No_1%2C_New_Orleans_January_2026.jpg",
    author: "ksjantz",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:St_Louis_Cemetery_No_1,_New_Orleans_January_2026.jpg",
    alt: "Above ground tombs in St. Louis Cemetery No. 1",
    caption: "Traditional above-ground tombs in New Orleans",
    attributionText: "ksjantz",
    changesMade: "Downloaded from original source."
  },
  "french-quarter-night": {
    id: "french-quarter-night",
    originalTitle: "Night in the French Quarter 2 December 2008",
    displayTitle: "French Quarter at Night",
    url: "/images/wikimedia/originals/french-quarter-night.jpg",
    originalFileUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Night_in_the_French_Quarter_2_December_2008.jpg",
    author: "Infrogmation of New Orleans",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Night_in_the_French_Quarter_2_December_2008.jpg",
    alt: "Historic French Quarter street at night",
    caption: "The French Quarter at night",
    attributionText: "Infrogmation of New Orleans",
    changesMade: "Downloaded from original source."
  },
  "new-orleans-map-1880": {
    id: "new-orleans-map-1880",
    originalTitle: "New Orleans cemeteries map 1880",
    displayTitle: "New Orleans Cemeteries Map (1880)",
    url: "/images/wikimedia/originals/new-orleans-map-1880.jpg",
    originalFileUrl: "https://upload.wikimedia.org/wikipedia/commons/5/50/New_Orleans_cemeteries_map_1880.jpg",
    author: "Unknown (published 1880, author anonymous)",
    license: "Public domain",
    licenseUrl: "https://en.wikipedia.org/wiki/Public_domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:New_Orleans_cemeteries_map_1880.jpg",
    alt: "Archival map of New Orleans cemeteries from 1880",
    caption: "1880 archival map of New Orleans cemeteries",
    attributionText: "Public domain",
    changesMade: "Downloaded from original source.",
    publicDomainRationale: "Published before 1929 in the United States."
  },
  "lalaurie-mansion-1906": {
    id: "lalaurie-mansion-1906",
    originalTitle: "The Haunted Saloon - LaLaurie Mansion Building, New Orleans, 1906 border cropped",
    displayTitle: "LaLaurie Mansion Building, New Orleans, 1906",
    editorialNote: "Original source title 'The Haunted Saloon' is historically preserved here but is not endorsed as evidence of paranormal activity.",
    url: "/images/wikimedia/originals/lalaurie-mansion-1906.jpg",
    originalFileUrl: "https://upload.wikimedia.org/wikipedia/commons/4/45/The_Haunted_Saloon_-_LaLaurie_Mansion_Building%2C_New_Orleans%2C_1906_border_cropped.jpg",
    author: "Uncredited photographer for Detroit Publishing Co",
    license: "Public domain",
    licenseUrl: "https://en.wikipedia.org/wiki/Public_domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:The_Haunted_Saloon_-_LaLaurie_Mansion_Building,_New_Orleans,_1906_border_cropped.jpg",
    alt: "LaLaurie Mansion in New Orleans in 1906",
    caption: "The LaLaurie Mansion building in 1906",
    attributionText: "Detroit Publishing Co",
    changesMade: "Downloaded from original source.",
    publicDomainRationale: "Published before 1929 in the United States (1906)."
  }
};
