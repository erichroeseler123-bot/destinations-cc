declare module "haversine" {
  type Coordinate = {
    latitude: number;
    longitude: number;
  };

  type Options = {
    unit?: "km" | "mile" | "meter" | "nmi";
    threshold?: number;
  };

  export default function haversine(
    start: Coordinate,
    end: Coordinate,
    options?: Options
  ): number;
}
