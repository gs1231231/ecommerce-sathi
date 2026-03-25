import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and, sql } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import {
  DATABASE_TOKEN,
  DatabaseInstance,
} from "../database/database.module";
import { AppError } from "../../common/exceptions/app-error";

interface SupportedLocale {
  code: string;
  name: string;
}

interface TranslatedProduct {
  productId: string;
  locale: string;
  title: string;
  description: string;
}

interface TranslationMap {
  [key: string]: string;
}

const SUPPORTED_LOCALES: SupportedLocale[] = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "bn", name: "Bengali" },
  { code: "mr", name: "Marathi" },
  { code: "gu", name: "Gujarati" },
  { code: "kn", name: "Kannada" },
];

const UI_TRANSLATIONS: Record<string, TranslationMap> = {
  en: {
    add_to_cart: "Add to Cart",
    checkout: "Checkout",
    buy_now: "Buy Now",
    search: "Search",
    categories: "Categories",
    my_orders: "My Orders",
    my_account: "My Account",
    home: "Home",
    products: "Products",
    cart: "Cart",
    wishlist: "Wishlist",
    order_placed: "Order Placed",
    continue_shopping: "Continue Shopping",
    apply_coupon: "Apply Coupon",
    total: "Total",
    subtotal: "Subtotal",
    shipping: "Shipping",
    tax: "Tax",
  },
  hi: {
    add_to_cart: "कार्ट में जोड़ें",
    checkout: "चेकआउट",
    buy_now: "अभी खरीदें",
    search: "खोजें",
    categories: "श्रेणियाँ",
    my_orders: "मेरे ऑर्डर",
    my_account: "मेरा खाता",
    home: "होम",
    products: "उत्पाद",
    cart: "कार्ट",
    wishlist: "विशलिस्ट",
    order_placed: "ऑर्डर हो गया",
    continue_shopping: "खरीदारी जारी रखें",
    apply_coupon: "कूपन लागू करें",
    total: "कुल",
    subtotal: "उप-कुल",
    shipping: "शिपिंग",
    tax: "कर",
  },
};

@Injectable()
export class I18nService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("I18nService");
  }

  getSupportedLocales(): SupportedLocale[] {
    return SUPPORTED_LOCALES;
  }

  async translateText(text: string, targetLocale: string): Promise<{ text: string; locale: string }> {
    const locale = SUPPORTED_LOCALES.find((l) => l.code === targetLocale);
    if (!locale) {
      throw new AppError(
        "UNSUPPORTED_LOCALE",
        `Locale '${targetLocale}' is not supported`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (targetLocale === "en") {
      return { text, locale: targetLocale };
    }

    // MVP: Mock translation with locale prefix
    // In production, this would use Claude API for translation
    const translatedText = `[${targetLocale}] ${text}`;

    this.logger.info(
      { targetLocale, textLength: text.length },
      "Text translated (mock)",
    );

    return { text: translatedText, locale: targetLocale };
  }

  async translateProduct(
    tenantId: string,
    productId: string,
    targetLocale: string,
  ): Promise<TranslatedProduct> {
    const locale = SUPPORTED_LOCALES.find((l) => l.code === targetLocale);
    if (!locale) {
      throw new AppError(
        "UNSUPPORTED_LOCALE",
        `Locale '${targetLocale}' is not supported`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // MVP: Mock product translation
    // In production, would fetch product from DB and translate via Claude API
    const mockTitle = `[${targetLocale}] Product ${productId} Title`;
    const mockDescription = `[${targetLocale}] Product ${productId} Description`;

    this.logger.info(
      { tenantId, productId, targetLocale },
      "Product translated (mock)",
    );

    return {
      productId,
      locale: targetLocale,
      title: mockTitle,
      description: mockDescription,
    };
  }

  getTranslations(tenantId: string, locale: string): TranslationMap {
    const supportedLocale = SUPPORTED_LOCALES.find((l) => l.code === locale);
    if (!supportedLocale) {
      throw new AppError(
        "UNSUPPORTED_LOCALE",
        `Locale '${locale}' is not supported`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Return locale-specific translations if available, otherwise English
    const translations = UI_TRANSLATIONS[locale] ?? UI_TRANSLATIONS["en"];

    this.logger.info(
      { tenantId, locale, keyCount: Object.keys(translations as TranslationMap).length },
      "Translations retrieved",
    );

    return translations as TranslationMap;
  }
}
