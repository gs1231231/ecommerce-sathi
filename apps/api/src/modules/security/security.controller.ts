import {
  Controller,
  Get,
  Post,
  Body,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SecurityService } from "./security.service";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Security")
@Controller("security")
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get("headers")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get recommended security headers" })
  getSecurityHeaders(): { success: boolean; data: unknown } {
    const headers = this.securityService.getSecurityHeaders();
    return { success: true, data: headers };
  }

  @Post("check-password")
  @Public()
  @ApiOperation({ summary: "Check password strength" })
  checkPasswordStrength(
    @Body() body: { password: string },
  ): { success: boolean; data: unknown } {
    const result = this.securityService.checkPasswordStrength(body.password);
    return { success: true, data: result };
  }

  @Get("audit")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get security audit checklist" })
  getSecurityAudit(): { success: boolean; data: unknown } {
    const audit = this.securityService.getSecurityAudit();
    return { success: true, data: audit };
  }

  @Post("sanitize")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Sanitize input string" })
  sanitizeInput(
    @Body() body: { input: string },
  ): { success: boolean; data: unknown } {
    const sanitized = this.securityService.sanitizeInput(body.input);
    return { success: true, data: { sanitized } };
  }
}
