import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { AppError } from "../../common/exceptions/app-error";
import { DATABASE_TOKEN, DatabaseInstance } from "../database/database.module";

interface BusinessAnalysis {
  businessType: string;
  productCategories: string[];
  priceRange: string;
  targetDemographic: string;
  brandPersonality: [string, string, string];
  suggestedColors: { primary: string; secondary: string; accent: string };
  suggestedFontPairing: { heading: string; body: string };
}

interface ThemeConfig {
  style: string;
  colors: { primary: string; secondary: string; accent: string; background: string; text: string };
  fonts: { heading: string; body: string };
  borderRadius: string;
  spacing: string;
}

interface StoreContent {
  heroHeadline: string;
  heroSubheadline: string;
  ctaText: string;
  aboutUsText: string;
  seoTitle: string;
  seoDescription: string;
  featureHighlights: [string, string, string];
  footerTagline: string;
}

interface GenerateStoreInput {
  businessDescription: string;
  targetAudience?: string;
  style?: string;
  language?: string;
}

interface GenerateStoreResult {
  analysis: BusinessAnalysis;
  theme: ThemeConfig;
  content: StoreContent;
}

interface IterateStoreResult {
  blockId: string;
  instruction: string;
  updatedBlock: Record<string, unknown>;
}

const STYLE_PROFILES = {
  luxury: {
    colors: { primary: "#1a1a2e", secondary: "#c9a84c", accent: "#e8d5b7", background: "#faf8f5", text: "#1a1a2e" },
    fonts: { heading: "Playfair Display", body: "Lora" },
    borderRadius: "0px",
    spacing: "relaxed",
    personality: ["Elegant", "Premium", "Sophisticated"] as [string, string, string],
  },
  modern: {
    colors: { primary: "#2563eb", secondary: "#1e40af", accent: "#3b82f6", background: "#ffffff", text: "#111827" },
    fonts: { heading: "Inter", body: "Inter" },
    borderRadius: "8px",
    spacing: "balanced",
    personality: ["Innovative", "Clean", "Trustworthy"] as [string, string, string],
  },
  minimal: {
    colors: { primary: "#2d6a4f", secondary: "#40916c", accent: "#95d5b2", background: "#f8faf8", text: "#1b4332" },
    fonts: { heading: "DM Sans", body: "DM Sans" },
    borderRadius: "4px",
    spacing: "airy",
    personality: ["Natural", "Simple", "Authentic"] as [string, string, string],
  },
} as const;

type StyleKey = keyof typeof STYLE_PROFILES;

