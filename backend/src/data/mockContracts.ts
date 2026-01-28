import { cityData, getCountryName } from './countryCoordinates.js';

export interface Contract {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  publishDate: string;
  deadline: string;
  country: string;
  countryCode: string;
  nuts: string;
  region: string;
  city: string;
  lat: number;
  lng: number;
  buyerName: string;
  buyerType: string;
  contractorName: string;
  cpvCode: string;
  cpvDescription: string;
  procedureType: string;
  noticeType: string;
  tedNoticeId: string;
}

// CPV codes and descriptions
const cpvCategories = [
  { code: '45000000', description: 'Construction work', category: 'Construction' },
  { code: '45210000', description: 'Building construction work', category: 'Construction' },
  { code: '45233000', description: 'Construction, foundation and surface works for highways, roads', category: 'Construction' },
  { code: '45310000', description: 'Electrical installation work', category: 'Construction' },
  { code: '45400000', description: 'Building completion work', category: 'Construction' },
  { code: '45262000', description: 'Special trade construction work other than roof work', category: 'Construction' },
  { code: '71300000', description: 'Hydraulic engineering services', category: 'Construction' },
  { code: '72000000', description: 'IT services: consulting, software development, Internet and support', category: 'IT Services' },
  { code: '72200000', description: 'Software programming and consultancy services', category: 'IT Services' },
  { code: '72300000', description: 'Data services', category: 'IT Services' },
  { code: '72400000', description: 'Internet services', category: 'IT Services' },
  { code: '72500000', description: 'Computer-related services', category: 'IT Services' },
  { code: '48000000', description: 'Software package and information systems', category: 'IT Services' },
  { code: '33000000', description: 'Medical equipments, pharmaceuticals and personal care products', category: 'Medical Supplies' },
  { code: '33100000', description: 'Medical equipments', category: 'Medical Supplies' },
  { code: '33600000', description: 'Pharmaceutical products', category: 'Medical Supplies' },
  { code: '33190000', description: 'Miscellaneous medical devices and products', category: 'Medical Supplies' },
  { code: '33140000', description: 'Medical consumables', category: 'Medical Supplies' },
  { code: '60000000', description: 'Transport services (excl. Waste transport)', category: 'Transport' },
  { code: '60100000', description: 'Road transport services', category: 'Transport' },
  { code: '60200000', description: 'Rail transport services', category: 'Transport' },
  { code: '60400000', description: 'Air transport services', category: 'Transport' },
  { code: '34000000', description: 'Transport equipment and auxiliary products to transportation', category: 'Transport' },
  { code: '79000000', description: 'Business services: law, marketing, consulting, recruitment, printing and security', category: 'Consulting' },
  { code: '79400000', description: 'Business and management consultancy and related services', category: 'Consulting' },
  { code: '79200000', description: 'Accounting, auditing and fiscal services', category: 'Consulting' },
  { code: '79100000', description: 'Legal services', category: 'Consulting' },
  { code: '79300000', description: 'Market and economic research; polling and statistics', category: 'Consulting' },
  { code: '85000000', description: 'Health and social work services', category: 'Health Services' },
  { code: '85100000', description: 'Health services', category: 'Health Services' },
  { code: '85300000', description: 'Social work and related services', category: 'Health Services' },
  { code: '90000000', description: 'Sewage, refuse, cleaning and environmental services', category: 'Environment' },
  { code: '90500000', description: 'Refuse and waste related services', category: 'Environment' },
  { code: '90700000', description: 'Environmental services', category: 'Environment' },
  { code: '90900000', description: 'Cleaning and sanitation services', category: 'Environment' },
  { code: '39000000', description: 'Furniture, furnishings, domestic appliances and cleaning products', category: 'Furniture & Equipment' },
  { code: '30000000', description: 'Office and computing machinery, equipment and supplies', category: 'Office Supplies' },
  { code: '30200000', description: 'Computer equipment and supplies', category: 'Office Supplies' },
  { code: '09000000', description: 'Petroleum products, fuel, electricity and other sources of energy', category: 'Energy' },
  { code: '09300000', description: 'Electricity, heating, solar and nuclear energy', category: 'Energy' },
  { code: '09310000', description: 'Electricity', category: 'Energy' },
  { code: '71000000', description: 'Architectural, construction, engineering and inspection services', category: 'Engineering' },
  { code: '71200000', description: 'Architectural and related services', category: 'Engineering' },
  { code: '71300000', description: 'Engineering services', category: 'Engineering' },
  { code: '71500000', description: 'Construction-related services', category: 'Engineering' },
  { code: '50000000', description: 'Repair and maintenance services', category: 'Maintenance' },
  { code: '50500000', description: 'Repair and maintenance services of pumps, valves, taps, metal containers and machinery', category: 'Maintenance' },
  { code: '50700000', description: 'Repair and maintenance services of building installations', category: 'Maintenance' },
  { code: '55000000', description: 'Hotel, restaurant and retail trade services', category: 'Hospitality' },
  { code: '80000000', description: 'Education and training services', category: 'Education' },
  { code: '80500000', description: 'Training services', category: 'Education' },
  { code: '80400000', description: 'Adult and other education services', category: 'Education' },
  { code: '66000000', description: 'Financial and insurance services', category: 'Financial Services' },
  { code: '66500000', description: 'Insurance and pension services', category: 'Financial Services' },
  { code: '66100000', description: 'Banking and investment services', category: 'Financial Services' },
  { code: '38000000', description: 'Laboratory, optical and precision equipments', category: 'Research Equipment' },
  { code: '73000000', description: 'Research and development services and related consultancy services', category: 'Research Equipment' },
];

