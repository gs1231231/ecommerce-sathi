import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { CurrencyService } from "./currency.service";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Currency")
@Controller("currency")
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get("supported")
  @Public()
  @ApiOperation({ summary: "Get supported currencies" })
  getSupportedCurrencies(): { success: boolean; data: unknown } {
    const currencies = this.currencyService.getSupportedCurrencies();
    return { success: true, data: currencies };
  }

  @Get("rates")
  @Public()
  @ApiOperation({ summary: "Get exchange rates for a base currency" })
  getExchangeRates(
    @Query("base") base: string = "INR",
  ): { success: boolean; data: unknown } {
    const rates = this.currencyService.getExchangeRates(base);
    return { success: true, data: rates };
  }

  @Post("convert")
  @Public()
  @ApiOperation({ summary: "Convert amount between currencies" })
  convertAmount(
    @Body() body: { amount: number; fromCurrency: string; toCurrency: string },
  ): { success: boolean; data: unknown } {
    const result = this.currencyService.convertAmount(
      body.amount,
      body.fromCurrency,
      body.toCurrency,
    );
    return { success: true, data: result };
  }
}