@Injectable()
export class AiBuilderService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("AiBuilderService");
  }

  analyzeBusinessDescription(
    description: string,
    targetAudience?: string,
    style?: string,
  ): BusinessAnalysis {
    if (!description || description.trim().length === 0) {
      throw new AppError(
        "AI_BUILDER_INVALID_INPUT",
        "Business description is required",
        HttpStatus.BAD_REQUEST,
      );
    }

    const lower = description.toLowerCase();
    const detectedStyle = this.detectStyle(lower, style);
    const profile = STYLE_PROFILES[detectedStyle];

    const businessType = this.detectBusinessType(lower);
    const productCategories = this.detectCategories(lower);
    const priceRange = detectedStyle === "luxury" ? "premium" : "mid-range";
    const targetDemographic =
      targetAudience || this.inferDemographic(detectedStyle);

    this.logger.info(
      { businessType, detectedStyle },
      "Analyzed business description",
    );

    return {
      businessType,
      productCategories,
      priceRange,
      targetDemographic,
      brandPersonality: [...profile.personality],
      suggestedColors: {
        primary: profile.colors.primary,
        secondary: profile.colors.secondary,
        accent: profile.colors.accent,
      },
      suggestedFontPairing: {
        heading: profile.fonts.heading,
        body: profile.fonts.body,
      },
    };
  }

  generateThemeConfig(analysis: BusinessAnalysis): ThemeConfig {
    const styleKey = this.matchStyleFromAnalysis(analysis);
    const profile = STYLE_PROFILES[styleKey];

    return {
      style: styleKey,
      colors: { ...profile.colors },
      fonts: { ...profile.fonts },
      borderRadius: profile.borderRadius,
      spacing: profile.spacing,
    };
  }

  generateContent(
    storeName: string,
    analysis: BusinessAnalysis,
    language?: string,
  ): StoreContent {
    if (!storeName || storeName.trim().length === 0) {
      throw new AppError(
        "AI_BUILDER_INVALID_INPUT",
        "Store name is required for content generation",
        HttpStatus.BAD_REQUEST,
      );
    }

    const lang = language || "en";
    const categoryText = analysis.productCategories.slice(0, 2).join(" & ");
    const personalityText = analysis.brandPersonality.join(", ");

    if (lang === "hi") {
      return {
        heroHeadline: `${storeName} - ${analysis.businessType} में आपका स्वागत है`,
        heroSubheadline: `${categoryText} के लिए सबसे अच्छा संग्रह`,
        ctaText: "अभी खरीदें",
        aboutUsText: `${storeName} ${analysis.businessType} में विशेषज्ञ है। हम ${personalityText} उत्पाद प्रदान करते हैं जो ${analysis.targetDemographic} के लिए बनाए गए हैं।`,
        seoTitle: `${storeName} - ${categoryText} | ऑनलाइन स्टोर`,
        seoDescription: `${storeName} पर ${categoryText} खरीदें। ${analysis.priceRange} रेंज में ${analysis.businessType} उत्पाद।`,
        featureHighlights: [
          "तेज़ और मुफ़्त डिलीवरी",
          "100% असली उत्पाद",
          "आसान रिटर्न पॉलिसी",
        ],
        footerTagline: `${storeName} - ${personalityText}`,
      };
    }

    return {
      heroHeadline: `Welcome to ${storeName}`,
      heroSubheadline: `Discover our curated collection of ${categoryText} — crafted for the ${analysis.targetDemographic}.`,
      ctaText: "Shop Now",
      aboutUsText: `${storeName} is your destination for ${analysis.businessType}. We bring you ${personalityText.toLowerCase()} products designed for ${analysis.targetDemographic}. Every item in our ${analysis.priceRange} collection is handpicked to deliver quality and value.`,
      seoTitle: `${storeName} - ${categoryText} | Online Store`,
      seoDescription: `Shop ${categoryText} at ${storeName}. ${analysis.priceRange.charAt(0).toUpperCase() + analysis.priceRange.slice(1)} ${analysis.businessType} products for ${analysis.targetDemographic}.`,
      featureHighlights: [
        "Fast & Free Delivery",
        "100% Authentic Products",
        "Easy Returns & Exchanges",
      ],
      footerTagline: `${storeName} — ${personalityText}`,
    };
  }

  generateStore(input: GenerateStoreInput): GenerateStoreResult {
    const { businessDescription, targetAudience, style, language } = input;

    this.logger.info("Starting full store generation pipeline");

    const analysis = this.analyzeBusinessDescription(
      businessDescription,
      targetAudience,
      style,
    );
    const theme = this.generateThemeConfig(analysis);
    const storeName = this.extractStoreName(businessDescription);
    const content = this.generateContent(storeName, analysis, language);

    this.logger.info(
      { storeName, style: theme.style },
      "Store generation complete",
    );

    return { analysis, theme, content };
  }

  iterateStore(
    storeId: string,
    instruction: string,
  ): IterateStoreResult {
    if (!storeId || !instruction) {
      throw new AppError(
        "AI_BUILDER_INVALID_INPUT",
        "Store ID and instruction are required",
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.info({ storeId, instruction }, "Iterating on store");

    return {
      blockId: storeId,
      instruction,
      updatedBlock: {
        type: "section",
        content: `Updated based on instruction: "${instruction}"`,
        modified: true,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private detectStyle(lower: string, explicitStyle?: string): StyleKey {
    if (explicitStyle && explicitStyle in STYLE_PROFILES) {
      return explicitStyle as StyleKey;
    }

    const luxuryKeywords = [
      "leather", "bags", "fashion", "luxury", "premium", "designer",
      "silk", "jewelry", "jewellery", "watch", "watches", "haute",
    ];
    const modernKeywords = [
      "electronics", "gadgets", "tech", "software", "digital", "saas",
      "app", "device", "computer", "phone", "mobile",
    ];
    const minimalKeywords = [
      "food", "organic", "natural", "wellness", "health", "ayurvedic",
      "herbal", "eco", "sustainable", "green", "farm",
    ];

    if (luxuryKeywords.some((kw) => lower.includes(kw))) return "luxury";
    if (modernKeywords.some((kw) => lower.includes(kw))) return "modern";
    if (minimalKeywords.some((kw) => lower.includes(kw))) return "minimal";

    return "modern";
  }

  private detectBusinessType(lower: string): string {
    if (lower.includes("fashion") || lower.includes("clothing") || lower.includes("apparel"))
      return "Fashion & Apparel";
    if (lower.includes("electronics") || lower.includes("gadget") || lower.includes("tech"))
      return "Electronics & Gadgets";
    if (lower.includes("food") || lower.includes("grocery") || lower.includes("organic"))
      return "Food & Grocery";
    if (lower.includes("jewelry") || lower.includes("jewellery"))
      return "Jewelry & Accessories";
    if (lower.includes("leather") || lower.includes("bags"))
      return "Leather & Bags";
    if (lower.includes("health") || lower.includes("wellness") || lower.includes("ayurvedic"))
      return "Health & Wellness";
    if (lower.includes("home") || lower.includes("decor") || lower.includes("furniture"))
      return "Home & Decor";
    return "General Retail";
  }

  private detectCategories(lower: string): string[] {
    const categoryMap: Record<string, string[]> = {
      fashion: ["Clothing", "Accessories", "Footwear"],
      electronics: ["Gadgets", "Accessories", "Components"],
      food: ["Packaged Foods", "Fresh Produce", "Beverages"],
      leather: ["Bags", "Wallets", "Belts"],
      jewelry: ["Necklaces", "Rings", "Earrings"],
      health: ["Supplements", "Skincare", "Wellness"],
      home: ["Furniture", "Decor", "Kitchen"],
    };

    for (const [keyword, categories] of Object.entries(categoryMap)) {
      if (lower.includes(keyword)) return categories;
    }

    return ["Products", "Accessories", "New Arrivals"];
  }

  private inferDemographic(style: StyleKey): string {
    const demographics: Record<StyleKey, string> = {
      luxury: "discerning professionals aged 25-45",
      modern: "tech-savvy millennials and Gen Z",
      minimal: "health-conscious urban consumers",
    };
    return demographics[style];
  }

  private matchStyleFromAnalysis(analysis: BusinessAnalysis): StyleKey {
    const personality = analysis.brandPersonality.join(" ").toLowerCase();
    if (personality.includes("elegant") || personality.includes("premium"))
      return "luxury";
    if (personality.includes("natural") || personality.includes("simple"))
      return "minimal";
    return "modern";
  }

  private extractStoreName(description: string): string {
    const words = description.trim().split(/\s+/);
    if (words.length <= 3) return description.trim();
    return words.slice(0, 3).join(" ");
  }
}
