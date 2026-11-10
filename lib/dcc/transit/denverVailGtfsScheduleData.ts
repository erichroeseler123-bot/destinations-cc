// Auto-generated from official RTD & CDOT Bustang GTFS schedules
// RTD A Line feed_version: Sep26-37040-4-3-20260922-172143 (2026-09-27 to 2027-01-02)
// CDOT Bustang feed_version: Sep26-37355-20-21-20261105-153942 (2026-09-27 to 2027-01-02)

export interface GtfsCorridorTrip {
  tripId: string;
  serviceId: string;
  dep: string; // HH:MM:SS
  arr: string; // HH:MM:SS
}

export const DENVER_VAIL_GTFS_METADATA = {
  validStartDate: '2026-09-27',
  validEndDate: '2027-01-02',
  rtdALineFeedVersion: 'Sep26-37040-4-3-20260922-172143',
  bustangFeedVersion: 'Sep26-37355-20-21-20261105-153942',
  stops: {
    denAirportStation: {
      stopId: '34476',
      parentStationId: '34503',
      stopName: 'Denver Airport Station',
      platformLabel: 'DEN Transit Center Level 1 (Track 1/2)',
    },
    unionStationRail: {
      stopId: '34667',
      parentStationId: '33727',
      stopName: 'Union Station Track 1',
      platformLabel: 'Commuter Rail Track 1',
    },
    unionStationBustangGate: {
      stopId: '34316',
      stopName: 'Union Station Gate B19',
      platformLabel: 'Underground Bus Concourse · Gate B19',
    },
    unionStationPegasusStop: {
      stopId: '34385',
      stopName: 'Wewatta St & 17th St',
      platformLabel: 'Streetside Stop · Wewatta St & 17th St',
    },
    vailTransportationCenter: {
      stopId: '35174',
      stopName: 'Vail Transportation Center',
      platformLabel: '241 S Frontage Rd E, Vail',
    },
  },
  holidaySundayOverrides: ['2026-11-26', '2026-12-25', '2027-01-01'],
} as const;

