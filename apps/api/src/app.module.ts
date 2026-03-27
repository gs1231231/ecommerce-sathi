import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware";
import { RateLimitMiddleware } from "./common/middleware/rate-limit.middleware";
import { HealthController } from "./common/health.controller";
import { DatabaseModule } from "./modules/database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { TenantModule } from "./modules/tenant/tenant.module";
import { ProductModule } from "./modules/product/product.module";
import { OrderModule } from "./modules/order/order.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { ShippingModule } from "./modules/shipping/shipping.module";
import { StorefrontModule } from "./modules/storefront/storefront.module";
import { GstModule } from "./modules/gst/gst.module";
import { CodModule } from "./modules/cod/cod.module";
import { WhatsAppModule } from "./modules/whatsapp/whatsapp.module";
import { AiBuilderModule } from "./modules/ai-builder/ai-builder.module";
import { AiImagesModule } from "./modules/ai-images/ai-images.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { SeoModule } from "./modules/seo/seo.module";
import { CustomerModule } from "./modules/customer/customer.module";
import { DiscountModule } from "./modules/discount/discount.module";
import { WebhookModule } from "./modules/webhook/webhook.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { StaffModule } from "./modules/staff/staff.module";
import { DomainModule } from "./modules/domain/domain.module";
import { CurrencyModule } from "./modules/currency/currency.module";
import { SecurityModule } from "./modules/security/security.module";
import { I18nModule } from "./modules/i18n/i18n.module";
import { SubscriptionModule } from "./modules/subscription/subscription.module";
import { DigitalProductModule } from "./modules/digital-product/digital-product.module";
import { RecommendationModule } from "./modules/recommendation/recommendation.module";
import { PricingModule } from "./modules/pricing/pricing.module";
import { MigrationModule } from "./modules/migration/migration.module";
import { MarketplaceModule } from "./modules/marketplace/marketplace.module";
import { B2bModule } from "./modules/b2b/b2b.module";
import { PosModule } from "./modules/pos/pos.module";
import { UploadModule } from "./modules/upload/upload.module";
import { EventsModule } from "./modules/events/events.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== "production"
            ? { target: "pino-pretty" }
            : undefined,
        customProps: (): Record<string, string> => ({
          context: "HTTP",
        }),
      },
    }),
    DatabaseModule,
    AuthModule,
    TenantModule,
    ProductModule,
    OrderModule,
    PaymentModule,
    ShippingModule,
    StorefrontModule,
    GstModule,
    CodModule,
    WhatsAppModule,
    AiBuilderModule,
    AiImagesModule,
    NotificationModule,
    SeoModule,
    CustomerModule,
    DiscountModule,
    WebhookModule,
    AnalyticsModule,
    StaffModule,
    DomainModule,
    CurrencyModule,
    SecurityModule,
    I18nModule,
    SubscriptionModule,
    DigitalProductModule,
    RecommendationModule,
    PricingModule,
    MigrationModule,
    MarketplaceModule,
    B2bModule,
    PosModule,
    UploadModule,
    EventsModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CorrelationIdMiddleware, RateLimitMiddleware)
      .forRoutes("*");
  }
}
