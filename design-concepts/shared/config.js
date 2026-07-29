/**
 * Grey Gables — Designer's Choice prototype configuration
 * Central source of truth for all Phase 1 concepts.
 * Future collections live here with active: false so they never appear in UI.
 */
window.GG_CONFIG = {
  brand: {
    name: "Grey Gables Farm",
    shortName: "Grey Gables",
    shopLabel: "Shop Flowers",
    tagline: "Floral design from a working flower farm",
  },

  hero: {
    eyebrow: "Shop Flowers",
    title: "Designer's Choice Arrangements",
    lead:
      "Every Grey Gables arrangement is individually created using the freshest flowers available from our farm and trusted growers.",
    supporting:
      "No two arrangements are exactly alike. Choose the scale, presentation, and occasion — then leave the artistry to us.",
  },

  /** Only active offerings render in the customer experience */
  offerings: [
    {
      id: "designers-choice",
      active: true,
      name: "Designer's Choice Arrangements",
      shortName: "Designer's Choice",
      description:
        "Individually designed arrangements using seasonal blooms, delivered ready to display in a vessel.",
      sizes: [
        {
          id: "classic",
          name: "Classic",
          price: 150,
          vesselUpgrade: 40,
          blurb:
            "Perfect for a desk, bedside table, smaller dining table, or thoughtful gift.",
          popular: false,
          image:
            "https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1780969108915-1X3A1390-b350af98.jpg",
          imagePosition: "50% 45%",
          imageAlt: "Classic scale arrangement example",
        },
        {
          id: "signature",
          name: "Signature",
          price: 225,
          vesselUpgrade: 50,
          blurb:
            "Designed for dining tables, celebrations, entertaining, and meaningful occasions.",
          popular: true,
          image:
            "https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1783597232259-IN7A5280-6d032280.jpg",
          imagePosition: "50% 40%",
          imageAlt: "Signature scale arrangement example",
        },
        {
          id: "grand",
          name: "Grand",
          price: 350,
          vesselUpgrade: 75,
          blurb:
            "Created to make a memorable impression with abundant seasonal blooms.",
          popular: false,
          image:
            "https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1781401339985-1X3A1494-3322be5b.jpg",
          imagePosition: "50% 40%",
          imageAlt: "Grand scale abundance example",
        },
      ],
      presentations: [
        {
          id: "signature-glass",
          name: "Signature Glass Vase",
          price: 0,
          included: true,
          description:
            "A timeless glass vase selected to complement the scale and character of your arrangement.",
          shortDescription: "A timeless glass vase chosen to suit your arrangement.",
        },
        {
          id: "curated-keepsake",
          name: "Curated Keepsake Vessel",
          /** Upgrade amount comes from the selected size's vesselUpgrade */
          price: null,
          included: false,
          description:
            "We believe the vessel is as much a part of the design as the flowers themselves. Throughout the year we search for distinctive pieces whose character complements the beauty of seasonal blooms. Each curated vessel is selected to create a one-of-a-kind arrangement and becomes a keepsake you'll enjoy long after the flowers have faded.",
          shortDescription:
            "A distinctive vessel selected for your arrangement — yours to keep.",
          /**
           * Flip true to expose "Choose Your Vessel" + inventory gallery.
           * false = Curated Keepsake is Designer's Choice only (current default).
           * See NOTES-for-production.md.
           */
          allowCustomerVesselChoice: false,
          vesselModes: [
            {
              id: "designer-choice",
              name: "Designer's Choice",
              recommended: true,
              description:
                "We'll select a vessel that beautifully complements your arrangement.",
            },
            {
              id: "choose-vessel",
              name: "Choose Your Vessel",
              recommended: false,
              description:
                "Browse currently available vessels from our curated collection.",
            },
          ],
        },
      ],
      vessels: [
        {
          id: "vessel-fluted-glass",
          name: "Fluted Glass Vase",
          price: 48,
          available: true,
          image: "assets/arrangement-vase-web.jpg",
          imagePosition: "50% 85%",
          alt: "Fluted glass vase from a Grey Gables arrangement",
        },
        {
          id: "vessel-stoneware-cream",
          name: "Cream Stoneware",
          price: 42,
          available: true,
          image: "assets/arrangement-found-web.jpg",
          imagePosition: "50% 90%",
          alt: "Cream stoneware vessel detail",
        },
        {
          id: "vessel-garden-compote",
          name: "Garden Compote",
          price: 55,
          available: true,
          image: "assets/garden-web.jpg",
          imagePosition: "40% 60%",
          alt: "Soft garden tones suggesting a curated vessel",
        },
        {
          id: "vessel-harvest-bowl",
          name: "Harvest Bowl",
          price: 65,
          available: true,
          image: "assets/field-bunches-web.jpg",
          imagePosition: "50% 70%",
          alt: "Harvest-inspired vessel mood",
        },
        {
          id: "vessel-blush-pitcher",
          name: "Blush Pitcher",
          price: 52,
          available: false,
          image: "assets/bb-web.jpg",
          imagePosition: "50% 50%",
          alt: "Soft blush pitcher placeholder",
        },
        {
          id: "vessel-clear-cylinder",
          name: "Clear Cylinder",
          price: 40,
          available: true,
          image: "assets/arrangement-vase-web.jpg",
          imagePosition: "60% 75%",
          alt: "Clear cylinder vase detail",
        },
      ],
    },
    /* Future offerings — structured but hidden from UI */
    {
      id: "teddy-sunflowers",
      active: false,
      name: "Teddy Sunflower Collection",
      shortName: "Teddy Sunflowers",
      description: "Coming later.",
      sizes: [],
      presentations: [],
      vessels: [],
    },
    {
      id: "dahlias",
      active: false,
      name: "Dahlias",
      shortName: "Dahlias",
      description: "Coming later.",
      sizes: [],
      presentations: [],
      vessels: [],
    },
    {
      id: "holiday",
      active: false,
      name: "Holiday Collection",
      shortName: "Holiday",
      description: "Coming later.",
      sizes: [],
      presentations: [],
      vessels: [],
    },
  ],

  occasions: [
    "Birthday",
    "Anniversary",
    "Sympathy",
    "Thank You",
    "Congratulations",
    "Thinking of You",
    "Just Because",
    "Celebration",
    "Other",
  ],

  cardMessage: {
    maxLength: 180,
    placeholder: "Write a short message for the enclosure card…",
  },

  designerNotes: {
    placeholder:
      "Occasion, feeling, or anything we should avoid — guidance, not a recipe.",
  },

  fulfillment: {
    deliveryFee: 15,
    pickupWindows: ["9:00–11:00 AM", "11:00 AM–1:00 PM", "1:00–3:00 PM", "3:00–5:00 PM"],
    deliveryNote: "Local delivery within our service area. Fee shown is a placeholder for this prototype.",
    pickupNote: "Pickup at Grey Gables Farm. We'll confirm your window after the order is placed.",
  },

  gallery: {
    title: "A Glimpse of Our Work",
    copy:
      "Every Grey Gables arrangement is designed individually using the freshest seasonal flowers available. These photographs reflect our aesthetic, scale, and approach to floral design. They are examples of past work rather than arrangements available for exact reproduction. Your arrangement will be created uniquely for your order and may vary in flower variety, color, texture, and vessel.",
    lightboxCaption: "Past Grey Gables Arrangement",
    lightboxNote: "Shown as an example of our style.",
    items: [
      {
        id: "g1",
        src: "assets/arrangement-vase-web.jpg",
        thumb: "assets/arrangement-vase-web.jpg",
        alt: "Past Designer's Choice arrangement in a fluted vase",
        labels: ["Signature Scale", "Curated Vessel"],
        position: "50% 40%",
      },
      {
        id: "g2",
        src: "assets/arrangement-found-web.jpg",
        thumb: "assets/arrangement-found-web.jpg",
        alt: "Past Grey Gables arrangement with seasonal blooms",
        labels: ["Signature Scale"],
        position: "50% 45%",
      },
      {
        id: "g3",
        src: "assets/bb-web.jpg",
        thumb: "assets/bb-web.jpg",
        alt: "Bachelor buttons growing at Grey Gables Farm",
        labels: ["Spring Palette"],
        position: "50% 50%",
      },
      {
        id: "g4",
        src: "assets/garden-web.jpg",
        thumb: "assets/garden-web.jpg",
        alt: "Cutting garden rows at Grey Gables Farm",
        labels: ["From the farm"],
        position: "50% 50%",
      },
      {
        id: "g5",
        src: "assets/field-bunches-web.jpg",
        thumb: "assets/field-bunches-web.jpg",
        alt: "Fresh harvest bunches from the field",
        labels: ["Summer Palette"],
        position: "50% 40%",
      },
      {
        id: "g6",
        src: "assets/hero-web.jpg",
        thumb: "assets/hero-web.jpg",
        alt: "Cut flowers at Grey Gables Farm",
        labels: ["From the farm"],
        position: "50% 45%",
      },
      {
        id: "g7",
        src: "assets/arrangement-vase-web.jpg",
        thumb: "assets/arrangement-vase-web.jpg",
        alt: "Detail of a past Grey Gables arrangement",
        labels: ["Classic Scale"],
        position: "55% 70%",
      },
      {
        id: "g8",
        src: "assets/arrangement-found-web.jpg",
        thumb: "assets/arrangement-found-web.jpg",
        alt: "Closer view of seasonal arrangement style",
        labels: ["Grand Scale"],
        position: "45% 65%",
      },
    ],
  },

  inspiration: {
    title: "Share Inspiration (Optional)",
    copy:
      "See something that speaks to you? Tell us what caught your eye. We'll use it as inspiration rather than attempt an exact reproduction.",
    maxPhotos: 2,
  },

  cta: {
    primary: "Continue with Your Arrangement",
    secondary: "Review & Complete Order",
  },
};

window.GG_activeOffering = function () {
  return window.GG_CONFIG.offerings.find((o) => o.active);
};

window.GG_formatMoney = function (centsOrDollars) {
  const n = Number(centsOrDollars) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
};