// Buyer name templates per country
const buyerTemplates: Record<string, string[]> = {
  DE: [
    'Bundesministerium fuer Verkehr und digitale Infrastruktur',
    'Stadt {city} - Vergabestelle',
    'Landeshauptstadt {city}',
    'Universitaetsklinikum {city}',
    'Bundesanstalt fuer Immobilienaufgaben',
    'Deutsche Bahn AG',
    'Bezirksregierung {city}',
    '{city} Stadtwerke GmbH',
  ],
  FR: [
    'Ville de {city}',
    'Ministere de la Transition ecologique',
    'Centre Hospitalier Universitaire de {city}',
    'Region Ile-de-France',
    'Metropole de {city}',
    'Agence Regionale de Sante',
    'Direction Generale des Finances Publiques',
    'SNCF Reseau',
  ],
  IT: [
    'Comune di {city}',
    'Ministero delle Infrastrutture e dei Trasporti',
    'Azienda Sanitaria Locale di {city}',
    'Universita degli Studi di {city}',
    'Regione Lazio',
    'Provincia di {city}',
    'ANAS S.p.A.',
    'Agenzia delle Entrate',
  ],
  ES: [
    'Ayuntamiento de {city}',
    'Ministerio de Transportes, Movilidad y Agenda Urbana',
    'Comunidad de Madrid',
    'Hospital Universitario de {city}',
    'Diputacion Provincial de {city}',
    'Gobierno de Espana',
    'Red Nacional de Ferrocarriles Espanoles',
    'Instituto Nacional de la Seguridad Social',
  ],
  NL: [
    'Gemeente {city}',
    'Rijkswaterstaat',
    'Ministerie van Infrastructuur en Waterstaat',
    'Universiteit {city}',
    'ProRail B.V.',
    'Rijksvastgoedbedrijf',
    'Dienst Uitvoering Onderwijs',
    'Erasmus MC',
  ],
  BE: [
    'Ville de {city}',
    'Service Public Federal Finances',
    'Societe des Transports Intercommunaux de Bruxelles',
    'SPF Mobilite et Transports',
    'Universite Libre de Bruxelles',
    'Vlaamse Overheid',
    'Centre Hospitalier Universitaire de {city}',
    'Stad {city}',
  ],
  PL: [
    'Urzad Miasta {city}',
    'Generalna Dyrekcja Drog Krajowych i Autostrad',
    'Szpital Kliniczny w {city}',
    'Ministerstwo Infrastruktury',
    'Uniwersytet {city}',
    'PKP Polskie Linie Kolejowe S.A.',
    'Urzad Marszalkowski',
    'Centrum Informatyczne Edukacji',
  ],
  SE: [
    '{city} kommun',
    'Trafikverket',
    'Stockholms lans landsting',
    'Karolinska Universitetssjukhuset',
    'Naturvardsverket',
    'Rikspolisstyrelsen',
    'Fortifikationsverket',
    'Statens fastighetsverk',
  ],
  AT: [
    'Stadt {city}',
    'Bundesministerium fuer Klimaschutz',
    'Wiener Linien GmbH & Co KG',
    'OBB-Infrastruktur AG',
    'Medizinische Universitaet {city}',
    'Land Oberoesterreich',
    'Bundesimmobiliengesellschaft m.b.H.',
    'ASFINAG',
  ],
  PT: [
    'Camara Municipal de {city}',
    'Infraestruturas de Portugal S.A.',
    'Hospital de Santa Maria',
    'Universidade de {city}',
    'Autoridade Nacional de Comunicacoes',
    'Ministerio da Saude',
    'Metro de {city}',
    'Direccao-Geral da Saude',
  ],
  GR: [
    'Dimos {city}',
    'Ministry of Infrastructure and Transport',
    'General Hospital of {city}',
    'National and Kapodistrian University of Athens',
    'Hellenic Railways Organisation',
    'Ministry of Health',
    'Public Power Corporation',
    'Ministry of Digital Governance',
  ],
  IE: [
    '{city} City Council',
    'Health Service Executive',
    'Transport Infrastructure Ireland',
    'Office of Public Works',
    'University College {city}',
    'Department of Housing',
    'National Transport Authority',
    'Irish Water',
  ],
  CZ: [
    'Mesto {city}',
    'Reditelstvi silnic a dalnic CR',
    'Nemocnice {city}',
    'Ministerstvo dopravy',
    'Ceska posta s.p.',
    'Sprava zeleznic',
    'Univerzita Karlova',
    'Ministerstvo pro mistni rozvoj',
  ],
  RO: [
    'Primaria Municipiului {city}',
    'Compania Nationala de Administrare a Infrastructurii Rutiere',
    'Spitalul Universitar de Urgenta {city}',
    'Ministerul Transporturilor',
    'Universitatea din {city}',
    'Metrorex S.A.',
    'Administratia Nationala Apele Romane',
    'Ministerul Sanatatii',
  ],
  DK: [
    '{city} Kommune',
    'Vejdirektoratet',
    'Rigshospitalet',
    'Koebenhavns Universitet',
    'Banedanmark',
    'Energistyrelsen',
    'Bygningsstyrelsen',
    'Region Hovedstaden',
  ],
  FI: [
    '{city} kaupunki',
    'Vayla - Finnish Transport Infrastructure Agency',
    'Helsinki University Hospital',
    'University of {city}',
    'Finnish Transport and Communications Agency',
    'Senate Properties',
    'Finnish Defence Forces',
    'Ministry of Social Affairs and Health',
  ],
  HU: [
    '{city} Fovaros Onkormanyzata',
    'NIF Nemzeti Infrastruktura Fejleszto Zrt.',
    'Semmelweis Egyetem',
    'Magyar Allamvasutak Zrt.',
    'Nemzeti Egeszsegbiztositasi Alapkezelo',
    'Budapesti Kozlekedesi Kozpont Zrt.',
    'Nemzeti Kommunikacios Hivatal',
    'Kozlekedesi Miniszterium',
  ],
  HR: [
    'Grad {city}',
    'Hrvatske ceste d.o.o.',
    'Klinicki bolnicki centar {city}',
    'HZ Infrastruktura d.o.o.',
    'Sveuciliste u {city}',
    'Ministarstvo mora, prometa i infrastrukture',
    'Fond za zastitu okolisa i energetsku ucinkovitost',
    'Ministarstvo zdravstva',
  ],
  BG: [
    'Stolichna obshtina',
    'Agenciya Patna infrastruktura',
    'Ministerstvo na transporta',
    'Natsionalna zdravnoosiguritelna kasa',
    'Sofiyski universitet Sv. Kliment Ohridski',
    'Nacionalna kompaniya Zhelezopatna infrastruktura',
    'Ministerstvo na zdraveopazvaneto',
    'Obshtina {city}',
  ],
  SK: [
    'Mesto {city}',
    'Narodna dialnicna spolocnost a.s.',
    'Univerzitna nemocnica {city}',
    'Zeleznice Slovenskej republiky',
    'Ministerstvo dopravy SR',
    'Slovenska technicka univerzita v {city}',
    'Urad pre verejne obstaravanie',
    'Ministerstvo zdravotnictva SR',
  ],
};

