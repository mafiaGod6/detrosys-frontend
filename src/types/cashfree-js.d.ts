/**
 * @cashfreepayments/cashfree-js ships NO TypeScript declarations at all
 * (confirmed by ts7016 — "Could not find a declaration file for module").
 * This is a full standalone declaration, not an augmentation of an
 * existing type — there's nothing existing to augment.
 *
 * Put this file anywhere TypeScript scans automatically, e.g.
 * src/types/cashfree-js.d.ts. Make sure your tsconfig's "include"
 * covers that folder (most Vite React+TS templates already include
 * all of "src").
 *
 * If a future SDK version starts shipping its own types, TypeScript
 * will report a duplicate-identifier/conflicting-declaration error
 * here — that's your signal to delete this file.
 */

declare module "@cashfreepayments/cashfree-js" {
  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_top" | "_modal" | string;
    returnUrl?: string;
  }

  export interface SubscriptionsCheckoutOptions {
    subsSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_top" | "_modal" | string;
  }

  export interface CashfreeCheckoutResult {
    error?: {
      message?: string;
      [key: string]: unknown;
    };
    redirect?: boolean;
  }

  export interface CashfreeInstance {
    version?(): string;
    checkout(
      options: CashfreeCheckoutOptions,
    ): Promise<CashfreeCheckoutResult>;
    subscriptionsCheckout(
      options: SubscriptionsCheckoutOptions,
    ): Promise<CashfreeCheckoutResult>;
  }

  export function load(options: {
    mode: "sandbox" | "production";
  }): Promise<CashfreeInstance | null>;
}
