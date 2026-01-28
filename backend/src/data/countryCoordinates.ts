export interface CountryInfo {
  code: string;
  name: string;
  lat: number;
  lng: number;
  nutsPrefix: string;
}

export const countryCoordinates: CountryInfo[] = [
  { code: 'DE', name: 'Germany', lat: 51.1657, lng: 10.4515, nutsPrefix: 'DE' },
  { code: 'FR', name: 'France', lat: 46.2276, lng: 2.2137, nutsPrefix: 'FR' },
  { code: 'IT', name: 'Italy', lat: 41.8719, lng: 12.5674, nutsPrefix: 'IT' },
  { code: 'ES', name: 'Spain', lat: 40.4637, lng: -3.7492, nutsPrefix: 'ES' },
  { code: 'NL', name: 'Netherlands', lat: 52.1326, lng: 5.2913, nutsPrefix: 'NL' },
  { code: 'BE', name: 'Belgium', lat: 50.5039, lng: 4.4699, nutsPrefix: 'BE' },
  { code: 'PL', name: 'Poland', lat: 51.9194, lng: 19.1451, nutsPrefix: 'PL' },
  { code: 'SE', name: 'Sweden', lat: 60.1282, lng: 18.6435, nutsPrefix: 'SE' },
  { code: 'AT', name: 'Austria', lat: 47.5162, lng: 14.5501, nutsPrefix: 'AT' },
  { code: 'PT', name: 'Portugal', lat: 39.3999, lng: -8.2245, nutsPrefix: 'PT' },
  { code: 'GR', name: 'Greece', lat: 39.0742, lng: 21.8243, nutsPrefix: 'EL' },
  { code: 'IE', name: 'Ireland', lat: 53.1424, lng: -7.6921, nutsPrefix: 'IE' },
  { code: 'CZ', name: 'Czech Republic', lat: 49.8175, lng: 15.4730, nutsPrefix: 'CZ' },
  { code: 'RO', name: 'Romania', lat: 45.9432, lng: 24.9668, nutsPrefix: 'RO' },
  { code: 'DK', name: 'Denmark', lat: 56.2639, lng: 9.5018, nutsPrefix: 'DK' },
  { code: 'FI', name: 'Finland', lat: 61.9241, lng: 25.7482, nutsPrefix: 'FI' },
  { code: 'HU', name: 'Hungary', lat: 47.1625, lng: 19.5033, nutsPrefix: 'HU' },
  { code: 'HR', name: 'Croatia', lat: 45.1, lng: 15.2, nutsPrefix: 'HR' },
  { code: 'BG', name: 'Bulgaria', lat: 42.7339, lng: 25.4858, nutsPrefix: 'BG' },
  { code: 'SK', name: 'Slovakia', lat: 48.6690, lng: 19.6990, nutsPrefix: 'SK' },
  { code: 'LT', name: 'Lithuania', lat: 55.1694, lng: 23.8813, nutsPrefix: 'LT' },
  { code: 'SI', name: 'Slovenia', lat: 46.1512, lng: 14.9955, nutsPrefix: 'SI' },
  { code: 'LV', name: 'Latvia', lat: 56.8796, lng: 24.6032, nutsPrefix: 'LV' },
  { code: 'EE', name: 'Estonia', lat: 58.5953, lng: 25.0136, nutsPrefix: 'EE' },
  { code: 'CY', name: 'Cyprus', lat: 35.1264, lng: 33.4299, nutsPrefix: 'CY' },
  { code: 'LU', name: 'Luxembourg', lat: 49.8153, lng: 6.1296, nutsPrefix: 'LU' },
  { code: 'MT', name: 'Malta', lat: 35.9375, lng: 14.3754, nutsPrefix: 'MT' },
  { code: 'NO', name: 'Norway', lat: 60.4720, lng: 8.4689, nutsPrefix: 'NO' },
  { code: 'IS', name: 'Iceland', lat: 64.9631, lng: -19.0208, nutsPrefix: 'IS' },
  { code: 'LI', name: 'Liechtenstein', lat: 47.1660, lng: 9.5554, nutsPrefix: 'LI' },
];

export interface CityInfo {
  name: string;
  countryCode: string;
  lat: number;
  lng: number;
  nuts: string;
  region: string;
}

