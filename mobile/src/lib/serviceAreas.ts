export type ServiceArea = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  /** NOAA tide-prediction station; null for inland / freshwater areas */
  noaaStationId: string | null;
};

/**
 * Flagship service areas used for tides selection.
 * Names align with boating_locations; coastal areas map to NOAA stations.
 */
export const SERVICE_AREAS: ServiceArea[] = [
  {
    id: 'lake-travis-tx',
    name: 'Lake Travis, TX',
    latitude: 30.388,
    longitude: -97.94,
    noaaStationId: null,
  },
  {
    id: 'lake-austin-tx',
    name: 'Lake Austin, TX',
    latitude: 30.295,
    longitude: -97.785,
    noaaStationId: null,
  },
  {
    id: 'lake-lbj-tx',
    name: 'Lake LBJ, TX',
    latitude: 30.56,
    longitude: -98.35,
    noaaStationId: null,
  },
  {
    id: 'lake-ray-hubbard-tx',
    name: 'Lake Ray Hubbard, TX',
    latitude: 32.83,
    longitude: -96.51,
    noaaStationId: null,
  },
  {
    id: 'lake-conroe-tx',
    name: 'Lake Conroe, TX',
    latitude: 30.42,
    longitude: -95.58,
    noaaStationId: null,
  },
  {
    id: 'galveston-bay-tx',
    name: 'Galveston Bay, TX',
    latitude: 29.55,
    longitude: -94.85,
    noaaStationId: '8771013', // Eagle Point, Galveston Bay
  },
  {
    id: 'tampa-bay-fl',
    name: 'Tampa Bay, FL',
    latitude: 27.76,
    longitude: -82.54,
    noaaStationId: '8726520', // St. Petersburg
  },
  {
    id: 'fort-myers-fl',
    name: 'Fort Myers, FL',
    latitude: 26.64,
    longitude: -81.87,
    noaaStationId: '8725520',
  },
  {
    id: 'miami-fl',
    name: 'Miami, FL',
    latitude: 25.76,
    longitude: -80.19,
    noaaStationId: '8723214', // Virginia Key
  },
  {
    id: 'fort-lauderdale-fl',
    name: 'Fort Lauderdale, FL',
    latitude: 26.12,
    longitude: -80.14,
    noaaStationId: '8722937', // Andrews Ave Bridge
  },
  {
    id: 'daytona-beach-fl',
    name: 'Daytona Beach, FL',
    latitude: 29.21,
    longitude: -81.02,
    noaaStationId: '8721120', // Daytona Beach Shores
  },
  {
    id: 'saint-augustine-fl',
    name: 'Saint Augustine, FL',
    latitude: 29.89,
    longitude: -81.31,
    noaaStationId: '8720576',
  },
];

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Approximate distance in miles (Haversine). */
export const distanceMiles = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const findNearestServiceArea = (
  latitude: number,
  longitude: number,
  areas: ServiceArea[] = SERVICE_AREAS,
): ServiceArea | null => {
  if (!areas.length) {
    return null;
  }

  let nearest = areas[0];
  let nearestDistance = Number.POSITIVE_INFINITY;

  areas.forEach(area => {
    const distance = distanceMiles(
      latitude,
      longitude,
      area.latitude,
      area.longitude,
    );
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = area;
    }
  });

  return nearest;
};

export const getServiceAreaById = (
  id: string,
  areas: ServiceArea[] = SERVICE_AREAS,
): ServiceArea | null => areas.find(area => area.id === id) ?? null;

export const getServiceAreaByName = (
  name: string,
  areas: ServiceArea[] = SERVICE_AREAS,
): ServiceArea | null =>
  areas.find(area => area.name.toLowerCase() === name.trim().toLowerCase()) ??
  null;

export const serviceAreaSupportsTides = (area: ServiceArea | null | undefined) =>
  Boolean(area?.noaaStationId);

export const findNearestCoastalServiceArea = (
  latitude: number,
  longitude: number,
): ServiceArea | null =>
  findNearestServiceArea(
    latitude,
    longitude,
    SERVICE_AREAS.filter(area => serviceAreaSupportsTides(area)),
  );
