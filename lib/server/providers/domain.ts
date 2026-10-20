export type DomainMode = "mock" | "sandbox" | "live";
export type RegistrarQuote = {
  name: string;
  available: boolean;
  registrationPrice: number;
  renewalPrice: number;
  premium: boolean;
};
export interface DomainProvider {
  search(name: string): Promise<RegistrarQuote>;
  purchase(
    name: string,
    years: number,
    idempotencyKey: string,
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
  constructor(
    private credentials = {
      user: process.env.NAMECHEAP_API_USER,
      key: process.env.NAMECHEAP_API_KEY,
      username: process.env.NAMECHEAP_USERNAME,
      clientIp: process.env.NAMECHEAP_CLIENT_IP,
      env: process.env.NAMECHEAP_ENV ?? "sandbox",
    },
  ) {}
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
  async search(_name: string): Promise<RegistrarQuote> {
    if (!this.configured()) this.unavailable();
    this.unavailable();
  }
  async purchase(
    _name: string,
    _years: number,
    _key: string,
  ): Promise<{
    providerOrderId: string;
    status: "submitted" | "succeeded";
  }> {
    if (!this.configured()) this.unavailable();
    return this.unavailable();
  }
  async renew(
    _name: string,
    _years: number,
  ): Promise<{
    providerOrderId: string;
    status: "submitted" | "succeeded";
  }> {
    if (!this.configured()) this.unavailable();
    return this.unavailable();
  }
  async remove(_name: string): Promise<{ status: "submitted" | "succeeded" }> {
    if (!this.configured()) this.unavailable();
    return this.unavailable();
  }
}

export function domainProvider(): DomainProvider {
  const mode = (process.env.NAMECHEAP_MODE ?? "mock").toLowerCase();
  return mode === "mock"
    ? new MockDomainProvider()
    : new NamecheapDomainProvider();
}
