import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as { tenantId: string };
    return user.tenantId;
  },
);
