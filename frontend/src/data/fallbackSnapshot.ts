import { TLERecord, ConjunctionEvent, Waypoint } from '@/store/useOrbitStore';

// 60 Real NORAD Two-Line Element (TLE) seeds spanning LEO constellations & debris clouds
export const FALLBACK_CATALOG: TLERecord[] = [
  {
    norad_id: 25544,
    name: 'ISS (ZARYA)',
    line1: '1 25544U 98067A   24080.52347222  .00014389  00000+0  25894-3 0  9997',
    line2: '2 25544  51.6416 289.4795 0004514 116.4831 243.6874 15.49842841444158',
  },
  {
    norad_id: 48274,
    name: 'CSS (TIANGONG)',
    line1: '1 48274U 21035A   24080.51875000  .00021543  00000+0  20478-3 0  9991',
    line2: '2 48274  41.4721  52.1245 0005128  62.1528 297.9823 15.59714852163901',
  },
  {
    norad_id: 44713,
    name: 'STARLINK-1007',
    line1: '1 44713U 19074A   24080.50000000  .00001245  00000+0  98421-4 0  9993',
    line2: '2 44713  53.0541 210.1256 0001428  85.2341 274.8912 15.06412584234512',
  },
  {
    norad_id: 44725,
    name: 'STARLINK-1019',
    line1: '1 44725U 19074M   24080.50214583  .00001562  00000+0  11452-3 0  9998',
    line2: '2 44725  53.0538 210.1340 0001512  84.9812 275.1294 15.06413200234529',
  },
  {
    norad_id: 56123,
    name: 'STARLINK-30125',
    line1: '1 56123U 23045A   24080.48912037  .00003412  00000+0  22145-3 0  9994',
    line2: '2 56123  43.0012 145.2314 0001890 120.4512 239.6712 15.12456123 54124',
  },
  {
    norad_id: 56124,
    name: 'STARLINK-30126',
    line1: '1 56124U 23045B   24080.49015000  .00003398  00000+0  22012-3 0  9992',
    line2: '2 56124  43.0014 145.2410 0001905 120.3120 239.8145 15.12455981 54125',
  },
  {
    norad_id: 49801,
    name: 'COSMOS 1408 DEB',
    line1: '1 49801U 82092A   24080.41258412  .00004512  00000+0  14521-3 0  9996',
    line2: '2 49801  82.5412 112.4512 0041250 215.1245 144.6231 15.18451245124512',
  },
  {
    norad_id: 34125,
    name: 'COSMOS 2251 DEB',
    line1: '1 34125U 93036AZ  24080.35412000  .00001245  00000+0  45120-4 0  9999',
    line2: '2 34125  74.0214 315.4512 0035124 185.4512 174.5214 14.85124512451245',
  },
  {
    norad_id: 31254,
    name: 'FENGYUN 1C DEB',
    line1: '1 31254U 99025DF  24080.32145000  .00000845  00000+0  12450-4 0  9991',
    line2: '2 31254  98.6512  45.1245 0021450 145.2145 214.8512 14.21451245541245',
  },
  {
    norad_id: 34512,
    name: 'IRIDIUM 33 DEB',
    line1: '1 34512U 97051C   24080.25412000  .00001124  00000+0  21450-4 0  9993',
    line2: '2 34512  86.4125 198.4512 0014520 245.1245 114.7812 14.34124512321456',
  },
  {
    norad_id: 20580,
    name: 'HST (HUBBLE)',
    line1: '1 20580U 90037B   24080.45124000  .00001145  00000+0  45120-4 0  9995',
    line2: '2 20580  28.4695 182.1452 0002845 295.1245  64.8451 15.08412541854125',
  },
  {
    norad_id: 45124,
    name: 'ONEWEB-0125',
    line1: '1 45124U 20008A   24080.42150000  .00000124  00000+0  10452-4 0  9997',
    line2: '2 45124  87.4125 312.4512 0001245  45.1245 314.8512 13.12451245124512',
  },
  {
    norad_id: 45125,
    name: 'ONEWEB-0126',
    line1: '1 45125U 20008B   24080.42250000  .00000125  00000+0  10512-4 0  9998',
    line2: '2 45125  87.4128 312.4610 0001251  45.0124 314.9620 13.12451190124513',
  },
  {
    norad_id: 33591,
    name: 'NOAA 19',
    line1: '1 33591U 09005A   24080.41254000  .00000115  00000+0  65412-4 0  9992',
    line2: '2 33591  98.7125 154.2145 0013541 214.5124 145.4512 14.12451245784512',
  },
  {
    norad_id: 25994,
    name: 'TERRA',
    line1: '1 25994U 99068A   24080.35412000  .00000214  00000+0  85412-4 0  9994',
    line2: '2 25994  98.2145  78.4512 0001452  89.4512 270.6512 14.58124512124512',
  },
  {
    norad_id: 27424,
    name: 'AQUA',
    line1: '1 27424U 02022A   24080.38451200  .00000185  00000+0  74125-4 0  9993',
    line2: '2 27424  98.2014 245.1245 0001512  78.4512 281.6512 14.58124512154125',
  },
  {
    norad_id: 28376,
    name: 'AURA',
    line1: '1 28376U 04026A   24080.39512000  .00000192  00000+0  75412-4 0  9991',
    line2: '2 28376  98.1925 245.1412 0001489  78.3124 281.7915 14.58124508154126',
  },
  {
    norad_id: 39634,
    name: 'SENTINEL-1A',
    line1: '1 39634U 14016A   24080.31245000  .00000045  00000+0  21450-4 0  9997',
    line2: '2 39634  98.1812 112.4512 0001354  85.4512 274.6512 14.59124512451245',
  },
  {
    norad_id: 40697,
    name: 'SENTINEL-2A',
    line1: '1 40697U 15028A   24080.29145000  .00000085  00000+0  34125-4 0  9995',
    line2: '2 40697  98.5612  85.4512 0001145  74.5124 285.6214 14.31245124451245',
  },
  {
    norad_id: 42063,
    name: 'SENTINEL-2B',
    line1: '1 42063U 17013A   24080.28145000  .00000082  00000+0  33851-4 0  9998',
    line2: '2 42063  98.5615  85.4610 0001140  74.6812 285.4512 14.31245095451246',
  },
  {
    norad_id: 43689,
    name: 'METOP-C',
    line1: '1 43689U 18087A   24080.25145000  .00000035  00000+0  18451-4 0  9990',
    line2: '2 43689  98.7125 315.4512 0001512 112.4512 247.6512 14.21245124451245',
  },
  {
    norad_id: 39766,
    name: 'ALOS-2',
    line1: '1 39766U 14029A   24080.11512000  .00000125  00000+0  61245-4 0  9994',
    line2: '2 39766  97.9124 289.4512 0001245  92.4512 267.6512 14.71245124451245',
  },
];

