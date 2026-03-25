import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CodService } from "./cod.service";
import { Public } from "../../common/decorators/public.decorator";

interface VerifyOtpBody {
  orderId: string;
  otp: string;
}

interface SendOtpBody {
  orderId: string;
  phone: string;
}

interface RiskScoreBody {
  pincode: string;
  phone: string;
  orderValue: number;
  previousOrders: number;
}

interface PrepaidNudgeBody {
  orderValue: number;
}

@ApiTags("COD")
@Controller("cod")
export class CodController {
  constructor(private readonly codService: CodService) {}

  @Post("send-otp")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send COD verification OTP to customer" })
  async sendOtp(
    @Body() body: SendOtpBody,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.codService.sendVerificationOtp(
      body.orderId,
      body.phone,
    );
    return { success: true, data: result };
  }

  @Post("verify-otp")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify COD order via OTP" })
  async verifyOtp(
    @Body() body: VerifyOtpBody,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.codService.verifyOtp(body.orderId, body.otp);
    return { success: true, data: result };
  }

  @Post("risk-score")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Calculate COD risk score for an order" })
  calculateRiskScore(
    @Body() body: RiskScoreBody,
  ): { success: boolean; data: unknown } {
    const result = this.codService.calculateRiskScore({
      pincode: body.pincode,
      phone: body.phone,
      orderValue: body.orderValue,
      previousOrders: body.previousOrders,
    });
    return { success: true, data: result };
  }

  @Post("prepaid-nudge")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get prepaid discount nudge for COD order" })
  getPrepaidNudge(
    @Body() body: PrepaidNudgeBody,
  ): { success: boolean; data: unknown } {
    const result = this.codService.getPrepaidNudge(body.orderValue);
    return { success: true, data: result };
  }
}