// Contractor name templates
const contractorNames = [
  // Construction
  'STRABAG SE',
  'VINCI Construction',
  'Bouygues Construction',
  'Hochtief AG',
  'Skanska AB',
  'Royal BAM Group',
  'Ferrovial S.A.',
  'ACS Group',
  'Eiffage S.A.',
  'Porr AG',
  'Implenia AG',
  'Webuild S.p.A.',
  'Budimex S.A.',
  'COLAS SA',
  'Eurovia',
  'Bilfinger SE',
  'NCC AB',
  'Warbud S.A.',
  'Besix Group',
  'Acciona S.A.',
  // IT / Technology
  'SAP SE',
  'Atos SE',
  'Capgemini SE',
  'T-Systems International GmbH',
  'Sopra Steria Group',
  'CGI Group Inc.',
  'IBM Deutschland GmbH',
  'Accenture GmbH',
  'Deloitte Digital',
  'KPMG IT Service GmbH',
  'Reply S.p.A.',
  'Engineering Ingegneria Informatica S.p.A.',
  'Computacenter AG',
  'Indra Sistemas S.A.',
  'Amadeus IT Group',
  'Eviden (Atos)',
  'Tieto Finland Oy',
  'Asseco Poland S.A.',
  'TietoEVRY Oyj',
  'Comarch S.A.',
  // Medical / Pharma
  'Siemens Healthineers AG',
  'Philips Healthcare',
  'GE Healthcare GmbH',
  'Roche Diagnostics GmbH',
  'B. Braun Melsungen AG',
  'Fresenius Medical Care AG',
  'Medtronic B.V.',
  'Baxter International Inc.',
  'Carl Zeiss Meditec AG',
  'Smith & Nephew plc',
  'Draeger Medical GmbH',
  'Getinge AB',
  'Becton Dickinson GmbH',
  'Olympus Europa SE',
  'Coloplast A/S',
  // Transport
  'DB Schenker',
  'DHL International GmbH',
  'Geodis SA',
  'Kuehne + Nagel International AG',
  'DSV A/S',
  'Bolloré Logistics',
  'Dachser SE',
  'Hellmann Worldwide Logistics',
  'XPO Logistics',
  'Rhenus Logistics',
  // Consulting / Professional Services
  'McKinsey & Company',
  'Boston Consulting Group',
  'PricewaterhouseCoopers',
  'Ernst & Young GmbH',
  'Roland Berger GmbH',
  'Bain & Company',
  'Deloitte Consulting',
  'KPMG Advisory',
  'BearingPoint GmbH',
  'Oliver Wyman GmbH',
  // Energy / Environment
  'Veolia Environnement SA',
  'SUEZ Groupe SAS',
  'Enel Green Power S.p.A.',
  'Orsted A/S',
  'Vattenfall AB',
  'Engie SA',
  'E.ON SE',
  'Iberdrola S.A.',
  'EDP Renovaveis SA',
  'Fortum Oyj',
  // Engineering
  'WSP Group plc',
  'Ramboll Group A/S',
  'Arcadis N.V.',
  'AFRY AB',
  'Sweco AB',
  'Royal HaskoningDHV',
  'Egis Group SA',
  'IDOM Consulting',
  'Multiconsult ASA',
  'Mott MacDonald',
  // Equipment / Office
  'Steelcase Inc.',
  'Kinnarps AB',
  'Bene GmbH',
  'Dell Technologies',
  'HP Inc.',
  'Lenovo',
  'Canon Europe Ltd.',
  'Ricoh Europe PLC',
  'Konica Minolta',
  'Xerox',
];