export const cityData: CityInfo[] = [
  // Germany
  { name: 'Berlin', countryCode: 'DE', lat: 52.5200, lng: 13.4050, nuts: 'DE300', region: 'Berlin' },
  { name: 'Munich', countryCode: 'DE', lat: 48.1351, lng: 11.5820, nuts: 'DE212', region: 'Oberbayern' },
  { name: 'Hamburg', countryCode: 'DE', lat: 53.5511, lng: 9.9937, nuts: 'DE600', region: 'Hamburg' },
  { name: 'Frankfurt', countryCode: 'DE', lat: 50.1109, lng: 8.6821, nuts: 'DE712', region: 'Darmstadt' },
  { name: 'Cologne', countryCode: 'DE', lat: 50.9375, lng: 6.9603, nuts: 'DEA23', region: 'Koeln' },
  { name: 'Stuttgart', countryCode: 'DE', lat: 48.7758, lng: 9.1829, nuts: 'DE111', region: 'Stuttgart' },
  { name: 'Dusseldorf', countryCode: 'DE', lat: 51.2277, lng: 6.7735, nuts: 'DEA11', region: 'Duesseldorf' },
  { name: 'Leipzig', countryCode: 'DE', lat: 51.3397, lng: 12.3731, nuts: 'DED51', region: 'Leipzig' },

  // France
  { name: 'Paris', countryCode: 'FR', lat: 48.8566, lng: 2.3522, nuts: 'FR101', region: 'Ile-de-France' },
  { name: 'Lyon', countryCode: 'FR', lat: 45.7640, lng: 4.8357, nuts: 'FRK26', region: 'Rhone' },
  { name: 'Marseille', countryCode: 'FR', lat: 43.2965, lng: 5.3698, nuts: 'FRL04', region: 'Bouches-du-Rhone' },
  { name: 'Toulouse', countryCode: 'FR', lat: 43.6047, lng: 1.4442, nuts: 'FRJ23', region: 'Haute-Garonne' },
  { name: 'Bordeaux', countryCode: 'FR', lat: 44.8378, lng: -0.5792, nuts: 'FRI13', region: 'Gironde' },
  { name: 'Lille', countryCode: 'FR', lat: 50.6292, lng: 3.0573, nuts: 'FRE11', region: 'Nord' },
  { name: 'Strasbourg', countryCode: 'FR', lat: 48.5734, lng: 7.7521, nuts: 'FRF11', region: 'Bas-Rhin' },
  { name: 'Nantes', countryCode: 'FR', lat: 47.2184, lng: -1.5536, nuts: 'FRG01', region: 'Loire-Atlantique' },

  // Italy
  { name: 'Rome', countryCode: 'IT', lat: 41.9028, lng: 12.4964, nuts: 'ITI43', region: 'Lazio' },
  { name: 'Milan', countryCode: 'IT', lat: 45.4642, lng: 9.1900, nuts: 'ITC4C', region: 'Lombardia' },
  { name: 'Naples', countryCode: 'IT', lat: 40.8518, lng: 14.2681, nuts: 'ITF33', region: 'Campania' },
  { name: 'Turin', countryCode: 'IT', lat: 45.0703, lng: 7.6869, nuts: 'ITC11', region: 'Piemonte' },
  { name: 'Florence', countryCode: 'IT', lat: 43.7696, lng: 11.2558, nuts: 'ITI14', region: 'Toscana' },
  { name: 'Bologna', countryCode: 'IT', lat: 44.4949, lng: 11.3426, nuts: 'ITH55', region: 'Emilia-Romagna' },
  { name: 'Venice', countryCode: 'IT', lat: 45.4408, lng: 12.3155, nuts: 'ITH35', region: 'Veneto' },

  // Spain
  { name: 'Madrid', countryCode: 'ES', lat: 40.4168, lng: -3.7038, nuts: 'ES300', region: 'Comunidad de Madrid' },
  { name: 'Barcelona', countryCode: 'ES', lat: 41.3874, lng: 2.1686, nuts: 'ES511', region: 'Cataluna' },
  { name: 'Valencia', countryCode: 'ES', lat: 39.4699, lng: -0.3763, nuts: 'ES523', region: 'Comunitat Valenciana' },
  { name: 'Seville', countryCode: 'ES', lat: 37.3891, lng: -5.9845, nuts: 'ES618', region: 'Andalucia' },
  { name: 'Bilbao', countryCode: 'ES', lat: 43.2630, lng: -2.9350, nuts: 'ES213', region: 'Pais Vasco' },
  { name: 'Malaga', countryCode: 'ES', lat: 36.7213, lng: -4.4217, nuts: 'ES617', region: 'Andalucia' },
  { name: 'Zaragoza', countryCode: 'ES', lat: 41.6488, lng: -0.8891, nuts: 'ES243', region: 'Aragon' },

  // Netherlands
  { name: 'Amsterdam', countryCode: 'NL', lat: 52.3676, lng: 4.9041, nuts: 'NL329', region: 'Noord-Holland' },
  { name: 'Rotterdam', countryCode: 'NL', lat: 51.9244, lng: 4.4777, nuts: 'NL33C', region: 'Zuid-Holland' },
  { name: 'The Hague', countryCode: 'NL', lat: 52.0705, lng: 4.3007, nuts: 'NL332', region: 'Zuid-Holland' },
  { name: 'Utrecht', countryCode: 'NL', lat: 52.0907, lng: 5.1214, nuts: 'NL310', region: 'Utrecht' },
  { name: 'Eindhoven', countryCode: 'NL', lat: 51.4416, lng: 5.4697, nuts: 'NL414', region: 'Noord-Brabant' },

  // Belgium
  { name: 'Brussels', countryCode: 'BE', lat: 50.8503, lng: 4.3517, nuts: 'BE100', region: 'Brussels' },
  { name: 'Antwerp', countryCode: 'BE', lat: 51.2194, lng: 4.4025, nuts: 'BE211', region: 'Antwerpen' },
  { name: 'Ghent', countryCode: 'BE', lat: 51.0543, lng: 3.7174, nuts: 'BE234', region: 'Oost-Vlaanderen' },
  { name: 'Liege', countryCode: 'BE', lat: 50.6326, lng: 5.5797, nuts: 'BE332', region: 'Liege' },

  // Poland
  { name: 'Warsaw', countryCode: 'PL', lat: 52.2297, lng: 21.0122, nuts: 'PL911', region: 'Warszawski stoleczny' },
  { name: 'Krakow', countryCode: 'PL', lat: 50.0647, lng: 19.9450, nuts: 'PL213', region: 'Miasto Krakow' },
  { name: 'Wroclaw', countryCode: 'PL', lat: 51.1079, lng: 17.0385, nuts: 'PL514', region: 'Miasto Wroclaw' },
  { name: 'Gdansk', countryCode: 'PL', lat: 54.3520, lng: 18.6466, nuts: 'PL634', region: 'Gdanski' },
  { name: 'Poznan', countryCode: 'PL', lat: 52.4064, lng: 16.9252, nuts: 'PL415', region: 'Miasto Poznan' },
  { name: 'Lodz', countryCode: 'PL', lat: 51.7592, lng: 19.4560, nuts: 'PL711', region: 'Miasto Lodz' },

  // Sweden
  { name: 'Stockholm', countryCode: 'SE', lat: 59.3293, lng: 18.0686, nuts: 'SE110', region: 'Stockholms lan' },
  { name: 'Gothenburg', countryCode: 'SE', lat: 57.7089, lng: 11.9746, nuts: 'SE232', region: 'Vastra Gotalands lan' },
  { name: 'Malmo', countryCode: 'SE', lat: 55.6050, lng: 13.0038, nuts: 'SE224', region: 'Skane lan' },

  // Austria
  { name: 'Vienna', countryCode: 'AT', lat: 48.2082, lng: 16.3738, nuts: 'AT130', region: 'Wien' },
  { name: 'Graz', countryCode: 'AT', lat: 47.0707, lng: 15.4395, nuts: 'AT221', region: 'Graz' },
  { name: 'Linz', countryCode: 'AT', lat: 48.3069, lng: 14.2858, nuts: 'AT312', region: 'Linz-Wels' },
  { name: 'Salzburg', countryCode: 'AT', lat: 47.8095, lng: 13.0550, nuts: 'AT323', region: 'Salzburg und Umgebung' },
  { name: 'Innsbruck', countryCode: 'AT', lat: 47.2692, lng: 11.4041, nuts: 'AT332', region: 'Innsbruck' },

  // Portugal
  { name: 'Lisbon', countryCode: 'PT', lat: 38.7223, lng: -9.1393, nuts: 'PT170', region: 'Area Metropolitana de Lisboa' },
  { name: 'Porto', countryCode: 'PT', lat: 41.1579, lng: -8.6291, nuts: 'PT114', region: 'Area Metropolitana do Porto' },
  { name: 'Braga', countryCode: 'PT', lat: 41.5518, lng: -8.4229, nuts: 'PT112', region: 'Cavado' },

  // Greece
  { name: 'Athens', countryCode: 'GR', lat: 37.9838, lng: 23.7275, nuts: 'EL303', region: 'Attiki' },
  { name: 'Thessaloniki', countryCode: 'GR', lat: 40.6401, lng: 22.9444, nuts: 'EL522', region: 'Kentriki Makedonia' },
  { name: 'Patras', countryCode: 'GR', lat: 38.2466, lng: 21.7346, nuts: 'EL632', region: 'Dytiki Ellada' },

  // Ireland
  { name: 'Dublin', countryCode: 'IE', lat: 53.3498, lng: -6.2603, nuts: 'IE061', region: 'Dublin' },
  { name: 'Cork', countryCode: 'IE', lat: 51.8985, lng: -8.4756, nuts: 'IE025', region: 'South-West' },
  { name: 'Galway', countryCode: 'IE', lat: 53.2707, lng: -9.0568, nuts: 'IE013', region: 'West' },

  // Czech Republic
  { name: 'Prague', countryCode: 'CZ', lat: 50.0755, lng: 14.4378, nuts: 'CZ010', region: 'Praha' },
  { name: 'Brno', countryCode: 'CZ', lat: 49.1951, lng: 16.6068, nuts: 'CZ064', region: 'Jihomoravsky kraj' },
  { name: 'Ostrava', countryCode: 'CZ', lat: 49.8209, lng: 18.2625, nuts: 'CZ080', region: 'Moravskoslezsky kraj' },

  // Romania
  { name: 'Bucharest', countryCode: 'RO', lat: 44.4268, lng: 26.1025, nuts: 'RO321', region: 'Bucuresti' },
  { name: 'Cluj-Napoca', countryCode: 'RO', lat: 46.7712, lng: 23.6236, nuts: 'RO113', region: 'Cluj' },
  { name: 'Timisoara', countryCode: 'RO', lat: 45.7489, lng: 21.2087, nuts: 'RO424', region: 'Timis' },

  // Denmark
  { name: 'Copenhagen', countryCode: 'DK', lat: 55.6761, lng: 12.5683, nuts: 'DK011', region: 'Byen Kobenhavn' },
  { name: 'Aarhus', countryCode: 'DK', lat: 56.1629, lng: 10.2039, nuts: 'DK042', region: 'Ostjylland' },

  // Finland
  { name: 'Helsinki', countryCode: 'FI', lat: 60.1699, lng: 24.9384, nuts: 'FI1B1', region: 'Helsinki-Uusimaa' },
  { name: 'Tampere', countryCode: 'FI', lat: 61.4978, lng: 23.7610, nuts: 'FI197', region: 'Pirkanmaa' },
  { name: 'Turku', countryCode: 'FI', lat: 60.4518, lng: 22.2666, nuts: 'FI1C1', region: 'Varsinais-Suomi' },

  // Hungary
  { name: 'Budapest', countryCode: 'HU', lat: 47.4979, lng: 19.0402, nuts: 'HU110', region: 'Budapest' },
  { name: 'Debrecen', countryCode: 'HU', lat: 47.5316, lng: 21.6273, nuts: 'HU321', region: 'Hajdu-Bihar' },
  { name: 'Szeged', countryCode: 'HU', lat: 46.2530, lng: 20.1414, nuts: 'HU333', region: 'Csongrad-Csanad' },

  // Croatia
  { name: 'Zagreb', countryCode: 'HR', lat: 45.8150, lng: 15.9819, nuts: 'HR050', region: 'Grad Zagreb' },
  { name: 'Split', countryCode: 'HR', lat: 43.5081, lng: 16.4402, nuts: 'HR035', region: 'Splitsko-dalmatinska' },
  { name: 'Rijeka', countryCode: 'HR', lat: 45.3271, lng: 14.4422, nuts: 'HR031', region: 'Primorsko-goranska' },

  // Bulgaria
  { name: 'Sofia', countryCode: 'BG', lat: 42.6977, lng: 23.3219, nuts: 'BG411', region: 'Sofia (stolitsa)' },
  { name: 'Plovdiv', countryCode: 'BG', lat: 42.1354, lng: 24.7453, nuts: 'BG421', region: 'Plovdiv' },
  { name: 'Varna', countryCode: 'BG', lat: 43.2141, lng: 27.9147, nuts: 'BG331', region: 'Varna' },

  // Slovakia
  { name: 'Bratislava', countryCode: 'SK', lat: 48.1486, lng: 17.1077, nuts: 'SK010', region: 'Bratislavsky kraj' },
  { name: 'Kosice', countryCode: 'SK', lat: 48.7164, lng: 21.2611, nuts: 'SK042', region: 'Kosicky kraj' },
];

export function getCountryName(code: string): string {
  const country = countryCoordinates.find(c => c.code === code);
  return country ? country.name : code;
}

export function getCountryCenter(code: string): { lat: number; lng: number } | null {
  const country = countryCoordinates.find(c => c.code === code);
  return country ? { lat: country.lat, lng: country.lng } : null;
}
