import { HttpException, HttpStatus } from "@nestjs/common";

export class AppError extends HttpException {
  public readonly errorCode: string;

  constructor(
    errorCode: string,
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: Record<string, unknown>,
  ) {
    super(
      {
        success: false,
        error: {
          code: errorCode,
          message,
          details,
        },
      },
      statusCode,
    );
    this.errorCode = errorCode;
  }
}