const procedureTypes = [
  'Open procedure',
  'Restricted procedure',
  'Competitive procedure with negotiation',
  'Competitive dialogue',
  'Innovation partnership',
  'Negotiated procedure without prior publication',
];

const noticeTypes = [
  'Contract notice',
  'Contract award notice',
  'Prior information notice',
  'Voluntary ex ante transparency notice',
  'Design contest notice',
  'Corrigendum',
];

const buyerTypes = [
  'Ministry or any other national or federal authority',
  'Regional or local authority',
  'Body governed by public law',
  'European institution/agency or international organisation',
  'Utilities entity',
  'Other',
];

// Title templates by category
const titleTemplates: Record<string, string[]> = {
  Construction: [
    'Reconstruction of {road} highway section near {city}',
    'Construction of new school building in {city}',
    'Renovation of municipal office building in {city}',
    'Bridge construction on {road} motorway',
    'Urban regeneration project in {city} city center',
    'Construction of water treatment facility in {city}',
    'Building of new sports complex in {city}',
    'Housing development project in {city} district',
    'Construction of public parking facility in {city}',
    'Railway station modernization in {city}',
  ],
  'IT Services': [
    'Digital transformation of public administration in {city}',
    'Enterprise resource planning system implementation',
    'Cybersecurity infrastructure upgrade for {city} government',
    'Cloud migration services for {ministry}',
    'Development of citizen portal for {city}',
    'IT infrastructure modernization for {ministry}',
    'Data center consolidation project',
    'E-government services platform development',
    'Digital health records system implementation',
    'Smart city IoT platform for {city}',
  ],
  'Medical Supplies': [
    'Supply of medical imaging equipment for {city} hospital',
    'Pharmaceutical products procurement for regional hospitals',
    'Laboratory equipment for {city} university medical center',
    'Medical consumables framework agreement',
    'Diagnostic equipment for {city} clinical center',
    'Patient monitoring systems for {city} hospital',
    'Surgical instruments procurement',
    'Vaccine cold chain equipment supply',
    'Rehabilitation equipment for {city} medical center',
    'Personal protective equipment supply',
  ],
  Transport: [
    'Public bus fleet renewal for {city} transit authority',
    'Rail freight transport services for {ministry}',
    'Urban mobility services in {city} metropolitan area',
    'Electric vehicle fleet procurement for {city}',
    'Airport shuttle service contract for {city}',
    'Logistics and distribution services',
    'School transport services in {city} region',
    'Emergency ambulance transport services',
    'Maritime cargo transport services',
    'Bicycle-sharing system for {city}',
  ],
  Consulting: [
    'Strategic advisory services for {ministry}',
    'Financial audit services for {city} municipality',
    'Legal advisory for EU structural funds management',
    'Market research for urban development project',
    'Management consulting for organizational reform',
    'Environmental impact assessment for {city} project',
    'Public procurement advisory services',
    'Risk assessment and compliance consulting',
    'Human resources consulting for {ministry}',
    'Economic feasibility study for {city} infrastructure',
  ],
  'Health Services': [
    'Home care services in {city} municipality',
    'Mental health services for {city} region',
    'Occupational health services for {ministry}',
    'Public health screening programme in {city}',
    'Elderly care services in {city} area',
    'Community nursing services',
    'Addiction treatment services',
    'Physiotherapy services for {city} hospital',
  ],
  Environment: [
    'Municipal waste collection services in {city}',
    'Water purification plant operation in {city}',
    'Urban green space maintenance in {city}',
    'Hazardous waste disposal services',
    'Air quality monitoring system for {city}',
    'Renewable energy installation for public buildings',
    'Wastewater treatment upgrade in {city}',
    'Recycling program implementation in {city}',
  ],
  'Furniture & Equipment': [
    'Office furniture supply for {ministry}',
    'School furniture and equipment for {city}',
    'Laboratory furnishing for {city} university',
    'Hospital furniture procurement',
  ],
  'Office Supplies': [
    'Computer equipment procurement for {ministry}',
    'Printing and copying equipment framework agreement',
    'Office supplies for {city} public administration',
    'Network equipment upgrade for {ministry}',
  ],
  Energy: [
    'Electricity supply contract for {city} public buildings',
    'Solar panel installation on government buildings',
    'District heating network extension in {city}',
    'Green energy procurement for {ministry}',
    'Energy efficiency retrofit programme',
  ],
  Engineering: [
    'Engineering design services for {city} bridge project',
    'Architectural services for new {city} cultural center',
    'Structural engineering for {city} metro extension',
    'Technical supervision of construction works in {city}',
    'Urban planning consultancy for {city}',
  ],
  Maintenance: [
    'Building maintenance services for {ministry}',
    'Road maintenance contract for {city} region',
    'HVAC maintenance for public buildings in {city}',
    'Elevator maintenance and repair services',
    'Fleet maintenance services for {city}',
  ],
  Hospitality: [
    'Catering services for {ministry}',
    'Event management services for EU presidency',
    'Conference facility services in {city}',
    'Staff canteen operation for {ministry}',
  ],
  Education: [
    'Professional training programme for civil servants',
    'Language training services for {ministry}',
    'Digital skills training for {city} employees',
    'Vocational education programme development',
  ],
  'Financial Services': [
    'Banking services for {city} municipality',
    'Insurance coverage for {ministry}',
    'Pension fund management services',
    'Financial advisory for bond issuance',
  ],
  'Research Equipment': [
    'Scientific research equipment for {city} university',
    'R&D services for smart grid technology',
    'Research partnership for environmental monitoring',
    'Laboratory instruments for national research institute',
  ],
};

