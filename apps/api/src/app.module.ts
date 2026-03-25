import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware";
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
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes("*");
  }
}
