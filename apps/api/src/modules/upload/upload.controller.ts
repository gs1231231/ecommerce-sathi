import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from "@nestjs/swagger";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { v4 as uuidv4 } from "uuid";

const uploadDir = join(process.cwd(), "uploads");

const storage = diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const imageFilter = (
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
): void => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|svg\+xml)$/)) {
    return cb(new BadRequestException("Only image files are allowed"), false);
  }
  cb(null, true);
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@ApiTags("Upload")
@ApiBearerAuth()
@Controller("upload")
export class UploadController {
  @Post("image")
  @ApiOperation({ summary: "Upload a single image" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      storage,
      fileFilter: imageFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): {
    success: boolean;
    data: { url: string; originalName: string; size: number; mimeType: string };
  } {
    if (!file) {
      throw new BadRequestException("File is required");
    }

    return {
      success: true,
      data: {
        url: `/uploads/${file.filename}`,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      },
    };
  }

  @Post("images")
  @ApiOperation({ summary: "Upload multiple images (max 10)" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FilesInterceptor("files", 10, {
      storage,
      fileFilter: imageFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): {
    success: boolean;
    data: {
      files: {
        url: string;
        originalName: string;
        size: number;
        mimeType: string;
      }[];
    };
  } {
    if (!files || files.length === 0) {
      throw new BadRequestException("At least one file is required");
    }

    return {
      success: true,
      data: {
        files: files.map((file) => ({
          url: `/uploads/${file.filename}`,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        })),
      },
    };
  }
}