export const RTD_A_LINE_TRIPS_BY_SERVICE: Record<string, GtfsCorridorTrip[]> = {
  "SA": [
    {
      "tripId": "115890895",
      "serviceId": "SA",
      "dep": "04:12:00",
      "arr": "04:49:00"
    },
    {
      "tripId": "115890894",
      "serviceId": "SA",
      "dep": "04:42:00",
      "arr": "05:19:00"
    },
    {
      "tripId": "115890893",
      "serviceId": "SA",
      "dep": "05:12:00",
      "arr": "05:49:00"
    },
    {
      "tripId": "115890946",
      "serviceId": "SA",
      "dep": "05:27:00",
      "arr": "06:04:00"
    },
    {
      "tripId": "115890892",
      "serviceId": "SA",
      "dep": "05:42:00",
      "arr": "06:19:00"
    },
    {
      "tripId": "115890945",
      "serviceId": "SA",
      "dep": "05:57:00",
      "arr": "06:34:00"
    },
    {
      "tripId": "115890891",
      "serviceId": "SA",
      "dep": "06:12:00",
      "arr": "06:49:00"
    },
    {
      "tripId": "115890944",
      "serviceId": "SA",
      "dep": "06:27:00",
      "arr": "07:04:00"
    },
    {
      "tripId": "115890890",
      "serviceId": "SA",
      "dep": "06:42:00",
      "arr": "07:19:00"
    },
    {
      "tripId": "115890943",
      "serviceId": "SA",
      "dep": "06:57:00",
      "arr": "07:34:00"
    },
    {
      "tripId": "115890889",
      "serviceId": "SA",
      "dep": "07:12:00",
      "arr": "07:49:00"
    },
    {
      "tripId": "115890942",
      "serviceId": "SA",
      "dep": "07:27:00",
      "arr": "08:04:00"
    },
    {
      "tripId": "115890887",
      "serviceId": "SA",
      "dep": "07:42:00",
      "arr": "08:19:00"
    },
    {
      "tripId": "115890941",
      "serviceId": "SA",
      "dep": "07:57:00",
      "arr": "08:34:00"
    },
    {
      "tripId": "115890886",
      "serviceId": "SA",
      "dep": "08:12:00",
      "arr": "08:49:00"
    },
    {
      "tripId": "115890940",
      "serviceId": "SA",
      "dep": "08:27:00",
      "arr": "09:04:00"
    },
    {
      "tripId": "115890885",
      "serviceId": "SA",
      "dep": "08:42:00",
      "arr": "09:19:00"
    },
    {
      "tripId": "115890939",
      "serviceId": "SA",
      "dep": "08:57:00",
      "arr": "09:34:00"
    },
    {
      "tripId": "115890877",
      "serviceId": "SA",
      "dep": "09:12:00",
      "arr": "09:49:00"
    },
    {
      "tripId": "115890938",
      "serviceId": "SA",
      "dep": "09:27:00",
      "arr": "10:04:00"
    },
    {
      "tripId": "115890884",
      "serviceId": "SA",
      "dep": "09:42:00",
      "arr": "10:19:00"
    },
    {
      "tripId": "115890937",
      "serviceId": "SA",
      "dep": "09:57:00",
      "arr": "10:34:00"
    },
    {
      "tripId": "115890883",
      "serviceId": "SA",
      "dep": "10:12:00",
      "arr": "10:49:00"
    },
    {
      "tripId": "115890936",
      "serviceId": "SA",
      "dep": "10:27:00",
      "arr": "11:04:00"
    },
    {
      "tripId": "115890882",
      "serviceId": "SA",
      "dep": "10:42:00",
      "arr": "11:19:00"
    },
    {
      "tripId": "115890935",
      "serviceId": "SA",
      "dep": "10:57:00",
      "arr": "11:34:00"
    },
    {
      "tripId": "115890881",
      "serviceId": "SA",
      "dep": "11:12:00",
      "arr": "11:49:00"
    },
    {
      "tripId": "115890934",
      "serviceId": "SA",
      "dep": "11:27:00",
      "arr": "12:04:00"
    },
    {
      "tripId": "115890905",
      "serviceId": "SA",
      "dep": "11:42:00",
      "arr": "12:19:00"
    },
    {
      "tripId": "115890933",
      "serviceId": "SA",
      "dep": "11:57:00",
      "arr": "12:34:00"
    },
    {
      "tripId": "115890880",
      "serviceId": "SA",
      "dep": "12:12:00",
      "arr": "12:49:00"
    },
    {
      "tripId": "115890932",
      "serviceId": "SA",
      "dep": "12:27:00",
      "arr": "13:04:00"
    },
    {
      "tripId": "115890879",
      "serviceId": "SA",
      "dep": "12:42:00",
      "arr": "13:19:00"
    },
    {
      "tripId": "115890931",
      "serviceId": "SA",
      "dep": "12:57:00",
      "arr": "13:34:00"
    },
    {
      "tripId": "115890878",
      "serviceId": "SA",
      "dep": "13:12:00",
      "arr": "13:49:00"
    },
    {
      "tripId": "115890930",
      "serviceId": "SA",
      "dep": "13:27:00",
      "arr": "14:04:00"
    },
    {
      "tripId": "115890876",
      "serviceId": "SA",
      "dep": "13:42:00",
      "arr": "14:19:00"
    },
    {
      "tripId": "115890927",
      "serviceId": "SA",
      "dep": "13:57:00",
      "arr": "14:34:00"
    },
    {
      "tripId": "115890929",
      "serviceId": "SA",
      "dep": "14:12:00",
      "arr": "14:49:00"
    },
    {
      "tripId": "115890926",
      "serviceId": "SA",
      "dep": "14:27:00",
      "arr": "15:04:00"
    },
    {
      "tripId": "115890928",
      "serviceId": "SA",
      "dep": "14:42:00",
      "arr": "15:19:00"
    },
    {
      "tripId": "115890925",
      "serviceId": "SA",
      "dep": "14:57:00",
      "arr": "15:34:00"
    },
    {
      "tripId": "115890875",
      "serviceId": "SA",
      "dep": "15:12:00",
      "arr": "15:49:00"
    },
    {
      "tripId": "115890924",
      "serviceId": "SA",
      "dep": "15:27:00",
      "arr": "16:04:00"
    },
    {
      "tripId": "115890874",
      "serviceId": "SA",
      "dep": "15:42:00",
      "arr": "16:19:00"
    },
    {
      "tripId": "115890923",
      "serviceId": "SA",
      "dep": "15:57:00",
      "arr": "16:34:00"
    },
    {
      "tripId": "115890873",
      "serviceId": "SA",
      "dep": "16:12:00",
      "arr": "16:49:00"
    },
    {
      "tripId": "115890922",
      "serviceId": "SA",
      "dep": "16:27:00",
      "arr": "17:04:00"
    },
    {
      "tripId": "115890872",
      "serviceId": "SA",
      "dep": "16:42:00",
      "arr": "17:19:00"
    },
    {
      "tripId": "115890921",
      "serviceId": "SA",
      "dep": "16:57:00",
      "arr": "17:34:00"
    },
    {
      "tripId": "115890871",
      "serviceId": "SA",
      "dep": "17:12:00",
      "arr": "17:49:00"
    },
    {
      "tripId": "115890888",
      "serviceId": "SA",
      "dep": "17:27:00",
      "arr": "18:04:00"
    },
    {
      "tripId": "115890870",
      "serviceId": "SA",
      "dep": "17:42:00",
      "arr": "18:19:00"
    },
    {
      "tripId": "115890920",
      "serviceId": "SA",
      "dep": "17:57:00",
      "arr": "18:34:00"
    },
    {
      "tripId": "115890869",
      "serviceId": "SA",
      "dep": "18:12:00",
      "arr": "18:49:00"
    },
    {
      "tripId": "115890919",
      "serviceId": "SA",
      "dep": "18:27:00",
      "arr": "19:04:00"
    },
    {
      "tripId": "115890868",
      "serviceId": "SA",
      "dep": "18:42:00",
      "arr": "19:19:00"
    },
    {
      "tripId": "115890918",
      "serviceId": "SA",
      "dep": "18:57:00",
      "arr": "19:34:00"
    },
    {
      "tripId": "115890947",
      "serviceId": "SA",
      "dep": "19:12:00",
      "arr": "19:49:00"
    },
    {
      "tripId": "115890917",
      "serviceId": "SA",
      "dep": "19:27:00",
      "arr": "20:04:00"
    },
    {
      "tripId": "115890916",
      "serviceId": "SA",
      "dep": "19:57:00",
      "arr": "20:34:00"
    },
    {
      "tripId": "115890915",
      "serviceId": "SA",
      "dep": "20:27:00",
      "arr": "21:04:00"
    },
    {
      "tripId": "115890914",
      "serviceId": "SA",
      "dep": "20:57:00",
      "arr": "21:34:00"
    },
    {
      "tripId": "115890913",
      "serviceId": "SA",
      "dep": "21:27:00",
      "arr": "22:04:00"
    },
    {
      "tripId": "115890912",
      "serviceId": "SA",
      "dep": "21:57:00",
      "arr": "22:34:00"
    },
    {
      "tripId": "115890911",
      "serviceId": "SA",
      "dep": "22:27:00",
      "arr": "23:04:00"
    },
    {
      "tripId": "115890910",
      "serviceId": "SA",
      "dep": "22:57:00",
      "arr": "23:34:00"
    },
    {
      "tripId": "115890909",
      "serviceId": "SA",
      "dep": "23:27:00",
      "arr": "24:04:00"
    },
    {
      "tripId": "115890908",
      "serviceId": "SA",
      "dep": "23:57:00",
      "arr": "24:34:00"
    },
    {
      "tripId": "115890907",
      "serviceId": "SA",
      "dep": "24:27:00",
      "arr": "25:04:00"
    },
    {
      "tripId": "115890906",
      "serviceId": "SA",
      "dep": "24:57:00",
      "arr": "25:34:00"
    },
    {
      "tripId": "115890904",
      "serviceId": "SA",
      "dep": "25:27:00",
      "arr": "26:04:00"
    },
    {
      "tripId": "115890897",
      "serviceId": "SA",
      "dep": "25:57:00",
      "arr": "26:34:00"
    }
  ],
  "MT": [
    {
      "tripId": "115890747",
      "serviceId": "MT",
      "dep": "04:12:00",
      "arr": "04:49:00"
    },
    {
      "tripId": "115890746",
      "serviceId": "MT",
      "dep": "04:42:00",
      "arr": "05:19:00"
    },
    {
      "tripId": "115890745",
      "serviceId": "MT",
      "dep": "05:12:00",
      "arr": "05:49:00"
    },
    {
      "tripId": "115890773",
      "serviceId": "MT",
      "dep": "05:27:00",
      "arr": "06:04:00"
    },
    {
      "tripId": "115890744",
      "serviceId": "MT",
      "dep": "05:42:00",
      "arr": "06:19:00"
    },
    {
      "tripId": "115890772",
      "serviceId": "MT",
      "dep": "05:57:00",
      "arr": "06:34:00"
    },
    {
      "tripId": "115890743",
      "serviceId": "MT",
      "dep": "06:12:00",
      "arr": "06:49:00"
    },
    {
      "tripId": "115890771",
      "serviceId": "MT",
      "dep": "06:27:00",
      "arr": "07:04:00"
    },
    {
      "tripId": "115890742",
      "serviceId": "MT",
      "dep": "06:42:00",
      "arr": "07:19:00"
    },
    {
      "tripId": "115890770",
      "serviceId": "MT",
      "dep": "06:57:00",
      "arr": "07:34:00"
    },
    {
      "tripId": "115890741",
      "serviceId": "MT",
      "dep": "07:12:00",
      "arr": "07:49:00"
    },
    {
      "tripId": "115890768",
      "serviceId": "MT",
      "dep": "07:27:00",
      "arr": "08:04:00"
    },
    {
      "tripId": "115890740",
      "serviceId": "MT",
      "dep": "07:42:00",
      "arr": "08:19:00"
    },
    {
      "tripId": "115890767",
      "serviceId": "MT",
      "dep": "07:57:00",
      "arr": "08:34:00"
    },
    {
      "tripId": "115890739",
      "serviceId": "MT",
      "dep": "08:12:00",
      "arr": "08:49:00"
    },
    {
      "tripId": "115890766",
      "serviceId": "MT",
      "dep": "08:27:00",
      "arr": "09:04:00"
    },
    {
      "tripId": "115890738",
      "serviceId": "MT",
      "dep": "08:42:00",
      "arr": "09:19:00"
    },
    {
      "tripId": "115890765",
      "serviceId": "MT",
      "dep": "08:57:00",
      "arr": "09:34:00"
    },
    {
      "tripId": "115890737",
      "serviceId": "MT",
      "dep": "09:12:00",
      "arr": "09:49:00"
    },
    {
      "tripId": "115890764",
      "serviceId": "MT",
      "dep": "09:27:00",
      "arr": "10:04:00"
    },
    {
      "tripId": "115890736",
      "serviceId": "MT",
      "dep": "09:42:00",
      "arr": "10:19:00"
    },
    {
      "tripId": "115890763",
      "serviceId": "MT",
      "dep": "09:57:00",
      "arr": "10:34:00"
    },
    {
      "tripId": "115890735",
      "serviceId": "MT",
      "dep": "10:12:00",
      "arr": "10:49:00"
    },
    {
      "tripId": "115890760",
      "serviceId": "MT",
      "dep": "10:27:00",
      "arr": "11:04:00"
    },
    {
      "tripId": "115890734",
      "serviceId": "MT",
      "dep": "10:42:00",
      "arr": "11:19:00"
    },
    {
      "tripId": "115890762",
      "serviceId": "MT",
      "dep": "10:57:00",
      "arr": "11:34:00"
    },
    {
      "tripId": "115890733",
      "serviceId": "MT",
      "dep": "11:12:00",
      "arr": "11:49:00"
    },
    {
      "tripId": "115890761",
      "serviceId": "MT",
      "dep": "11:27:00",
      "arr": "12:04:00"
    },
    {
      "tripId": "115890732",
      "serviceId": "MT",
      "dep": "11:42:00",
      "arr": "12:19:00"
    },
    {
      "tripId": "115890759",
      "serviceId": "MT",
      "dep": "11:57:00",
      "arr": "12:34:00"
    },
    {
      "tripId": "115890731",
      "serviceId": "MT",
      "dep": "12:12:00",
      "arr": "12:49:00"
    },
    {
      "tripId": "115890758",
      "serviceId": "MT",
      "dep": "12:27:00",
      "arr": "13:04:00"
    },
    {
      "tripId": "115890730",
      "serviceId": "MT",
      "dep": "12:42:00",
      "arr": "13:19:00"
    },
    {
      "tripId": "115890757",
      "serviceId": "MT",
      "dep": "12:57:00",
      "arr": "13:34:00"
    },
    {
      "tripId": "115890729",
      "serviceId": "MT",
      "dep": "13:12:00",
      "arr": "13:49:00"
    },
    {
      "tripId": "115890756",
      "serviceId": "MT",
      "dep": "13:27:00",
      "arr": "14:04:00"
    },
    {
      "tripId": "115890728",
      "serviceId": "MT",
      "dep": "13:42:00",
      "arr": "14:19:00"
    },
    {
      "tripId": "115890755",
      "serviceId": "MT",
      "dep": "13:57:00",
      "arr": "14:34:00"
    },
    {
      "tripId": "115890727",
      "serviceId": "MT",
      "dep": "14:12:00",
      "arr": "14:49:00"
    },
    {
      "tripId": "115890754",
      "serviceId": "MT",
      "dep": "14:27:00",
      "arr": "15:04:00"
    },
    {
      "tripId": "115890726",
      "serviceId": "MT",
      "dep": "14:42:00",
      "arr": "15:19:00"
    },
    {
      "tripId": "115890753",
      "serviceId": "MT",
      "dep": "14:57:00",
      "arr": "15:34:00"
    },
    {
      "tripId": "115890725",
      "serviceId": "MT",
      "dep": "15:12:00",
      "arr": "15:49:00"
    },
    {
      "tripId": "115890752",
      "serviceId": "MT",
      "dep": "15:27:00",
      "arr": "16:04:00"
    },
    {
      "tripId": "115890781",
      "serviceId": "MT",
      "dep": "15:42:00",
      "arr": "16:19:00"
    },
    {
      "tripId": "115890751",
      "serviceId": "MT",
      "dep": "15:57:00",
      "arr": "16:34:00"
    },
    {
      "tripId": "115890780",
      "serviceId": "MT",
      "dep": "16:12:00",
      "arr": "16:49:00"
    },
    {
      "tripId": "115890750",
      "serviceId": "MT",
      "dep": "16:27:00",
      "arr": "17:04:00"
    },
    {
      "tripId": "115890779",
      "serviceId": "MT",
      "dep": "16:42:00",
      "arr": "17:19:00"
    },
    {
      "tripId": "115890749",
      "serviceId": "MT",
      "dep": "16:57:00",
      "arr": "17:34:00"
    },
    {
      "tripId": "115890778",
      "serviceId": "MT",
      "dep": "17:12:00",
      "arr": "17:49:00"
    },
    {
      "tripId": "115890748",
      "serviceId": "MT",
      "dep": "17:27:00",
      "arr": "18:04:00"
    },
    {
      "tripId": "115890777",
      "serviceId": "MT",
      "dep": "17:42:00",
      "arr": "18:19:00"
    },
    {
      "tripId": "115890769",
      "serviceId": "MT",
      "dep": "17:57:00",
      "arr": "18:34:00"
    },
    {
      "tripId": "115890776",
      "serviceId": "MT",
      "dep": "18:12:00",
      "arr": "18:49:00"
    },
    {
      "tripId": "115890724",
      "serviceId": "MT",
      "dep": "18:27:00",
      "arr": "19:04:00"
    },
    {
      "tripId": "115890775",
      "serviceId": "MT",
      "dep": "18:42:00",
      "arr": "19:19:00"
    },
    {
      "tripId": "115890723",
      "serviceId": "MT",
      "dep": "18:57:00",
      "arr": "19:34:00"
    },
    {
      "tripId": "115890774",
      "serviceId": "MT",
      "dep": "19:12:00",
      "arr": "19:49:00"
    },
    {
      "tripId": "115890722",
      "serviceId": "MT",
      "dep": "19:27:00",
      "arr": "20:04:00"
    },
    {
      "tripId": "115890721",
      "serviceId": "MT",
      "dep": "19:57:00",
      "arr": "20:34:00"
    },
    {
      "tripId": "115890720",
      "serviceId": "MT",
      "dep": "20:27:00",
      "arr": "21:04:00"
    },
    {
      "tripId": "115890719",
      "serviceId": "MT",
      "dep": "20:57:00",
      "arr": "21:34:00"
    },
    {
      "tripId": "115890718",
      "serviceId": "MT",
      "dep": "21:27:00",
      "arr": "22:04:00"
    },
    {
      "tripId": "115890717",
      "serviceId": "MT",
      "dep": "21:57:00",
      "arr": "22:34:00"
    },
    {
      "tripId": "115890716",
      "serviceId": "MT",
      "dep": "22:27:00",
      "arr": "23:04:00"
    },
    {
      "tripId": "115890715",
      "serviceId": "MT",
      "dep": "22:57:00",
      "arr": "23:34:00"
    },
    {
      "tripId": "115890714",
      "serviceId": "MT",
      "dep": "23:27:00",
      "arr": "24:04:00"
    },
    {
      "tripId": "115890713",
      "serviceId": "MT",
      "dep": "23:57:00",
      "arr": "24:34:00"
    },
    {
      "tripId": "115890712",
      "serviceId": "MT",
      "dep": "24:27:00",
      "arr": "25:04:00"
    },
    {
      "tripId": "115890711",
      "serviceId": "MT",
      "dep": "24:57:00",
      "arr": "25:34:00"
    },
    {
      "tripId": "115890710",
      "serviceId": "MT",
      "dep": "25:27:00",
      "arr": "26:04:00"
    }
  ],
  "FR": [
    {
      "tripId": "115890579",
      "serviceId": "FR",
      "dep": "04:12:00",
      "arr": "04:49:00"
    },
    {
      "tripId": "115890578",
      "serviceId": "FR",
      "dep": "04:42:00",
      "arr": "05:19:00"
    },
    {
      "tripId": "115890577",
      "serviceId": "FR",
      "dep": "05:12:00",
      "arr": "05:49:00"
    },
    {
      "tripId": "115890552",
      "serviceId": "FR",
      "dep": "05:27:00",
      "arr": "06:04:00"
    },
    {
      "tripId": "115890576",
      "serviceId": "FR",
      "dep": "05:42:00",
      "arr": "06:19:00"
    },
    {
      "tripId": "115890626",
      "serviceId": "FR",
      "dep": "05:57:00",
      "arr": "06:34:00"
    },
    {
      "tripId": "115890575",
      "serviceId": "FR",
      "dep": "06:12:00",
      "arr": "06:49:00"
    },
    {
      "tripId": "115890625",
      "serviceId": "FR",
      "dep": "06:27:00",
      "arr": "07:04:00"
    },
    {
      "tripId": "115890574",
      "serviceId": "FR",
      "dep": "06:42:00",
      "arr": "07:19:00"
    },
    {
      "tripId": "115890628",
      "serviceId": "FR",
      "dep": "06:57:00",
      "arr": "07:34:00"
    },
    {
      "tripId": "115890557",
      "serviceId": "FR",
      "dep": "07:12:00",
      "arr": "07:49:00"
    },
    {
      "tripId": "115890624",
      "serviceId": "FR",
      "dep": "07:27:00",
      "arr": "08:04:00"
    },
    {
      "tripId": "115890573",
      "serviceId": "FR",
      "dep": "07:42:00",
      "arr": "08:19:00"
    },
    {
      "tripId": "115890623",
      "serviceId": "FR",
      "dep": "07:57:00",
      "arr": "08:34:00"
    },
    {
      "tripId": "115890572",
      "serviceId": "FR",
      "dep": "08:12:00",
      "arr": "08:49:00"
    },
    {
      "tripId": "115890621",
      "serviceId": "FR",
      "dep": "08:27:00",
      "arr": "09:04:00"
    },
    {
      "tripId": "115890571",
      "serviceId": "FR",
      "dep": "08:42:00",
      "arr": "09:19:00"
    },
    {
      "tripId": "115890620",
      "serviceId": "FR",
      "dep": "08:57:00",
      "arr": "09:34:00"
    },
    {
      "tripId": "115890569",
      "serviceId": "FR",
      "dep": "09:12:00",
      "arr": "09:49:00"
    },
    {
      "tripId": "115890619",
      "serviceId": "FR",
      "dep": "09:27:00",
      "arr": "10:04:00"
    },
    {
      "tripId": "115890568",
      "serviceId": "FR",
      "dep": "09:42:00",
      "arr": "10:19:00"
    },
    {
      "tripId": "115890622",
      "serviceId": "FR",
      "dep": "09:57:00",
      "arr": "10:34:00"
    },
    {
      "tripId": "115890567",
      "serviceId": "FR",
      "dep": "10:12:00",
      "arr": "10:49:00"
    },
    {
      "tripId": "115890618",
      "serviceId": "FR",
      "dep": "10:27:00",
      "arr": "11:04:00"
    },
    {
      "tripId": "115890570",
      "serviceId": "FR",
      "dep": "10:42:00",
      "arr": "11:19:00"
    },
    {
      "tripId": "115890617",
      "serviceId": "FR",
      "dep": "10:57:00",
      "arr": "11:34:00"
    },
    {
      "tripId": "115890566",
      "serviceId": "FR",
      "dep": "11:12:00",
      "arr": "11:49:00"
    },
    {
      "tripId": "115890616",
      "serviceId": "FR",
      "dep": "11:27:00",
      "arr": "12:04:00"
    },
    {
      "tripId": "115890565",
      "serviceId": "FR",
      "dep": "11:42:00",
      "arr": "12:19:00"
    },
    {
      "tripId": "115890615",
      "serviceId": "FR",
      "dep": "11:57:00",
      "arr": "12:34:00"
    },
    {
      "tripId": "115890564",
      "serviceId": "FR",
      "dep": "12:12:00",
      "arr": "12:49:00"
    },
    {
      "tripId": "115890614",
      "serviceId": "FR",
      "dep": "12:27:00",
      "arr": "13:04:00"
    },
    {
      "tripId": "115890562",
      "serviceId": "FR",
      "dep": "12:42:00",
      "arr": "13:19:00"
    },
    {
      "tripId": "115890613",
      "serviceId": "FR",
      "dep": "12:57:00",
      "arr": "13:34:00"
    },
    {
      "tripId": "115890551",
      "serviceId": "FR",
      "dep": "13:12:00",
      "arr": "13:49:00"
    },
    {
      "tripId": "115890612",
      "serviceId": "FR",
      "dep": "13:27:00",
      "arr": "14:04:00"
    },
    {
      "tripId": "115890550",
      "serviceId": "FR",
      "dep": "13:42:00",
      "arr": "14:19:00"
    },
    {
      "tripId": "115890611",
      "serviceId": "FR",
      "dep": "13:57:00",
      "arr": "14:34:00"
    },
    {
      "tripId": "115890629",
      "serviceId": "FR",
      "dep": "14:12:00",
      "arr": "14:49:00"
    },
    {
      "tripId": "115890610",
      "serviceId": "FR",
      "dep": "14:27:00",
      "arr": "15:04:00"
    },
    {
      "tripId": "115890627",
      "serviceId": "FR",
      "dep": "14:42:00",
      "arr": "15:19:00"
    },
    {
      "tripId": "115890607",
      "serviceId": "FR",
      "dep": "14:57:00",
      "arr": "15:34:00"
    },
    {
      "tripId": "115890561",
      "serviceId": "FR",
      "dep": "15:12:00",
      "arr": "15:49:00"
    },
    {
      "tripId": "115890606",
      "serviceId": "FR",
      "dep": "15:27:00",
      "arr": "16:04:00"
    },
    {
      "tripId": "115890560",
      "serviceId": "FR",
      "dep": "15:42:00",
      "arr": "16:19:00"
    },
    {
      "tripId": "115890605",
      "serviceId": "FR",
      "dep": "15:57:00",
      "arr": "16:34:00"
    },
    {
      "tripId": "115890563",
      "serviceId": "FR",
      "dep": "16:12:00",
      "arr": "16:49:00"
    },
    {
      "tripId": "115890609",
      "serviceId": "FR",
      "dep": "16:27:00",
      "arr": "17:04:00"
    },
    {
      "tripId": "115890559",
      "serviceId": "FR",
      "dep": "16:42:00",
      "arr": "17:19:00"
    },
    {
      "tripId": "115890608",
      "serviceId": "FR",
      "dep": "16:57:00",
      "arr": "17:34:00"
    },
    {
      "tripId": "115890558",
      "serviceId": "FR",
      "dep": "17:12:00",
      "arr": "17:49:00"
    },
    {
      "tripId": "115890604",
      "serviceId": "FR",
      "dep": "17:27:00",
      "arr": "18:04:00"
    },
    {
      "tripId": "115890556",
      "serviceId": "FR",
      "dep": "17:42:00",
      "arr": "18:19:00"
    },
    {
      "tripId": "115890603",
      "serviceId": "FR",
      "dep": "17:57:00",
      "arr": "18:34:00"
    },
    {
      "tripId": "115890555",
      "serviceId": "FR",
      "dep": "18:12:00",
      "arr": "18:49:00"
    },
    {
      "tripId": "115890602",
      "serviceId": "FR",
      "dep": "18:27:00",
      "arr": "19:04:00"
    },
    {
      "tripId": "115890554",
      "serviceId": "FR",
      "dep": "18:42:00",
      "arr": "19:19:00"
    },
    {
      "tripId": "115890601",
      "serviceId": "FR",
      "dep": "18:57:00",
      "arr": "19:34:00"
    },
    {
      "tripId": "115890553",
      "serviceId": "FR",
      "dep": "19:12:00",
      "arr": "19:49:00"
    },
    {
      "tripId": "115890600",
      "serviceId": "FR",
      "dep": "19:27:00",
      "arr": "20:04:00"
    },
    {
      "tripId": "115890599",
      "serviceId": "FR",
      "dep": "19:57:00",
      "arr": "20:34:00"
    },
    {
      "tripId": "115890598",
      "serviceId": "FR",
      "dep": "20:27:00",
      "arr": "21:04:00"
    },
    {
      "tripId": "115890597",
      "serviceId": "FR",
      "dep": "20:57:00",
      "arr": "21:34:00"
    },
    {
      "tripId": "115890596",
      "serviceId": "FR",
      "dep": "21:27:00",
      "arr": "22:04:00"
    },
    {
      "tripId": "115890595",
      "serviceId": "FR",
      "dep": "21:57:00",
      "arr": "22:34:00"
    },
    {
      "tripId": "115890594",
      "serviceId": "FR",
      "dep": "22:27:00",
      "arr": "23:04:00"
    },
    {
      "tripId": "115890592",
      "serviceId": "FR",
      "dep": "22:57:00",
      "arr": "23:34:00"
    },
    {
      "tripId": "115890591",
      "serviceId": "FR",
      "dep": "23:27:00",
      "arr": "24:04:00"
    },
    {
      "tripId": "115890590",
      "serviceId": "FR",
      "dep": "23:57:00",
      "arr": "24:34:00"
    },
    {
      "tripId": "115890593",
      "serviceId": "FR",
      "dep": "24:27:00",
      "arr": "25:04:00"
    },
    {
      "tripId": "115890589",
      "serviceId": "FR",
      "dep": "24:57:00",
      "arr": "25:34:00"
    },
    {
      "tripId": "115890588",
      "serviceId": "FR",
      "dep": "25:27:00",
      "arr": "26:04:00"
    },
    {
      "tripId": "115890587",
      "serviceId": "FR",
      "dep": "25:57:00",
      "arr": "26:34:00"
    }
  ],
  "SU": [
    {
      "tripId": "115891041",
      "serviceId": "SU",
      "dep": "04:12:00",
      "arr": "04:49:00"
    },
    {
      "tripId": "115891040",
      "serviceId": "SU",
      "dep": "04:42:00",
      "arr": "05:19:00"
    },
    {
      "tripId": "115891039",
      "serviceId": "SU",
      "dep": "05:12:00",
      "arr": "05:49:00"
    },
    {
      "tripId": "115891090",
      "serviceId": "SU",
      "dep": "05:27:00",
      "arr": "06:04:00"
    },
    {
      "tripId": "115891038",
      "serviceId": "SU",
      "dep": "05:42:00",
      "arr": "06:19:00"
    },
    {
      "tripId": "115891089",
      "serviceId": "SU",
      "dep": "05:57:00",
      "arr": "06:34:00"
    },
    {
      "tripId": "115891037",
      "serviceId": "SU",
      "dep": "06:12:00",
      "arr": "06:49:00"
    },
    {
      "tripId": "115891088",
      "serviceId": "SU",
      "dep": "06:27:00",
      "arr": "07:04:00"
    },
    {
      "tripId": "115891036",
      "serviceId": "SU",
      "dep": "06:42:00",
      "arr": "07:19:00"
    },
    {
      "tripId": "115891087",
      "serviceId": "SU",
      "dep": "06:57:00",
      "arr": "07:34:00"
    },
    {
      "tripId": "115891035",
      "serviceId": "SU",
      "dep": "07:12:00",
      "arr": "07:49:00"
    },
    {
      "tripId": "115891086",
      "serviceId": "SU",
      "dep": "07:27:00",
      "arr": "08:04:00"
    },
    {
      "tripId": "115891034",
      "serviceId": "SU",
      "dep": "07:42:00",
      "arr": "08:19:00"
    },
    {
      "tripId": "115891085",
      "serviceId": "SU",
      "dep": "07:57:00",
      "arr": "08:34:00"
    },
    {
      "tripId": "115891074",
      "serviceId": "SU",
      "dep": "08:12:00",
      "arr": "08:49:00"
    },
    {
      "tripId": "115891084",
      "serviceId": "SU",
      "dep": "08:27:00",
      "arr": "09:04:00"
    },
    {
      "tripId": "115891033",
      "serviceId": "SU",
      "dep": "08:42:00",
      "arr": "09:19:00"
    },
    {
      "tripId": "115891083",
      "serviceId": "SU",
      "dep": "08:57:00",
      "arr": "09:34:00"
    },
    {
      "tripId": "115891032",
      "serviceId": "SU",
      "dep": "09:12:00",
      "arr": "09:49:00"
    },
    {
      "tripId": "115891082",
      "serviceId": "SU",
      "dep": "09:27:00",
      "arr": "10:04:00"
    },
    {
      "tripId": "115891031",
      "serviceId": "SU",
      "dep": "09:42:00",
      "arr": "10:19:00"
    },
    {
      "tripId": "115891081",
      "serviceId": "SU",
      "dep": "09:57:00",
      "arr": "10:34:00"
    },
    {
      "tripId": "115891030",
      "serviceId": "SU",
      "dep": "10:12:00",
      "arr": "10:49:00"
    },
    {
      "tripId": "115891080",
      "serviceId": "SU",
      "dep": "10:27:00",
      "arr": "11:04:00"
    },
    {
      "tripId": "115891029",
      "serviceId": "SU",
      "dep": "10:42:00",
      "arr": "11:19:00"
    },
    {
      "tripId": "115891079",
      "serviceId": "SU",
      "dep": "10:57:00",
      "arr": "11:34:00"
    },
    {
      "tripId": "115891028",
      "serviceId": "SU",
      "dep": "11:12:00",
      "arr": "11:49:00"
    },
    {
      "tripId": "115891078",
      "serviceId": "SU",
      "dep": "11:27:00",
      "arr": "12:04:00"
    },
    {
      "tripId": "115891027",
      "serviceId": "SU",
      "dep": "11:42:00",
      "arr": "12:19:00"
    },
    {
      "tripId": "115891077",
      "serviceId": "SU",
      "dep": "11:57:00",
      "arr": "12:34:00"
    },
    {
      "tripId": "115891105",
      "serviceId": "SU",
      "dep": "12:12:00",
      "arr": "12:49:00"
    },
    {
      "tripId": "115891076",
      "serviceId": "SU",
      "dep": "12:27:00",
      "arr": "13:04:00"
    },
    {
      "tripId": "115891104",
      "serviceId": "SU",
      "dep": "12:42:00",
      "arr": "13:19:00"
    },
    {
      "tripId": "115891075",
      "serviceId": "SU",
      "dep": "12:57:00",
      "arr": "13:34:00"
    },
    {
      "tripId": "115891103",
      "serviceId": "SU",
      "dep": "13:12:00",
      "arr": "13:49:00"
    },
    {
      "tripId": "115891067",
      "serviceId": "SU",
      "dep": "13:27:00",
      "arr": "14:04:00"
    },
    {
      "tripId": "115891102",
      "serviceId": "SU",
      "dep": "13:42:00",
      "arr": "14:19:00"
    },
    {
      "tripId": "115891066",
      "serviceId": "SU",
      "dep": "13:57:00",
      "arr": "14:34:00"
    },
    {
      "tripId": "115891101",
      "serviceId": "SU",
      "dep": "14:12:00",
      "arr": "14:49:00"
    },
    {
      "tripId": "115891065",
      "serviceId": "SU",
      "dep": "14:27:00",
      "arr": "15:04:00"
    },
    {
      "tripId": "115891100",
      "serviceId": "SU",
      "dep": "14:42:00",
      "arr": "15:19:00"
    },
    {
      "tripId": "115891064",
      "serviceId": "SU",
      "dep": "14:57:00",
      "arr": "15:34:00"
    },
    {
      "tripId": "115891099",
      "serviceId": "SU",
      "dep": "15:12:00",
      "arr": "15:49:00"
    },
    {
      "tripId": "115891063",
      "serviceId": "SU",
      "dep": "15:27:00",
      "arr": "16:04:00"
    },
    {
      "tripId": "115891098",
      "serviceId": "SU",
      "dep": "15:42:00",
      "arr": "16:19:00"
    },
    {
      "tripId": "115891073",
      "serviceId": "SU",
      "dep": "15:57:00",
      "arr": "16:34:00"
    },
    {
      "tripId": "115891097",
      "serviceId": "SU",
      "dep": "16:12:00",
      "arr": "16:49:00"
    },
    {
      "tripId": "115891072",
      "serviceId": "SU",
      "dep": "16:27:00",
      "arr": "17:04:00"
    },
    {
      "tripId": "115891096",
      "serviceId": "SU",
      "dep": "16:42:00",
      "arr": "17:19:00"
    },
    {
      "tripId": "115891071",
      "serviceId": "SU",
      "dep": "16:57:00",
      "arr": "17:34:00"
    },
    {
      "tripId": "115891095",
      "serviceId": "SU",
      "dep": "17:12:00",
      "arr": "17:49:00"
    },
    {
      "tripId": "115891070",
      "serviceId": "SU",
      "dep": "17:27:00",
      "arr": "18:04:00"
    },
    {
      "tripId": "115891094",
      "serviceId": "SU",
      "dep": "17:42:00",
      "arr": "18:19:00"
    },
    {
      "tripId": "115891069",
      "serviceId": "SU",
      "dep": "17:57:00",
      "arr": "18:34:00"
    },
    {
      "tripId": "115891093",
      "serviceId": "SU",
      "dep": "18:12:00",
      "arr": "18:49:00"
    },
    {
      "tripId": "115891068",
      "serviceId": "SU",
      "dep": "18:27:00",
      "arr": "19:04:00"
    },
    {
      "tripId": "115891092",
      "serviceId": "SU",
      "dep": "18:42:00",
      "arr": "19:19:00"
    },
    {
      "tripId": "115891062",
      "serviceId": "SU",
      "dep": "18:57:00",
      "arr": "19:34:00"
    },
    {
      "tripId": "115891091",
      "serviceId": "SU",
      "dep": "19:12:00",
      "arr": "19:49:00"
    },
    {
      "tripId": "115891061",
      "serviceId": "SU",
      "dep": "19:27:00",
      "arr": "20:04:00"
    },
    {
      "tripId": "115891060",
      "serviceId": "SU",
      "dep": "19:57:00",
      "arr": "20:34:00"
    },
    {
      "tripId": "115891059",
      "serviceId": "SU",
      "dep": "20:27:00",
      "arr": "21:04:00"
    },
    {
      "tripId": "115891058",
      "serviceId": "SU",
      "dep": "20:57:00",
      "arr": "21:34:00"
    },
    {
      "tripId": "115891057",
      "serviceId": "SU",
      "dep": "21:27:00",
      "arr": "22:04:00"
    },
    {
      "tripId": "115891056",
      "serviceId": "SU",
      "dep": "21:57:00",
      "arr": "22:34:00"
    },
    {
      "tripId": "115891055",
      "serviceId": "SU",
      "dep": "22:27:00",
      "arr": "23:04:00"
    },
    {
      "tripId": "115891054",
      "serviceId": "SU",
      "dep": "22:57:00",
      "arr": "23:34:00"
    },
    {
      "tripId": "115891053",
      "serviceId": "SU",
      "dep": "23:27:00",
      "arr": "24:04:00"
    },
    {
      "tripId": "115891052",
      "serviceId": "SU",
      "dep": "23:57:00",
      "arr": "24:34:00"
    },
    {
      "tripId": "115891051",
      "serviceId": "SU",
      "dep": "24:27:00",
      "arr": "25:04:00"
    },
    {
      "tripId": "115891050",
      "serviceId": "SU",
      "dep": "24:57:00",
      "arr": "25:34:00"
    },
    {
      "tripId": "115891049",
      "serviceId": "SU",
      "dep": "25:27:00",
      "arr": "26:04:00"
    }
  ]
};

