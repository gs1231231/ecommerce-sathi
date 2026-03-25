import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AiBuilderService } from "./ai-builder.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@ApiTags("AI Builder")
@ApiBearerAuth()
@Controller("ai-builder")
export class AiBuilderController {
  constructor(private readonly aiBuilderService: AiBuilderService) {}

  @Post("generate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Generate a full store using AI analysis" })
  async generate(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      businessDescription: string;
      targetAudience?: string;
      style?: string;
      language?: string;
    },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = this.aiBuilderService.generateStore({
      businessDescription: body.businessDescription,
      targetAudience: body.targetAudience,
      style: body.style,
      language: body.language,
    });
    return { success: true, data: result };
  }

  @Post("iterate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Iterate on an existing store with an instruction" })
  async iterate(
    @CurrentTenant() tenantId: string,
    @Body() body: { storeId: string; instruction: string },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = this.aiBuilderService.iterateStore(
      body.storeId,
      body.instruction,
    );
    return { success: true, data: result };
  }

  @Post("analyze")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Analyze a business description" })
  async analyze(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      businessDescription: string;
      targetAudience?: string;
      style?: string;
    },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = this.aiBuilderService.analyzeBusinessDescription(
      body.businessDescription,
      body.targetAudience,
      body.style,
    );
    return { success: true, data: result };
  }
}
