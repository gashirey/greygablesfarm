/**
 * Site copy — edit here to update pages without touching components.
 */

export const site = {
  name: "Grey Gables Farm",
  domain: "greygablesfarm.com",
  tagline: "Seasonal flowers grown in Virginia",
  description: "Field-grown stems. Weekly harvest availability.",
  email: "info@greygablesfarm.com",
  /** Full mailing / farm address */
  address: {
    street: "2217 Brickhouse Rd",
    city: "Louisa",
    state: "VA",
  },
  /** One-line address for display */
  location: "2217 Brickhouse Rd, Louisa, VA",
  /** Regional label for SEO and hero copy */
  locationShort: "Louisa, Virginia",
  locationRegion: "Central Virginia",
  /** Shown on Contact — adjust if you add regular open hours */
  visitNote: "Pickup and visits are by appointment.",
  logo: "/images/logo.jpg",
  logoAlt: "Grey Gables Farm",
  heroImage: "/images/hero.jpg",
  heroImageAlt: "Cut flowers at Grey Gables Farm, Louisa Virginia",
} as const;

export const heroHome = {
  title: "Grown here. Arranged here. Delivered today.",
  subtitle:
    "Custom arrangements grown and designed on our Louisa County farm — delivered same-day across Central Virginia.",
  primaryCta: { label: "Send flowers", href: "/send-flowers" },
  secondaryCta: { label: "See what's growing", href: "/available-now" },
} as const;

/** Single image on homepage — calmer hero */
export const heroHomeSlide = {
  src: site.heroImage,
  alt: site.heroImageAlt,
} as const;

export const heroSlides = [
  heroHomeSlide,
  {
    src: "/images/bb.jpg",
    alt: "Mixed seasonal bouquet from Grey Gables Farm",
  },
  {
    src: "/images/garden_row.jpg",
    alt: "Cutting garden rows at Grey Gables Farm",
  },
] as const;

export const homeAbout = [
  "Grey Gables Farm is a Central Virginia flower farm growing seasonal cut flowers for markets, events, and everyday use.",
  "We focus on varieties selected for seasonality, color, and vase life.",
] as const;

export const homeSections = {
  availability: {
    title: "Current availability",
    description: "Seasonal harvests — updated weekly.",
  },
} as const;

export const homeCta = {
  note: "Central Virginia grown. Limited quantities each week.",
  rooted: "Shop on Rooted",
  contact: "Contact the farm",
} as const;

export type HeroFrame = "bleed" | "inset";

/** @deprecated Prefer lib/site-theme.ts activeHeroFrame */
export const homeHeroFrame: HeroFrame = "bleed";

export const availabilityUpdated = "2026-05-19";

export const announcement = {
  enabled: false,
  message: "Weekly listings updated from the field.",
} as const;

/** Public “See what's growing” page at /available-now */
export const availabilityPage = {
  enabled: true,
} as const;

export const subscribe = {
  heading: "Weekly list",
  description: "Email or text when availability is posted.",
  firstNameLabel: "First name",
  lastNameLabel: "Last name",
  firstNamePlaceholder: "Jane",
  lastNamePlaceholder: "Doe",
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  phoneLabel: "Mobile phone",
  phonePlaceholder: "(540) 555-1234",
  submitButton: "Sign up",
  success: "You're on the list.",
  emailOptIn: "Email me availability updates.",
  smsOptIn:
    "Text me from Grey Gables Farm. Msg & data rates may apply. Reply STOP to opt out.",
  optInRequired: "Choose email or text updates (or both).",
  notConfigured: "Sign-ups are almost ready.",
} as const;

export const social = {
  instagram: "https://www.instagram.com/grey.gables.flowerfarm/" as string,
  instagramHandle: "@grey.gables.flowerfarm",
} as const;

export const ordering = {
  intro: "Updated weekly from the field.",
  steps: [
    {
      title: "Current availability",
      text: "Stems, bunches, and pricing for this week.",
    },
    {
      title: "Order",
      text: "Shop on Rooted or email to reserve.",
    },
    {
      title: "Pickup",
      text: "Confirmed by email. By appointment.",
    },
  ],
  pickupNote: "Event florals — contact the farm.",
} as const;

export const nav = [
  { label: "Send Flowers", href: "/send-flowers", cta: true },
  { label: "Home", href: "/" },
  { label: "Availability", href: "/available-now" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export type AvailabilityItem = {
  id: string;
  name: string;
  description: string;
  status: "available" | "limited" | "seasonal";
  image: string;
  imageAlt: string;
};

/** Fallback when live inventory is empty — keep descriptions short */
export const currentAvailability: AvailabilityItem[] = [
  {
    id: "mixed-bouquets",
    name: "Mixed bunches",
    description: "What’s in bloom this week.",
    status: "available",
    image: "/images/bb.jpg",
    imageAlt: "Mixed seasonal bouquet",
  },
  {
    id: "zinnias",
    name: "Zinnias",
    description: "Limited harvest.",
    status: "limited",
    image: "/images/bb.jpg",
    imageAlt: "Zinnia stems",
  },
];

export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  caption?: string;
};

export const galleryImages: GalleryImage[] = [];