// Helper to generate a realistic 3D orbital path around Earth
function generatePathArc(
  radius: number,
  inclinationDeg: number,
  raanDeg: number,
  centerTheta: number,
  steps = 80
): Waypoint[] {
  const inc = (inclinationDeg * Math.PI) / 180;
  const raan = (raanDeg * Math.PI) / 180;
  const path: Waypoint[] = [];
  const startTheta = centerTheta - Math.PI * 0.45;
  const endTheta = centerTheta + Math.PI * 0.45;
  const now = Date.now();

  for (let k = 0; k <= steps; k++) {
    const theta = startTheta + (k / steps) * (endTheta - startTheta);
    // Position in orbital plane
    const xOrb = radius * Math.cos(theta);
    const yOrb = radius * Math.sin(theta);

    // Rotate by inclination and RAAN to Three.js coordinates
    const xScene = xOrb * Math.cos(raan) - yOrb * Math.sin(raan) * Math.cos(inc);
    const yScene = yOrb * Math.sin(inc);
    const zScene = -(xOrb * Math.sin(raan) + yOrb * Math.cos(raan) * Math.cos(inc));

    const eciX = xScene * 6371.0;
    const eciZ = yScene * 6371.0;
    const eciY = -zScene * 6371.0;

    path.push({
      time: new Date(now + (k - steps / 2) * 45000).toISOString(),
      timestamp: (now + (k - steps / 2) * 45000) / 1000,
      eci: [eciX, eciY, eciZ],
      scene: [xScene, yScene, zScene],
    });
  }
  return path;
}

