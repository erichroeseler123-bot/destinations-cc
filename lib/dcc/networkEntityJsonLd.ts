export const DCC_ORGANIZATION_ID = "https://www.destinationcommandcenter.com/#organization";
export const DCC_WEBSITE_ID = "https://www.destinationcommandcenter.com/#website";
export const DCC_BASE_URL = "https://www.destinationcommandcenter.com";

type EntityRelationship = "parentOrganization" | "isPartOf";

type BaseNetworkEntityInput = {
  baseUrl: string;
  name: string;
  description?: string;
  sameAs?: string[];
  relationshipToDcc?: EntityRelationship;
};

type ServiceInput = {
  id?: string;
  name: string;
  description: string;
  providerId?: string;
  areaServed?: string | Record<string, unknown> | Array<string | Record<string, unknown>>;
};

export function buildDccOrganizationJsonLd(input?: {
  description?: string;
  sameAs?: string[];
}) {
  return {
    "@type": "Organization",
    "@id": DCC_ORGANIZATION_ID,
    name: "Destination Command Center",
    url: DCC_BASE_URL,
    description: input?.description,
    sameAs: input?.sameAs,
  };
}

export function buildDccWebSiteJsonLd(input?: {
  description?: string;
  sameAs?: string[];
}) {
  return {
    "@type": "WebSite",
    "@id": DCC_WEBSITE_ID,
    name: "Destination Command Center",
    url: DCC_BASE_URL,
    description: input?.description,
    sameAs: input?.sameAs,
    publisher: { "@id": DCC_ORGANIZATION_ID },
  };
}

export function buildNetworkOrganizationJsonLd(input: BaseNetworkEntityInput) {
  const relationship = input.relationshipToDcc
    ? { [input.relationshipToDcc]: { "@id": DCC_ORGANIZATION_ID } }
    : {};

  return {
    "@type": "Organization",
    "@id": `${input.baseUrl}/#organization`,
    name: input.name,
    url: input.baseUrl,
    description: input.description,
    sameAs: input.sameAs,
    ...relationship,
  };
}

export function buildNetworkWebSiteJsonLd(input: BaseNetworkEntityInput) {
  return {
    "@type": "WebSite",
    "@id": `${input.baseUrl}/#website`,
    name: input.name,
    url: input.baseUrl,
    description: input.description,
    publisher: { "@id": `${input.baseUrl}/#organization` },
    isPartOf: input.relationshipToDcc ? { "@id": DCC_WEBSITE_ID } : undefined,
  };
}

export function buildNetworkServiceJsonLd(baseUrl: string, input: ServiceInput) {
  return {
    "@type": "Service",
    "@id": input.id || `${baseUrl}/#service`,
    name: input.name,
    url: baseUrl,
    description: input.description,
    provider: { "@id": input.providerId || `${baseUrl}/#organization` },
    areaServed: input.areaServed,
    isPartOf: { "@id": DCC_WEBSITE_ID },
  };
}

export function buildNetworkEntityGraph(input: BaseNetworkEntityInput & {
  service?: ServiceInput;
}) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildDccOrganizationJsonLd(),
      buildDccWebSiteJsonLd(),
      buildNetworkOrganizationJsonLd(input),
      buildNetworkWebSiteJsonLd(input),
      ...(input.service ? [buildNetworkServiceJsonLd(input.baseUrl, input.service)] : []),
    ],
  };
}
