import { DocumentBuilder } from "@nestjs/swagger";

export function createSwaggerConfig(): ReturnType<DocumentBuilder["build"]> {
  return new DocumentBuilder()
    .setTitle("eCommerce Sathi API")
    .setDescription(
      "AI-first, India-native e-commerce platform API. " +
      "Multi-tenant SaaS with built-in payments, GST compliance, logistics, and WhatsApp commerce."
    )
    .setVersion("1.0.0")
    .setContact("eCommerce Sathi", "https://ecommercesathi.com", "api@ecommercesathi.com")
    .setLicense("Proprietary", "https://ecommercesathi.com/terms")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "Enter JWT access token" },
      "JWT-auth",
    )
    .addServer("http://localhost:3001", "Local Development")
    .addServer("https://api.ecommercesathi.com", "Production")
    .addTag("Auth", "Authentication and authorization")
    .addTag("Products", "Product catalog management")
    .addTag("Orders", "Order lifecycle management")
    .addTag("Payments", "Payment processing")
    .addTag("Shipping", "Shipping and logistics")
    .addTag("Storefront", "Public storefront APIs")
    .addTag("GST", "GST and tax compliance")
    .addTag("WhatsApp", "WhatsApp commerce")
    .addTag("AI Builder", "AI store generation")
    .addTag("Analytics", "Business analytics")
    .build();
}
