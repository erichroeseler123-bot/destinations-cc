export interface TravelerProfile {
  id: string; // dcc:trav:...
  email: string;
  fullName?: string;
  phoneNumber?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AuthChallenge {
  challengeId: string;
  email: string;
  token: string;
  otpCode: string;
  expiresAt: string;
}

export interface TravelerSession {
  sessionToken: string;
  travelerId: string;
  email: string;
  expiresAt: string;
}

export interface TravelerTripBooking {
  bookingId: string;
  bookingUuid: string;
  productId: string;
  productTitle: string;
  optionId: string;
  optionTitle?: string;
  availabilityId: string;
  operatorSlug: string;
  operatorName: string;
  status: string; // ON_HOLD, CONFIRMED, COMPLETED, CANCELLED
  eventDate?: string;
  eventTime?: string;
  price: number;
  currency: string;
  unitItems: Array<{ unitId: string; quantity: number; title?: string }>;
  voucher?: {
    code: string;
    redemptionUrl?: string;
    barcode?: string;
    instructions?: string;
  };
  meetingPoint?: {
    name?: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  cancellationPolicy?: string;
}

export interface TravelerTripOrder {
  orderId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  totalPrice: number;
  currency: string;
  paymentId?: string;
  paymentStatus?: string;
  items: TravelerTripBooking[];
}

export interface TravelerTripsSummary {
  traveler: TravelerProfile;
  orders: TravelerTripOrder[];
  activeTripsCount: number;
  pastTripsCount: number;
}
