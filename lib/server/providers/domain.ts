export type DomainMode = "mock" | "sandbox" | "live";
export type RegistrarQuote = {
  name: string;
  available: boolean;
  registrationPrice: number;
  renewalPrice: number;
  premium: boolean;
};
export type RegistrantContact = {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
};

export interface DomainProvider {
  search(name: string): Promise<RegistrarQuote>;
  purchase(
    name: string,
    years: number,
    idempotencyKey: string,
    contact?: RegistrantContact,
  ): Promise<{ providerOrderId: string; status: "submitted" | "succeeded" }>;
  renew(
    name: string,
    years: number,
  ): Promise<{ providerOrderId: string; status: "submitted" | "succeeded" }>;
  remove(name: string): Promise<{ status: "submitted" | "succeeded" }>;
}

export class MockDomainProvider implements DomainProvider {
  async search(name: string): Promise<RegistrarQuote> {
    return {
      name,
      available: !name.endsWith(".taken"),
      registrationPrice: 12.5,
      renewalPrice: 14,
      premium: name.endsWith(".io"),
    };
  }
  async purchase(_name: string, _years: number, _key: string) {
    return {
      providerOrderId: `mock-${Date.now()}`,
      status: "succeeded" as const,
    };
  }
  async renew(_name: string, _years: number) {
    return {
      providerOrderId: `mock-${Date.now()}`,
      status: "succeeded" as const,
    };
  }
  async remove(_name: string) {
    return { status: "succeeded" as const };
  }
}