export const BUSTANG_WEST_TRIPS_BY_SERVICE: Record<string, GtfsCorridorTrip[]> = {
  "SA": [
    {
      "tripId": "116053679",
      "serviceId": "SA",
      "dep": "06:00:00",
      "arr": "08:20:00"
    },
    {
      "tripId": "116053669",
      "serviceId": "SA",
      "dep": "07:00:00",
      "arr": "09:20:00"
    },
    {
      "tripId": "116053677",
      "serviceId": "SA",
      "dep": "08:00:00",
      "arr": "10:20:00"
    },
    {
      "tripId": "116053671",
      "serviceId": "SA",
      "dep": "08:45:00",
      "arr": "11:10:00"
    },
    {
      "tripId": "116053675",
      "serviceId": "SA",
      "dep": "09:30:00",
      "arr": "11:50:00"
    },
    {
      "tripId": "116053667",
      "serviceId": "SA",
      "dep": "10:15:00",
      "arr": "12:35:00"
    },
    {
      "tripId": "116053676",
      "serviceId": "SA",
      "dep": "11:00:00",
      "arr": "13:20:00"
    },
    {
      "tripId": "116053674",
      "serviceId": "SA",
      "dep": "11:45:00",
      "arr": "14:05:00"
    },
    {
      "tripId": "116053666",
      "serviceId": "SA",
      "dep": "12:30:00",
      "arr": "14:50:00"
    },
    {
      "tripId": "116053678",
      "serviceId": "SA",
      "dep": "13:15:00",
      "arr": "15:35:00"
    },
    {
      "tripId": "116053670",
      "serviceId": "SA",
      "dep": "14:00:00",
      "arr": "16:20:00"
    },
    {
      "tripId": "116053668",
      "serviceId": "SA",
      "dep": "14:45:00",
      "arr": "17:05:00"
    },
    {
      "tripId": "116053680",
      "serviceId": "SA",
      "dep": "15:30:00",
      "arr": "17:50:00"
    },
    {
      "tripId": "116053672",
      "serviceId": "SA",
      "dep": "16:30:00",
      "arr": "19:05:00"
    },
    {
      "tripId": "116053673",
      "serviceId": "SA",
      "dep": "17:15:00",
      "arr": "19:35:00"
    }
  ],
  "SU": [
    {
      "tripId": "116053709",
      "serviceId": "SU",
      "dep": "06:00:00",
      "arr": "08:20:00"
    },
    {
      "tripId": "116053700",
      "serviceId": "SU",
      "dep": "07:00:00",
      "arr": "09:20:00"
    },
    {
      "tripId": "116053706",
      "serviceId": "SU",
      "dep": "08:00:00",
      "arr": "10:20:00"
    },
    {
      "tripId": "116053699",
      "serviceId": "SU",
      "dep": "08:45:00",
      "arr": "11:10:00"
    },
    {
      "tripId": "116053705",
      "serviceId": "SU",
      "dep": "09:30:00",
      "arr": "11:50:00"
    },
    {
      "tripId": "116053698",
      "serviceId": "SU",
      "dep": "10:15:00",
      "arr": "12:35:00"
    },
    {
      "tripId": "116053707",
      "serviceId": "SU",
      "dep": "11:00:00",
      "arr": "13:20:00"
    },
    {
      "tripId": "116053704",
      "serviceId": "SU",
      "dep": "11:45:00",
      "arr": "14:05:00"
    },
    {
      "tripId": "116053697",
      "serviceId": "SU",
      "dep": "12:30:00",
      "arr": "14:50:00"
    },
    {
      "tripId": "116053708",
      "serviceId": "SU",
      "dep": "13:15:00",
      "arr": "15:35:00"
    },
    {
      "tripId": "116053702",
      "serviceId": "SU",
      "dep": "14:00:00",
      "arr": "16:20:00"
    },
    {
      "tripId": "116053696",
      "serviceId": "SU",
      "dep": "14:45:00",
      "arr": "17:05:00"
    },
    {
      "tripId": "116053710",
      "serviceId": "SU",
      "dep": "15:30:00",
      "arr": "17:50:00"
    },
    {
      "tripId": "116053703",
      "serviceId": "SU",
      "dep": "16:30:00",
      "arr": "19:05:00"
    },
    {
      "tripId": "116053701",
      "serviceId": "SU",
      "dep": "17:15:00",
      "arr": "19:35:00"
    }
  ],
  "WK": [
    {
      "tripId": "116053739",
      "serviceId": "WK",
      "dep": "06:00:00",
      "arr": "08:20:00"
    },
    {
      "tripId": "116053732",
      "serviceId": "WK",
      "dep": "07:00:00",
      "arr": "09:20:00"
    },
    {
      "tripId": "116053737",
      "serviceId": "WK",
      "dep": "08:00:00",
      "arr": "10:20:00"
    },
    {
      "tripId": "116053733",
      "serviceId": "WK",
      "dep": "08:45:00",
      "arr": "11:10:00"
    },
    {
      "tripId": "116053735",
      "serviceId": "WK",
      "dep": "09:30:00",
      "arr": "11:50:00"
    },
    {
      "tripId": "116053728",
      "serviceId": "WK",
      "dep": "10:15:00",
      "arr": "12:35:00"
    },
    {
      "tripId": "116053736",
      "serviceId": "WK",
      "dep": "11:00:00",
      "arr": "13:20:00"
    },
    {
      "tripId": "116053734",
      "serviceId": "WK",
      "dep": "11:45:00",
      "arr": "14:05:00"
    },
    {
      "tripId": "116053727",
      "serviceId": "WK",
      "dep": "12:30:00",
      "arr": "14:50:00"
    },
    {
      "tripId": "116053738",
      "serviceId": "WK",
      "dep": "13:15:00",
      "arr": "15:35:00"
    },
    {
      "tripId": "116053730",
      "serviceId": "WK",
      "dep": "14:00:00",
      "arr": "16:20:00"
    },
    {
      "tripId": "116053726",
      "serviceId": "WK",
      "dep": "14:45:00",
      "arr": "17:05:00"
    },
    {
      "tripId": "116053740",
      "serviceId": "WK",
      "dep": "15:30:00",
      "arr": "17:50:00"
    },
    {
      "tripId": "116053729",
      "serviceId": "WK",
      "dep": "16:30:00",
      "arr": "19:05:00"
    },
    {
      "tripId": "116053731",
      "serviceId": "WK",
      "dep": "17:15:00",
      "arr": "19:35:00"
    }
  ]
};

