import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { PinoLogger } from "nestjs-pino";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: Record<string, unknown> = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "object") {
        errorResponse = exceptionResponse as Record<string, unknown>;
        if (!("success" in errorResponse)) {
          errorResponse = {
            success: false,
            error: {
              code: "HTTP_ERROR",
              message:
                (exceptionResponse as Record<string, unknown>).message ??
                exception.message,
            },
          };
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception, "Unhandled exception");
    }

    response.status(status).json(errorResponse);
  }
}
