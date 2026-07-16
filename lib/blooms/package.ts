/** Photos in the Blooms — Epic Date Night package copy and pricing */

export const bloomsPackage = {
  slug: "photos-in-the-blooms",
  title: "Photos in the Blooms",
  status: "Now booking!",
  packageName: "Epic Date Night Package",
  headline:
    "Do something different for date night this week. Capture your love and affection for each other amongst beautiful flowers.",
  priceCents: 32500,
  priceDisplay: "$325",
  sessionLength: "30–40 minute session for two",
  inclusions: [
    "Gallery of 15–20 beautifully edited digital files to choose from",
    "One digital file of your choice, delivered for download",
    "Pick-your-own couples bouquet from the field",
    "Refreshing mocktail to enjoy after your shoot",
  ],
  bookingNote:
    "Choose a preferred date below. We'll confirm your session time by email within 1–2 business days.",
  paymentNote:
    "Secure checkout powered by Stripe. The same payment account used for Rooted Farmers shop orders.",
} as const;

export const bloomsPaths = {
  page: "/photos-in-the-blooms",
  booked: "/photos-in-the-blooms/booked",
} as const;
