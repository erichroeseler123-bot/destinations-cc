export const SITE_CONFIG = {
  siteKey: "welcometotheswamp",
  name: "Welcome to the Swamp",
  domain: "welcometotheswamp.com",
  url: "https://welcometotheswamp.com",
  mission:
    "Welcome to the Swamp helps visitors choose, time, and understand swamp tours near New Orleans with practical, tourist-first advice — before they book anything.",
  dccOrigin: process.env.DCC_ORIGIN || "https://www.destinationcommandcenter.com",
} as const;