export class NamecheapDomainProvider implements DomainProvider {
  private credentials: {
    user?: string;
    key?: string;
    username?: string;
    clientIp?: string;
    env: string;
    baseUrl?: string;
  };
  constructor(
    credentials: {
      user?: string;
      key?: string;
      username?: string;
      clientIp?: string;
      env?: string;
      baseUrl?: string;
    } = {},
  ) {
    this.credentials = {
      user: credentials.user ?? process.env.NAMECHEAP_API_USER,
      key: credentials.key ?? process.env.NAMECHEAP_API_KEY,
      username: credentials.username ?? process.env.NAMECHEAP_USERNAME,
      clientIp: credentials.clientIp ?? process.env.NAMECHEAP_CLIENT_IP,
      env: credentials.env ?? process.env.NAMECHEAP_ENV ?? "sandbox",
      baseUrl: credentials.baseUrl ?? process.env.NAMECHEAP_BASE_URL,
    };
  }
  private configured() {
    return Boolean(
      this.credentials.user &&
      this.credentials.key &&
      this.credentials.username &&
      this.credentials.clientIp,
    );
  }
  private unavailable(): never {
    throw new Error(
      "Namecheap API credentials are not configured. Use the mock provider until sandbox access and IPv4 whitelisting are approved.",
    );
  }
  private baseUrl() {
    return (
      this.credentials.baseUrl ??
      (this.credentials.env === "production"
        ? "https://api.namecheap.com/xml.response"
        : "https://api.sandbox.namecheap.com/xml.response")
    );
  }
  private async request(command: string, params: Record<string, string>) {
    if (!this.configured()) this.unavailable();
    const url = new URL(this.baseUrl());
    url.searchParams.set("ApiUser", this.credentials.user!);
    url.searchParams.set("ApiKey", this.credentials.key!);
    url.searchParams.set("UserName", this.credentials.username!);
    url.searchParams.set("ClientIp", this.credentials.clientIp!);
    url.searchParams.set("Command", command);
    for (const [key, value] of Object.entries(params))
      url.searchParams.set(key, value);
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    const body = await response.text();
    if (!response.ok)
      throw new Error(`Namecheap request failed (${response.status}).`);
    if (/Status="ERROR"/i.test(body) || /<Error[ >]/i.test(body)) {
      const message = /<Error[^>]*>([^<]*)</i.exec(body)?.[1];
      throw new Error(message ?? "Namecheap returned an error.");
    }
    return body;
  }
  async search(name: string): Promise<RegistrarQuote> {
    const body = await this.request("namecheap.domains.check", {
      DomainList: name,
    });
    const result = /<DomainCheckResult[^>]*>/i.exec(body)?.[0] ?? "";
    const available = /Available="true"/i.test(result);
    const premium = /IsPremium="true"/i.test(result);
    return {
      name,
      available,
      premium,
      registrationPrice: premium ? 89 : 12.5,
      renewalPrice: premium ? 99 : 14,
    };
  }
  async purchase(
    name: string,
    years: number,
    _key: string,
    contact?: RegistrantContact,
  ): Promise<{
    providerOrderId: string;
    status: "submitted" | "succeeded";
  }> {
    if (!contact)
      throw new Error(
        "Registrant contact is required for Namecheap registration.",
      );
    const body = await this.request("namecheap.domains.create", {
      DomainName: name,
      Years: String(years),
      AddFreeWhoisguard: "yes",
      WGEnabled: "no",
      RegistrantFirstName: contact.firstName,
      RegistrantLastName: contact.lastName,
      RegistrantAddress1: contact.address1,
      RegistrantCity: contact.city,
      RegistrantStateProvince: contact.state,
      RegistrantPostalCode: contact.postalCode,
      RegistrantCountry: contact.country,
      RegistrantPhone: contact.phone,
      RegistrantEmailAddress: contact.email,
      TechFirstName: contact.firstName,
      TechLastName: contact.lastName,
      TechAddress1: contact.address1,
      TechCity: contact.city,
      TechStateProvince: contact.state,
      TechPostalCode: contact.postalCode,
      TechCountry: contact.country,
      TechPhone: contact.phone,
      TechEmailAddress: contact.email,
      AdminFirstName: contact.firstName,
      AdminLastName: contact.lastName,
      AdminAddress1: contact.address1,
      AdminCity: contact.city,
      AdminStateProvince: contact.state,
      AdminPostalCode: contact.postalCode,
      AdminCountry: contact.country,
      AdminPhone: contact.phone,
      AdminEmailAddress: contact.email,
      AuxBillingFirstName: contact.firstName,
      AuxBillingLastName: contact.lastName,
      AuxBillingAddress1: contact.address1,
      AuxBillingCity: contact.city,
      AuxBillingStateProvince: contact.state,
      AuxBillingPostalCode: contact.postalCode,
      AuxBillingCountry: contact.country,
      AuxBillingPhone: contact.phone,
      AuxBillingEmailAddress: contact.email,
    });
    const orderId = /OrderId="([^"]+)"/i.exec(body)?.[1];
    if (!orderId) throw new Error("Namecheap did not return an order ID.");
    return { providerOrderId: orderId, status: "submitted" };
  }
  async renew(
    name: string,
    years: number,
  ): Promise<{
    providerOrderId: string;
    status: "submitted" | "succeeded";
  }> {
    const body = await this.request("namecheap.domains.renew", {
      DomainName: name,
      Years: String(years),
    });
    const orderId = /OrderId="([^"]+)"/i.exec(body)?.[1] ?? `renew-${name}`;
    return { providerOrderId: orderId, status: "submitted" };
  }
  async remove(name: string): Promise<{ status: "submitted" | "succeeded" }> {
    await this.request("namecheap.domains.setAutoRenew", {
      DomainName: name,
      AutoRenew: "false",
    });
    return { status: "submitted" };
  }
}

export function domainMode(): DomainMode {
  const mode = (process.env.NAMECHEAP_MODE ?? "mock").toLowerCase();
  return mode === "sandbox" || mode === "live" ? mode : "mock";
}

export function domainProvider(): DomainProvider {
  const mode = (process.env.NAMECHEAP_MODE ?? "mock").toLowerCase();
  return mode === "mock"
    ? new MockDomainProvider()
    : new NamecheapDomainProvider();
}