export const PEGASUS_TRIPS_BY_SERVICE: Record<string, GtfsCorridorTrip[]> = {
  "SA": [
    {
      "tripId": "116053050",
      "serviceId": "SA",
      "dep": "06:00:00",
      "arr": "08:10:00"
    },
    {
      "tripId": "116053051",
      "serviceId": "SA",
      "dep": "08:00:00",
      "arr": "10:10:00"
    },
    {
      "tripId": "116053042",
      "serviceId": "SA",
      "dep": "09:00:00",
      "arr": "11:10:00"
    },
    {
      "tripId": "116053049",
      "serviceId": "SA",
      "dep": "10:00:00",
      "arr": "12:10:00"
    },
    {
      "tripId": "116053043",
      "serviceId": "SA",
      "dep": "11:00:00",
      "arr": "13:10:00"
    },
    {
      "tripId": "116053044",
      "serviceId": "SA",
      "dep": "12:00:00",
      "arr": "14:10:00"
    },
    {
      "tripId": "116053045",
      "serviceId": "SA",
      "dep": "13:00:00",
      "arr": "15:10:00"
    },
    {
      "tripId": "116053046",
      "serviceId": "SA",
      "dep": "15:00:00",
      "arr": "17:10:00"
    },
    {
      "tripId": "116053048",
      "serviceId": "SA",
      "dep": "17:00:00",
      "arr": "19:10:00"
    },
    {
      "tripId": "116053047",
      "serviceId": "SA",
      "dep": "19:30:00",
      "arr": "21:40:00"
    }
  ],
  "SU": [
    {
      "tripId": "116053065",
      "serviceId": "SU",
      "dep": "06:00:00",
      "arr": "08:10:00"
    },
    {
      "tripId": "116053066",
      "serviceId": "SU",
      "dep": "08:00:00",
      "arr": "10:10:00"
    },
    {
      "tripId": "116053067",
      "serviceId": "SU",
      "dep": "09:00:00",
      "arr": "11:10:00"
    },
    {
      "tripId": "116053062",
      "serviceId": "SU",
      "dep": "10:00:00",
      "arr": "12:10:00"
    },
    {
      "tripId": "116053068",
      "serviceId": "SU",
      "dep": "11:00:00",
      "arr": "13:10:00"
    },
    {
      "tripId": "116053069",
      "serviceId": "SU",
      "dep": "12:00:00",
      "arr": "14:10:00"
    },
    {
      "tripId": "116053070",
      "serviceId": "SU",
      "dep": "13:00:00",
      "arr": "15:10:00"
    },
    {
      "tripId": "116053071",
      "serviceId": "SU",
      "dep": "15:00:00",
      "arr": "17:10:00"
    },
    {
      "tripId": "116053063",
      "serviceId": "SU",
      "dep": "17:00:00",
      "arr": "19:10:00"
    },
    {
      "tripId": "116053064",
      "serviceId": "SU",
      "dep": "19:30:00",
      "arr": "21:40:00"
    }
  ],
  "P_Fri": [
    {
      "tripId": "116053084",
      "serviceId": "P_Fri",
      "dep": "08:00:00",
      "arr": "10:10:00"
    },
    {
      "tripId": "116053082",
      "serviceId": "P_Fri",
      "dep": "10:00:00",
      "arr": "12:10:00"
    },
    {
      "tripId": "116053086",
      "serviceId": "P_Fri",
      "dep": "12:00:00",
      "arr": "14:10:00"
    },
    {
      "tripId": "116053088",
      "serviceId": "P_Fri",
      "dep": "15:00:00",
      "arr": "17:10:00"
    }
  ],
  "WK": [
    {
      "tripId": "116053091",
      "serviceId": "WK",
      "dep": "06:00:00",
      "arr": "08:10:00"
    },
    {
      "tripId": "116053083",
      "serviceId": "WK",
      "dep": "09:00:00",
      "arr": "11:10:00"
    },
    {
      "tripId": "116053085",
      "serviceId": "WK",
      "dep": "11:00:00",
      "arr": "13:10:00"
    },
    {
      "tripId": "116053087",
      "serviceId": "WK",
      "dep": "13:00:00",
      "arr": "15:10:00"
    },
    {
      "tripId": "116053089",
      "serviceId": "WK",
      "dep": "17:00:00",
      "arr": "19:10:00"
    },
    {
      "tripId": "116053090",
      "serviceId": "WK",
      "dep": "19:30:00",
      "arr": "21:40:00"
    }
  ]
};
