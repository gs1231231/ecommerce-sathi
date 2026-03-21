import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @Public()
  @ApiOperation({ summary: "Register a new merchant (creates tenant + owner user)" })
  @ApiResponse({ status: 201, description: "Registration successful" })
  @ApiResponse({ status: 409, description: "Store slug already exists" })
  async register(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      phone: string;
      storeName: string;
      storeSlug: string;
    },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.authService.register(body);
    return { success: true, data: result };
  }

  @Post("login")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(
    @Body() body: { email: string; password: string; tenantSlug: string },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.authService.login(body);
    return { success: true, data: result };
  }

  @Post("refresh")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({ status: 200, description: "Token refreshed" })
  @ApiResponse({ status: 401, description: "Invalid refresh token" })
  async refresh(
    @Body() body: { refreshToken: string },
  ): Promise<{ success: boolean; data: unknown }> {
    const tokens = await this.authService.refreshToken(body.refreshToken);
    return { success: true, data: tokens };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout and invalidate refresh token" })
  @ApiResponse({ status: 200, description: "Logged out successfully" })
  async logout(
    @Body() body: { refreshToken: string },
  ): Promise<{ success: boolean; data: { message: string } }> {
    await this.authService.logout(body.refreshToken);
    return { success: true, data: { message: "Logged out successfully" } };
  }
}
