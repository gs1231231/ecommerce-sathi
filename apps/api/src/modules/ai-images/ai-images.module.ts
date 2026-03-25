import { Module } from "@nestjs/common";
import { AiImagesController } from "./ai-images.controller";
import { AiImagesService } from "./ai-images.service";

@Module({
  controllers: [AiImagesController],
  providers: [AiImagesService],
  exports: [AiImagesService],
})
export class AiImagesModule {}
