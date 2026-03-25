import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and, sql, gte, lt } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import { orders, orderItems } from "@ecommerce-sathi/db";
import { AppError } from "../../common/exceptions/app-error";
import {
  DATABASE_TOKEN,
  DatabaseInstance,
} from "../database/database.module";

// HSN lookup table for common e-commerce product categories (MVP)
interface HsnEntry {
  code: string;
  description: string;
  gstRate: number;
}

const HSN_LOOKUP: Record<string, HsnEntry[]> = {
  clothing: [
    { code: "6109", description: "T-shirts, singlets, tank tops - knitted", gstRate: 5 },
    { code: "6204", description: "Women's suits, dresses, skirts - woven", gstRate: 12 },
    { code: "6205", description: "Men's shirts - woven", gstRate: 12 },
  ],
  electronics: [
    { code: "8471", description: "Computers and peripherals", gstRate: 18 },
    { code: "8517", description: "Telephones, smartphones", gstRate: 18 },
    { code: "8528", description: "Monitors, TVs, projectors", gstRate: 18 },
  ],
  footwear: [
    { code: "6401", description: "Waterproof footwear, rubber/plastic", gstRate: 12 },
    { code: "6402", description: "Footwear with outer soles of rubber/plastic", gstRate: 12 },
    { code: "6403", description: "Footwear with leather uppers", gstRate: 18 },
  ],
  food: [
    { code: "0904", description: "Pepper, chillies - dried/ground", gstRate: 5 },
    { code: "1006", description: "Rice", gstRate: 5 },
    { code: "1905", description: "Bread, pastry, cakes, biscuits", gstRate: 18 },
  ],
  cosmetics: [
    { code: "3304", description: "Beauty/makeup preparations, skincare", gstRate: 28 },
    { code: "3305", description: "Hair preparations, shampoos", gstRate: 18 },
    { code: "3307", description: "Perfumes, deodorants", gstRate: 28 },
  ],
  furniture: [
    { code: "9401", description: "Seats and chairs", gstRate: 18 },
    { code: "9403", description: "Other furniture (tables, desks, shelves)", gstRate: 18 },
    { code: "9404", description: "Mattresses, bedding", gstRate: 18 },
  ],
  jewellery: [
    { code: "7113", description: "Articles of jewellery, precious metals", gstRate: 3 },
    { code: "7117", description: "Imitation jewellery", gstRate: 12 },
    { code: "7114", description: "Articles of goldsmiths/silversmiths", gstRate: 3 },
  ],
  books: [
    { code: "4901", description: "Printed books, brochures, leaflets", gstRate: 0 },
    { code: "4902", description: "Newspapers, journals, periodicals", gstRate: 0 },
    { code: "4903", description: "Children's picture/drawing/colouring books", gstRate: 0 },
  ],
  toys: [
    { code: "9503", description: "Toys, scale models, puzzles", gstRate: 12 },
    { code: "9504", description: "Video game consoles, arcade machines", gstRate: 18 },
    { code: "9505", description: "Festive, carnival, entertainment articles", gstRate: 12 },
  ],
  bags: [
    { code: "4202", description: "Trunks, suitcases, handbags, wallets", gstRate: 18 },
    { code: "4203", description: "Leather articles (belts, straps)", gstRate: 18 },
    { code: "3923", description: "Plastic bags, sacks, containers", gstRate: 18 },
  ],
};

// Keyword to category mapping for smart matching
const KEYWORD_CATEGORY_MAP: Record<string, string> = {
  shirt: "clothing",
  tshirt: "clothing",
  "t-shirt": "clothing",
  dress: "clothing",
  jeans: "clothing",
  pants: "clothing",
  kurta: "clothing",
  saree: "clothing",
  phone: "electronics",
  mobile: "electronics",
  laptop: "electronics",
  computer: "electronics",
  tablet: "electronics",
  headphone: "electronics",
  shoes: "footwear",
  sandals: "footwear",
  boots: "footwear",
  sneakers: "footwear",
  chappal: "footwear",
  cream: "cosmetics",
  shampoo: "cosmetics",
  perfume: "cosmetics",
  lipstick: "cosmetics",
  makeup: "cosmetics",
  skincare: "cosmetics",
  rice: "food",
  spice: "food",
  biscuit: "food",
  snack: "food",
  tea: "food",
  coffee: "food",
  chair: "furniture",
  table: "furniture",
  desk: "furniture",
  sofa: "furniture",
  bed: "furniture",
  mattress: "furniture",
  ring: "jewellery",
  necklace: "jewellery",
  bracelet: "jewellery",
  earring: "jewellery",
  gold: "jewellery",
  book: "books",
  novel: "books",
  textbook: "books",
  toy: "toys",
  game: "toys",
  puzzle: "toys",
  bag: "bags",
  handbag: "bags",
  suitcase: "bags",
  wallet: "bags",
  backpack: "bags",
};

