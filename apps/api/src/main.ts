import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger } from "nestjs-pino";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Serve uploaded files
  app.useStaticAssets(join(process.cwd(), "uploads"), { prefix: "/uploads/" });

  // Use Pino logger
  app.useLogger(app.get(Logger));

  // Global prefix
  app.setGlobalPrefix("api");

  // CORS
  app.enableCors({
    origin: process.env.WEB_URL ?? "http://localhost:3000",
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle("eCommerce Sathi API")
    .setDescription("AI-first, India-native e-commerce platform API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}

bootstrap();
