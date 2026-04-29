export const brands = {
  DCC: {
    from: process.env.MAIL_FROM_DCC || "DCC Ops <ops@destinationcommandcenter.com>",
    replyTo: process.env.MAIL_REPLY_TO_DCC || "ops@destinationcommandcenter.com",
    name: "DCC Ops",
    baseUrl: process.env.DCC_PUBLIC_BASE_URL || "https://www.destinationcommandcenter.com",
  },
  // Future satellite identities stay scoped here to prevent brand/header bleed.
  // GOSNO: {
  //   from: process.env.MAIL_FROM_GOSNO,
  //   replyTo: process.env.MAIL_REPLY_TO_GOSNO,
  //   name: "GoSno LLC",
  //   baseUrl: "https://gosno.co",
  // },
  // FEASTLY: {
  //   from: process.env.MAIL_FROM_FEASTLY,
  //   replyTo: process.env.MAIL_REPLY_TO_FEASTLY,
  //   name: "Feastly",
  //   baseUrl: "https://feastlyspread.com",
  // },
  // PARR: {
  //   from: process.env.MAIL_FROM_PARR,
  //   replyTo: process.env.MAIL_REPLY_TO_PARR,
  //   name: "Party at Red Rocks",
  //   baseUrl: "https://partyatredrocks.com",
  // },
} as const;

export type BrandId = keyof typeof brands;
