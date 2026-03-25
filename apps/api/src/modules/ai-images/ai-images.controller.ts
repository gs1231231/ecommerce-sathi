import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AiImagesService } from "./ai-images.service";

@ApiTags("AI Images")
@ApiBearerAuth()
@Controller("ai-images")
export class AiImagesController {
  constructor(private readonly aiImagesService: AiImagesService) {}

  @Post("remove-background")
  @ApiOperation({ summary: "Remove background from product image" })
  async removeBackground(
    @Body() body: { imageUrl: string },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.aiImagesService.removeBackground(body.imageUrl);
    return { success: true, data: result };
  }

  @Post("enhance")
  @ApiOperation({ summary: "Enhance and resize product image" })
  async enhance(
    @Body() body: { imageUrl: string },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.aiImagesService.enhance(body.imageUrl);
    return { success: true, data: result };
  }

  @Post("generate-lifestyle")
  @ApiOperation({ summary: "Generate lifestyle image prompt" })
  async generateLifestyle(
    @Body() body: { imageUrl: string; style: "studio" | "lifestyle" | "flat-lay" },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.aiImagesService.generateLifestylePrompt(
      body.imageUrl,
      body.style,
    );
    return { success: true, data: result };
  }

  @Post("describe")
  @ApiOperation({ summary: "Auto-describe product from image" })
  async describe(
    @Body() body: { imageUrl: string },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.aiImagesService.describeProduct(body.imageUrl);
    return { success: true, data: result };
  }

  @Post("bulk-process")
  @ApiOperation({ summary: "Bulk process product images" })
  async bulkProcess(
    @Body()
    body: {
      imageUrls: string[];
      operations: Array<"remove_background" | "enhance">;
    },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.aiImagesService.bulkProcess(
      body.imageUrls,
      body.operations,
    );
    return { success: true, data: result };
  }
}
