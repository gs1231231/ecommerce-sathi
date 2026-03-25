import { Injectable, HttpStatus } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { AppError } from "../../common/exceptions/app-error";

interface ImageVariant {
  size: string;
  width: number;
  height: number;
  url: string;
  format: string;
}

interface ImageAnalysis {
  title: string;
  description: string;
  categorySuggestion: string;
  material: string;
  color: string;
  features: string[];
  seoKeywords: string[];
}

@Injectable()
export class AiImagesService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext("AiImagesService");
  }

  async removeBackground(imageUrl: string): Promise<{
    transparentUrl: string;
    whiteBackgroundUrl: string;
  }> {
    // In production: use @imgly/background-removal or remove.bg API
    this.logger.info({ imageUrl }, "Background removal requested");

    return {
      transparentUrl: imageUrl.replace(/\.\w+$/, "_transparent.png"),
      whiteBackgroundUrl: imageUrl.replace(/\.\w+$/, "_white.png"),
    };
  }

  async enhance(imageUrl: string): Promise<{
    variants: ImageVariant[];
  }> {
    // In production: use sharp for actual image processing
    const sizes = [
      { name: "thumbnail", width: 200, height: 200 },
      { name: "medium", width: 600, height: 600 },
      { name: "large", width: 1200, height: 1200 },
      { name: "zoom", width: 2400, height: 2400 },
    ];

    const variants: ImageVariant[] = sizes.map((size) => ({
      size: size.name,
      width: size.width,
      height: size.height,
      url: imageUrl.replace(/\.\w+$/, `_${size.name}.webp`),
      format: "webp",
    }));

    this.logger.info({ imageUrl, variants: variants.length }, "Image enhanced");

    return { variants };
  }

  async generateLifestylePrompt(
    imageUrl: string,
    style: "studio" | "lifestyle" | "flat-lay",
  ): Promise<{
    sdPrompt: string;
    negativePrompt: string;
    style: string;
  }> {
    // In production: use Claude Vision to analyze the product image first
    const stylePrompts: Record<string, string> = {
      studio:
        "Professional product photography, studio lighting, white backdrop, high-end commercial photography, soft shadows, 4k, ultra detailed",
      lifestyle:
        "Lifestyle product photography, natural setting, warm lighting, cozy atmosphere, editorial style, Instagram aesthetic, 4k",
      "flat-lay":
        "Flat lay product photography, top-down view, minimal props, clean aesthetic, white marble surface, organized arrangement, 4k",
    };

    return {
      sdPrompt: stylePrompts[style] ?? stylePrompts.studio,
      negativePrompt:
        "blurry, low quality, distorted, watermark, text overlay, bad lighting, cluttered background",
      style,
    };
  }

  async describeProduct(imageUrl: string): Promise<ImageAnalysis> {
    // In production: send to Claude Vision API
    this.logger.info({ imageUrl }, "Product description requested");

    return {
      title: "Product from image",
      description:
        "A high-quality product captured in the uploaded image. Features premium materials and excellent craftsmanship.",
      categorySuggestion: "General",
      material: "Mixed materials",
      color: "Multi-color",
      features: [
        "Premium quality",
        "Durable construction",
        "Modern design",
      ],
      seoKeywords: [
        "premium product",
        "online shopping",
        "best price",
        "quality",
      ],
    };
  }

  async bulkProcess(
    imageUrls: string[],
    operations: Array<"remove_background" | "enhance">,
  ): Promise<{
    jobId: string;
    totalImages: number;
    operations: string[];
    status: string;
  }> {
    if (imageUrls.length > 50) {
      throw new AppError(
        "TOO_MANY_IMAGES",
        "Maximum 50 images per batch",
        HttpStatus.BAD_REQUEST,
      );
    }

    const jobId = `img_job_${Date.now()}`;

    // In production: queue via BullMQ
    this.logger.info(
      { jobId, totalImages: imageUrls.length, operations },
      "Bulk image processing queued",
    );

    return {
      jobId,
      totalImages: imageUrls.length,
      operations,
      status: "queued",
    };
  }
}
