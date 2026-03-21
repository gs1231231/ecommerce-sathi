import { Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const DATABASE_TOKEN = "DATABASE";

export type DatabaseInstance = PostgresJsDatabase;

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_TOKEN,
      inject: [ConfigService],
      useFactory: (config: ConfigService): DatabaseInstance => {
        const connectionString = config.getOrThrow<string>("DATABASE_URL");
        const client = postgres(connectionString);
        return drizzle(client);
      },
    },
  ],
  exports: [DATABASE_TOKEN],
})
export class DatabaseModule {}
