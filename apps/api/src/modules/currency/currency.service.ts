import { Injectable, HttpStatus } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { AppError } from "../../common/exceptions/app-error";

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

interface ConversionResult {
  originalAmount: number;
  convertedAmount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
}

const SUPPORTED_CURRENCIES: Currency[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
];

const EXCHANGE_RATES_FROM_INR: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AED: 0.044,
  SGD: 0.016,
};

@Injectable()
export class CurrencyService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext("CurrencyService");
  }

  getSupportedCurrencies(): Currency[] {
    this.logger.info("Fetching supported currencies");
    return SUPPORTED_CURRENCIES;
  }

  getExchangeRates(baseCurrency: string): Record<string, number> {
    const upperBase = baseCurrency.toUpperCase();

    if (!EXCHANGE_RATES_FROM_INR[upperBase]) {
      throw new AppError(
        "UNSUPPORTED_CURRENCY",
        `Currency ${upperBase} is not supported`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const baseToInr = 1 / EXCHANGE_RATES_FROM_INR[upperBase];
    const rates: Record<string, number> = {};

    for (const [code, rateFromInr] of Object.entries(EXCHANGE_RATES_FROM_INR)) {
      if (code !== upperBase) {
        rates[code] = parseFloat((baseToInr * rateFromInr).toFixed(6));
      }
    }

    this.logger.info({ baseCurrency: upperBase }, "Exchange rates fetched");
    return rates;
  }

  convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): ConversionResult {
    const upperFrom = fromCurrency.toUpperCase();
    const upperTo = toCurrency.toUpperCase();

    if (!EXCHANGE_RATES_FROM_INR[upperFrom]) {
      throw new AppError(
        "UNSUPPORTED_CURRENCY",
        `Currency ${upperFrom} is not supported`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!EXCHANGE_RATES_FROM_INR[upperTo]) {
      throw new AppError(
        "UNSUPPORTED_CURRENCY",
        `Currency ${upperTo} is not supported`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const amountInInr = amount / EXCHANGE_RATES_FROM_INR[upperFrom];
    const convertedAmount = amountInInr * EXCHANGE_RATES_FROM_INR[upperTo];
    const rate = EXCHANGE_RATES_FROM_INR[upperTo] / EXCHANGE_RATES_FROM_INR[upperFrom];

    this.logger.info(
      { amount, fromCurrency: upperFrom, toCurrency: upperTo, convertedAmount },
      "Currency conversion performed",
    );

    return {
      originalAmount: amount,
      convertedAmount: parseFloat(convertedAmount.toFixed(2)),
      fromCurrency: upperFrom,
      toCurrency: upperTo,
      rate: parseFloat(rate.toFixed(6)),
    };
  }

  formatPrice(amount: number, currencyCode: string): string {
    const upperCode = currencyCode.toUpperCase();
    const currency = SUPPORTED_CURRENCIES.find((c) => c.code === upperCode);

    if (!currency) {
      throw new AppError(
        "UNSUPPORTED_CURRENCY",
        `Currency ${upperCode} is not supported`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return `${currency.symbol}${amount.toFixed(2)}`;
  }
}
