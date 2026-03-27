import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from "@nestjs/common";
import { ZodSchema, ZodError } from "zod";

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown): unknown {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));

        throw new BadRequestException({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Input validation failed",
            details,
          },
        });
      }
      throw error;
    }
  }
}
