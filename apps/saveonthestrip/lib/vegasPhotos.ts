import { cache } from "react";

export type VegasPhotoAsset = {
  src: string;
  alt: string;
};

type VegasPhotoLibrary = {
  bellagio: VegasPhotoAsset;
  fremont: VegasPhotoAsset;
  sphere: VegasPhotoAsset;
  grandCanyon: VegasPhotoAsset;
  vegasNight: VegasPhotoAsset;
  luxuryHotel: VegasPhotoAsset;
  resortPool: VegasPhotoAsset;
  hotelValue: VegasPhotoAsset;
  area15: VegasPhotoAsset;
  vegasSign: VegasPhotoAsset;
  desertOutdoor: VegasPhotoAsset;
  downtownNight: VegasPhotoAsset;
};

export const getVegasPhotoLibrary = cache(async (): Promise<VegasPhotoLibrary> => {
  const bellagio = {
    src: "https://images.pexels.com/photos/3636055/pexels-photo-3636055.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    alt: "Bellagio fountains with the Las Vegas Strip at dusk",
  };
  const fremont = {
    src: "https://images.pexels.com/photos/35895756/pexels-photo-35895756.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    alt: "Fremont Street neon lights in downtown Las Vegas at night",
  };
  const vegasNight = {
    src: "https://images.pexels.com/photos/36015098/pexels-photo-36015098.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    alt: "Las Vegas Strip lights at night",
  };
  const grandCanyon = {
    src: "https://images.pexels.com/photos/32290509/pexels-photo-32290509.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    alt: "Grand Canyon overlook at sunrise",
  };
  const hotelValue = {
    src: "https://images.pexels.com/photos/36445344/pexels-photo-36445344.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    alt: "Las Vegas resort exterior with palm trees",
  };
  const resortPool = {
    src: "https://images.pexels.com/photos/919/night-dark-hotel-luxury.jpg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    alt: "Las Vegas resort pool at night",
  };
  const vegasSign = {
    src: "https://images.pexels.com/photos/1092257/pexels-photo-1092257.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    alt: "Welcome to Fabulous Las Vegas sign at night",
  };

  return {
    bellagio,
    fremont,
    sphere: vegasNight,
    grandCanyon,
    vegasNight,
    luxuryHotel: bellagio,
    resortPool,
    hotelValue,
    area15: vegasNight,
    vegasSign,
    desertOutdoor: grandCanyon,
    downtownNight: fremont,
  };
});
