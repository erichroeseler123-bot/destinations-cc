function buildLocalBusinessJsonLd(
  baseUrl: string,
  input: {
    name: string;
    description?: string;
    areaServed?: Array<string | Record<string, unknown>>;
  },
) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${baseUrl}/#local-business`,
    name: input.name,
    url: baseUrl,
    description: input.description,
    areaServed: input.areaServed,
  };
}

function buildServiceJsonLd(
  baseUrl: string,
  input: {
    name: string;
    description: string;
    areaServed?: string | Record<string, unknown> | Array<string | Record<string, unknown>>;
  },
) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${baseUrl}#service`,
    name: input.name,
    url: baseUrl,
    description: input.description,
    provider: { "@id": `${baseUrl}/#local-business` },
    areaServed: input.areaServed,
  };
}

export function buildOperatorServiceJsonLd(
  baseUrl: string,
  input: {
    business: {
      name: string;
      description?: string;
      areaServed?: Array<string | Record<string, unknown>>;
    };
    service: {
      name: string;
      description: string;
      areaServed?: string | Record<string, unknown> | Array<string | Record<string, unknown>>;
    };
  },
) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildLocalBusinessJsonLd(baseUrl, input.business),
      buildServiceJsonLd(baseUrl, input.service),
    ],
  };
}
