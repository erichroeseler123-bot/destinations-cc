export type DestinationStarterIntentV1 = {
  title: string;
  description?: string;
  query: string;
  badge?: string;
};

export type DestinationGatewayMappingV1 = {
  kind: "port_tours_handoff";
  source_slug: string;
};

export type DestinationV1 = {
  slug: string;
  display_name: string;
  aliases: string[];
  starter_intents: DestinationStarterIntentV1[];
  gateway_mappings?: DestinationGatewayMappingV1[];
  status: "active";
  visibility: "public";
};
