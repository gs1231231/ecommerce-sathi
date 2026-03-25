import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import { products, categories } from "@ecommerce-sathi/db";
import { AppError } from "../../common/exceptions/app-error";
import { DATABASE_TOKEN, DatabaseInstance } from "../database/database.module";

interface MetaTags {
  title: string;
  description: string;
  ogImage: string | null;
  canonical: string;
  jsonLd: Record<string, unknown>;
}

interface RedirectRule {
  id: string;
  source: string;
  destination: string;
  statusCode: 301 | 302;
  isActive: boolean;
}

@Injectable()
export class SeoService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("SeoService");
  }

  async generateSitemap(tenantId: string, domain: string): Promise<string> {
    const activeProducts = await this.db
      .select({ slug: products.slug, updatedAt: products.updatedAt })
      .from(products)
      .where(and(eq(products.tenantId, tenantId), eq(products.status, "active")));

    const activeCategories = await this.db
      .select({ slug: categories.slug, updatedAt: categories.updatedAt })
      .from(categories)
      .where(and(eq(categories.tenantId, tenantId), eq(categories.isActive, true)));

    const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Homepage
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;

    // Product pages
    for (const product of activeProducts) {
      const lastmod = product.updatedAt
        ? new Date(product.updatedAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/products/${product.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    // Category pages
    for (const category of activeCategories) {
      const lastmod = category.updatedAt
        ? new Date(category.updatedAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/categories/${category.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    this.logger.info(
      { tenantId, productCount: activeProducts.length, categoryCount: activeCategories.length },
      "Sitemap generated",
    );

    return xml;
  }

  generateRobotsTxt(domain: string): string {
    const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;

    return [
      "User-agent: *",
      "Allow: /",
      "Disallow: /api/",
      "Disallow: /admin/",
      "Disallow: /checkout/",
      "Disallow: /account/",
      "",
      `Sitemap: ${baseUrl}/api/seo/sitemap.xml`,
    ].join("\n");
  }

  async getMetaTags(
    tenantId: string,
    pageType: "home" | "product" | "category",
    slug?: string,
  ): Promise<MetaTags> {
    if (pageType === "product") {
      if (!slug) {
        throw new AppError(
          "SLUG_REQUIRED",
          "Slug is required for product page type",
          HttpStatus.BAD_REQUEST,
        );
      }

      const [product] = await this.db
        .select()
        .from(products)
        .where(and(eq(products.tenantId, tenantId), eq(products.slug, slug)))
        .limit(1);

      if (!product) {
        throw new AppError("PRODUCT_NOT_FOUND", "Product not found", HttpStatus.NOT_FOUND);
      }

      return {
        title: product.seoTitle ?? product.title,
        description: product.seoDescription ?? product.description ?? "",
        ogImage: null,
        canonical: `/products/${product.slug}`,
        jsonLd: this.generateStructuredData("Product", {
          name: product.title,
          description: product.description,
          slug: product.slug,
        }),
      };
    }

    if (pageType === "category") {
      if (!slug) {
        throw new AppError(
          "SLUG_REQUIRED",
          "Slug is required for category page type",
          HttpStatus.BAD_REQUEST,
        );
      }

      const [category] = await this.db
        .select()
        .from(categories)
        .where(and(eq(categories.tenantId, tenantId), eq(categories.slug, slug)))
        .limit(1);

      if (!category) {
        throw new AppError("CATEGORY_NOT_FOUND", "Category not found", HttpStatus.NOT_FOUND);
      }

      return {
        title: category.seoTitle ?? category.name,
        description: category.seoDescription ?? category.description ?? "",
        ogImage: category.imageUrl,
        canonical: `/categories/${category.slug}`,
        jsonLd: this.generateStructuredData("BreadcrumbList", {
          name: category.name,
          slug: category.slug,
        }),
      };
    }

    // Home page
    return {
      title: "Welcome to Our Store",
      description: "Discover amazing products at great prices",
      ogImage: null,
      canonical: "/",
      jsonLd: this.generateStructuredData("Organization", {
        name: "eCommerce Sathi Store",
      }),
    };
  }

  generateStructuredData(
    type: "Product" | "Organization" | "BreadcrumbList",
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    if (type === "Product") {
      return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: data.name,
        description: data.description ?? "",
        url: data.slug ? `/products/${data.slug as string}` : undefined,
      };
    }

    if (type === "Organization") {
      return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: data.name,
        url: data.url ?? "/",
      };
    }

    if (type === "BreadcrumbList") {
      return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: data.name,
            item: data.slug ? `/categories/${data.slug as string}` : undefined,
          },
        ],
      };
    }

    return {};
  }

  async getRedirects(tenantId: string): Promise<RedirectRule[]> {
    this.logger.info({ tenantId }, "Fetching redirect rules");

    // Mock redirect rules
    return [
      {
        id: "redirect_001",
        source: "/old-product",
        destination: "/products/new-product",
        statusCode: 301,
        isActive: true,
      },
      {
        id: "redirect_002",
        source: "/sale",
        destination: "/categories/sale-items",
        statusCode: 302,
        isActive: true,
      },
    ];
  }
}