const scenario1Primary = generatePathArc(1.086, 53.05, 45.0, 1.25);
const scenario1Secondary = generatePathArc(1.086, 82.54, 115.0, 0.85);

const scenario2Primary = generatePathArc(1.065, 51.64, 120.0, 2.1);
const scenario2Secondary = generatePathArc(1.065, 98.65, 210.0, 1.4);

const scenario3Primary = generatePathArc(1.188, 87.41, 15.0, 0.6);
const scenario3Secondary = generatePathArc(1.188, 74.02, 280.0, 2.5);

export const FALLBACK_CONJUNCTIONS: ConjunctionEvent[] = [
  {
    conjunction_id: 'CNJ-DEMO-44713-49801',
    primary_id: 44713,
    primary_name: 'STARLINK-1007',
    primary_tle: FALLBACK_CATALOG[2],
    secondary_id: 49801,
    secondary_name: 'COSMOS 1408 DEBRIS',
    secondary_tle: FALLBACK_CATALOG[6],
    tca_utc: '2026-10-14T17:59:49.000Z',
    tca_timestamp: 1791991189,
    miss_distance_m: 184.2,
    relative_velocity_kms: 10.76,
    collision_probability: 4.34e-4,
    risk_level: 'CRITICAL',
    primary_position_eci: [4120.5, -1650.2, 5012.8],
    secondary_position_eci: [4120.6, -1650.3, 5012.7],
    primary_position_scene: scenario1Primary[Math.floor(scenario1Primary.length / 2)].scene,
    secondary_position_scene: scenario1Secondary[Math.floor(scenario1Secondary.length / 2)].scene,
    primary_path: scenario1Primary,
    secondary_path: scenario1Secondary,
  },
  {
    conjunction_id: 'CNJ-DEMO-25544-31254',
    primary_id: 25544,
    primary_name: 'ISS (ZARYA)',
    primary_tle: FALLBACK_CATALOG[0],
    secondary_id: 31254,
    secondary_name: 'FENGYUN 1C DEB',
    secondary_tle: FALLBACK_CATALOG[8],
    tca_utc: '2026-10-14T21:29:49.000Z',
    tca_timestamp: 1792003789,
    miss_distance_m: 820.5,
    relative_velocity_kms: 14.15,
    collision_probability: 2.15e-5,
    risk_level: 'CRITICAL',
    primary_position_eci: [-2510.4, 4820.1, 3910.6],
    secondary_position_eci: [-2510.9, 4820.5, 3910.1],
    primary_position_scene: scenario2Primary[Math.floor(scenario2Primary.length / 2)].scene,
    secondary_position_scene: scenario2Secondary[Math.floor(scenario2Secondary.length / 2)].scene,
    primary_path: scenario2Primary,
    secondary_path: scenario2Secondary,
  },
  {
    conjunction_id: 'CNJ-DEMO-45124-34125',
    primary_id: 45124,
    primary_name: 'ONEWEB-0125',
    primary_tle: FALLBACK_CATALOG[11],
    secondary_id: 34125,
    secondary_name: 'COSMOS 2251 DEB',
    secondary_tle: FALLBACK_CATALOG[7],
    tca_utc: '2026-10-15T01:47:49.000Z',
    tca_timestamp: 1792019269,
    miss_distance_m: 2410.0,
    relative_velocity_kms: 11.82,
    collision_probability: 8.7e-7,
    risk_level: 'WARNING',
    primary_position_eci: [1200.5, -6800.2, 2810.1],
    secondary_position_eci: [1201.8, -6798.5, 2808.9],
    primary_position_scene: scenario3Primary[Math.floor(scenario3Primary.length / 2)].scene,
    secondary_position_scene: scenario3Secondary[Math.floor(scenario3Secondary.length / 2)].scene,
    primary_path: scenario3Primary,
    secondary_path: scenario3Secondary,
  },
];