const roads = ['E40', 'E45', 'E30', 'E15', 'E20', 'A1', 'A2', 'A4', 'A6', 'A8', 'M1', 'M3', 'M5', 'N1', 'N2'];

// Seeded pseudo-random number generator for consistent data
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateContracts(): Contract[] {
  const random = seededRandom(42);
  const contracts: Contract[] = [];

  // Ensure coverage across countries by distributing contracts
  const citiesByCountry = new Map<string, typeof cityData>();
  for (const city of cityData) {
    if (!citiesByCountry.has(city.countryCode)) {
      citiesByCountry.set(city.countryCode, []);
    }
    citiesByCountry.get(city.countryCode)!.push(city);
  }

  // Target countries with distribution weights
  const countryWeights: Record<string, number> = {
    DE: 22, FR: 20, IT: 18, ES: 16, NL: 12, BE: 10, PL: 14,
    SE: 8, AT: 10, PT: 8, GR: 8, IE: 8, CZ: 8, RO: 8,
    DK: 6, FI: 6, HU: 6, HR: 5, BG: 5, SK: 5,
  };

  let contractIndex = 0;

  for (const [countryCode, weight] of Object.entries(countryWeights)) {
    const cities = citiesByCountry.get(countryCode) || [];
    if (cities.length === 0) continue;

    const buyers = buyerTemplates[countryCode] || buyerTemplates['DE'];

    for (let i = 0; i < weight; i++) {
      const city = cities[Math.floor(random() * cities.length)];
      const cpv = cpvCategories[Math.floor(random() * cpvCategories.length)];
      const category = cpv.category;
      const templates = titleTemplates[category] || titleTemplates['Construction'];
      const titleTemplate = templates[Math.floor(random() * templates.length)];
      const road = roads[Math.floor(random() * roads.length)];
      const buyerTemplate = buyers[Math.floor(random() * buyers.length)];
      const contractor = contractorNames[Math.floor(random() * contractorNames.length)];
      const procedureType = procedureTypes[Math.floor(random() * procedureTypes.length)];
      const noticeType = noticeTypes[Math.floor(random() * noticeTypes.length)];
      const buyerType = buyerTypes[Math.floor(random() * buyerTypes.length)];

      // Generate amount with realistic distribution (many small, few large)
      let amount: number;
      const r = random();
      if (r < 0.3) {
        amount = 10000 + random() * 240000; // 10K - 250K (30%)
      } else if (r < 0.55) {
        amount = 250000 + random() * 750000; // 250K - 1M (25%)
      } else if (r < 0.75) {
        amount = 1000000 + random() * 4000000; // 1M - 5M (20%)
      } else if (r < 0.9) {
        amount = 5000000 + random() * 10000000; // 5M - 15M (15%)
      } else {
        amount = 15000000 + random() * 35000000; // 15M - 50M (10%)
      }
      amount = Math.round(amount * 100) / 100;

      // Generate dates in 2024-2025 range
      const publishYear = random() < 0.45 ? 2024 : 2025;
      const publishMonth = Math.floor(random() * 12) + 1;
      const publishDay = Math.floor(random() * 28) + 1;
      const publishDate = `${publishYear}-${String(publishMonth).padStart(2, '0')}-${String(publishDay).padStart(2, '0')}`;

      // Deadline is 30-180 days after publish date
      const pubDate = new Date(publishYear, publishMonth - 1, publishDay);
      const daysToDeadline = 30 + Math.floor(random() * 150);
      const deadlineDate = new Date(pubDate.getTime() + daysToDeadline * 24 * 60 * 60 * 1000);
      const deadline = `${deadlineDate.getFullYear()}-${String(deadlineDate.getMonth() + 1).padStart(2, '0')}-${String(deadlineDate.getDate()).padStart(2, '0')}`;

      // Format title
      const title = titleTemplate
        .replace('{city}', city.name)
        .replace('{road}', road)
        .replace('{ministry}', buyerTemplate.replace('{city}', city.name));

      // Format buyer name
      const buyerName = buyerTemplate.replace('{city}', city.name);

      // Generate description
      const description = `${title}. This procurement covers ${cpv.description.toLowerCase()} for the ${getCountryName(countryCode)} public sector. The contract involves services and deliverables in the ${city.region} region.`;

      // Generate TED notice ID
      const tedNoticeId = `${publishYear}/${String(100000 + contractIndex).slice(1)}-${String(100000 + Math.floor(random() * 900000)).slice(1)}`;

      // Add slight variation to lat/lng so they don't all overlap
      const latOffset = (random() - 0.5) * 0.1;
      const lngOffset = (random() - 0.5) * 0.1;

      contracts.push({
        id: `EU-${publishYear}-${String(contractIndex + 1).padStart(5, '0')}`,
        title,
        description,
        amount,
        currency: 'EUR',
        publishDate,
        deadline,
        country: getCountryName(countryCode),
        countryCode,
        nuts: city.nuts,
        region: city.region,
        city: city.name,
        lat: Math.round((city.lat + latOffset) * 10000) / 10000,
        lng: Math.round((city.lng + lngOffset) * 10000) / 10000,
        buyerName,
        buyerType,
        contractorName: contractor,
        cpvCode: cpv.code,
        cpvDescription: cpv.description,
        procedureType,
        noticeType,
        tedNoticeId,
      });

      contractIndex++;
    }
  }

  // Shuffle contracts for more realistic ordering
  for (let i = contracts.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [contracts[i], contracts[j]] = [contracts[j], contracts[i]];
  }

  return contracts;
}

export const mockContracts: Contract[] = generateContracts();