interface HsnSuggestion {
  hsnCode: string;
  description: string;
  gstRate: number;
  confidence: "high" | "medium" | "low";
}

interface GstCalculationItem {
  amount: number;
  gstRate: number;
  hsnCode?: string;
  quantity: number;
}

interface GstCalculationResult {
  items: Array<{
    amount: number;
    gstRate: number;
    hsnCode?: string;
    quantity: number;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    totalWithTax: number;
  }>;
  summary: {
    totalTaxableValue: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalTax: number;
    grandTotal: number;
    isInterState: boolean;
  };
}

interface Gstr1Entry {
  invoiceNumber: string;
  invoiceDate: string;
  orderNumber: number;
  customerState: string;
  taxableValue: string;
  cgst: string;
  sgst: string;
  igst: string;
  totalTax: string;
  invoiceValue: string;
  placeOfSupply: string;
}

interface Gstr1Summary {
  month: number;
  year: number;
  b2bInvoices: Gstr1Entry[];
  totalTaxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  totalInvoices: number;
}

@Injectable()
export class GstService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("GstService");
  }

  suggestHsnCode(
    title: string,
    description: string,
    category?: string,
  ): HsnSuggestion[] {
    const searchText = `${title} ${description} ${category ?? ""}`.toLowerCase();

    // Try direct category match first
    if (category) {
      const normalizedCategory = category.toLowerCase().trim();
      const directMatch = HSN_LOOKUP[normalizedCategory];
      if (directMatch) {
        return directMatch.map((entry) => ({
          hsnCode: entry.code,
          description: entry.description,
          gstRate: entry.gstRate,
          confidence: "high" as const,
        }));
      }
    }

    // Try keyword-based matching
    const matchedCategories = new Set<string>();
    for (const [keyword, cat] of Object.entries(KEYWORD_CATEGORY_MAP)) {
      if (searchText.includes(keyword)) {
        matchedCategories.add(cat);
      }
    }

    if (matchedCategories.size > 0) {
      const results: HsnSuggestion[] = [];
      for (const cat of matchedCategories) {
        const entries = HSN_LOOKUP[cat];
        if (entries) {
          for (const entry of entries) {
            if (results.length < 3) {
              results.push({
                hsnCode: entry.code,
                description: entry.description,
                gstRate: entry.gstRate,
                confidence: matchedCategories.size === 1 ? "high" : "medium",
              });
            }
          }
        }
      }
      return results.slice(0, 3);
    }

    // Fallback: return generic goods HSN
    this.logger.warn(
      { title, description, category },
      "No HSN match found, returning generic suggestion",
    );
    return [
      {
        hsnCode: "4901",
        description: "General goods - verify manually",
        gstRate: 18,
        confidence: "low",
      },
    ];
  }

  calculateGst(
    items: GstCalculationItem[],
    shippingState: string,
    merchantState: string,
  ): GstCalculationResult {
    if (items.length === 0) {
      throw new AppError(
        "GST_NO_ITEMS",
        "At least one item is required for GST calculation",
        HttpStatus.BAD_REQUEST,
      );
    }

    const isInterState =
      shippingState.toLowerCase().trim() !== merchantState.toLowerCase().trim();

    let totalTaxableValue = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalTax = 0;
    let grandTotal = 0;

    const calculatedItems = items.map((item) => {
      const taxableValue = item.amount * item.quantity;
      const taxAmount = (taxableValue * item.gstRate) / 100;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (isInterState) {
        igst = Math.round(taxAmount * 100) / 100;
      } else {
        cgst = Math.round((taxAmount / 2) * 100) / 100;
        sgst = Math.round((taxAmount / 2) * 100) / 100;
      }

      const itemTotalTax = cgst + sgst + igst;
      const totalWithTax = Math.round((taxableValue + itemTotalTax) * 100) / 100;

      totalTaxableValue += taxableValue;
      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;
      totalTax += itemTotalTax;
      grandTotal += totalWithTax;

      return {
        amount: item.amount,
        gstRate: item.gstRate,
        hsnCode: item.hsnCode,
        quantity: item.quantity,
        taxableValue: Math.round(taxableValue * 100) / 100,
        cgst,
        sgst,
        igst,
        totalTax: Math.round(itemTotalTax * 100) / 100,
        totalWithTax,
      };
    });

    return {
      items: calculatedItems,
      summary: {
        totalTaxableValue: Math.round(totalTaxableValue * 100) / 100,
        totalCgst: Math.round(totalCgst * 100) / 100,
        totalSgst: Math.round(totalSgst * 100) / 100,
        totalIgst: Math.round(totalIgst * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        grandTotal: Math.round(grandTotal * 100) / 100,
        isInterState,
      },
    };
  }

  async generateInvoiceNumber(
    tenantId: string,
    financialYear: string,
  ): Promise<string> {
    // Financial year format: "2026" (represents FY 2025-26)
    const yearPattern = `INV-${financialYear}-%`;

    // Find the max invoice number for this tenant and financial year
    const result = await this.db.execute(
      sql`SELECT COUNT(*) as count FROM orders WHERE tenant_id = ${tenantId} AND created_at >= ${`${parseInt(financialYear, 10) - 1}-04-01`}::timestamp AND created_at < ${`${financialYear}-04-01`}::timestamp`,
    );

    const count = Number(result[0]?.count ?? 0);
    const nextNumber = count + 1;
    const paddedNumber = String(nextNumber).padStart(4, "0");

    const invoiceNumber = `INV-${financialYear}-${paddedNumber}`;

    this.logger.info(
      { tenantId, financialYear, invoiceNumber },
      "Generated invoice number",
    );

    return invoiceNumber;
  }

  async getGstr1Summary(
    tenantId: string,
    month: number,
    year: number,
  ): Promise<Gstr1Summary> {
    if (month < 1 || month > 12) {
      throw new AppError(
        "INVALID_MONTH",
        "Month must be between 1 and 12",
        HttpStatus.BAD_REQUEST,
      );
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Fetch all completed orders for the period
    const periodOrders = await this.db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          gte(orders.createdAt, startDate),
          lt(orders.createdAt, endDate),
        ),
      );

    const b2bInvoices: Gstr1Entry[] = [];
    let totalTaxableValue = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalTax = 0;

    for (const order of periodOrders) {
      // Fetch order items for tax breakdown
      const items = await this.db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      let orderTaxableValue = 0;
      let orderTaxAmount = 0;

      for (const item of items) {
        orderTaxableValue += parseFloat(item.unitPrice) * item.quantity;
        orderTaxAmount += parseFloat(item.taxAmount);
      }

      const shippingAddress = order.shippingAddress as {
        state?: string;
      } | null;

      const customerState = shippingAddress?.state ?? "Unknown";

      // For GSTR-1, we split tax into CGST/SGST or IGST
      // Without merchant state info in orders, assume intra-state for now
      const cgst = Math.round((orderTaxAmount / 2) * 100) / 100;
      const sgst = Math.round((orderTaxAmount / 2) * 100) / 100;
      const igst = 0;

      const invoiceNumber = `INV-${year}-${String(order.orderNumber).padStart(4, "0")}`;

      b2bInvoices.push({
        invoiceNumber,
        invoiceDate: order.createdAt.toISOString().split("T")[0] ?? "",
        orderNumber: order.orderNumber,
        customerState,
        taxableValue: orderTaxableValue.toFixed(2),
        cgst: cgst.toFixed(2),
        sgst: sgst.toFixed(2),
        igst: igst.toFixed(2),
        totalTax: orderTaxAmount.toFixed(2),
        invoiceValue: parseFloat(order.grandTotal).toFixed(2),
        placeOfSupply: customerState,
      });

      totalTaxableValue += orderTaxableValue;
      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;
      totalTax += orderTaxAmount;
    }

    this.logger.info(
      { tenantId, month, year, totalInvoices: b2bInvoices.length },
      "GSTR-1 summary generated",
    );

    return {
      month,
      year,
      b2bInvoices,
      totalTaxableValue: Math.round(totalTaxableValue * 100) / 100,
      totalCgst: Math.round(totalCgst * 100) / 100,
      totalSgst: Math.round(totalSgst * 100) / 100,
      totalIgst: Math.round(totalIgst * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalInvoices: b2bInvoices.length,
    };
  }
}
