import { CONF_LOGO_LINKS } from './data.js?v=20261123152720';

// Every AAU member school, for the "AAU school" pick on the Add team form:
// abbreviation, mascot, colors, city and the conference it plays in in the
// owner's AAU Dynasty alignment. The 73 founding members (from AAU
// Basketball), the 7 that join for 2032-33 (`joins`, the owner's
// expansion, Nov. 2026) and the owner's next crop (`crop: 3`, Nov. 2026:
// Arkansas, Baylor, Houston, SMU, Texas Tech and UT Dallas listed in the
// Southwest Conference, Saint Louis and Memphis in the Greater South, and
// the WAC's eight: Northern Arizona, San Diego State, Nevada, UNLV, Oregon
// State, BYU, Utah State, Washington State; head coaches and home venues
// are added by hand) and the crop after it (`crop: 4`, Nov. 2026: the
// Rocky West Conference's eleven, the Horizon Valley Conference's ten and
// the Colonial 10's nine, plus Boston College, suggested for the Metro;
// listed in their conferences to be added when the owner wants them; ESPN
// logos, home venues for the sports each one plays).
// Schools that leave the AAU (McGill and Toronto after 2031-32) stay
// listed so they can be added back. The home venue and ratings are the
// sport's own, so they're not here.
export const AAU_SCHOOLS = {
  "Arizona": { abbr: "ARIZ", mascot: "Wildcats", color: '#0C234B', altColor: '#AB0520', city: "Tucson, Ariz.", conference: "Pacific-10 Conference" },
  "Arizona State": { abbr: "ASU", mascot: "Sun Devils", color: '#8C1D40', altColor: '#FFC627', city: "Tempe, Ariz.", conference: "Pacific-10 Conference" },
  "Arkansas": { abbr: "ARK", mascot: "Razorbacks", color: '#9D2235', altColor: '#FFFFFF', city: "Fayetteville, Ark.", conference: "Southwest Conference", crop: 3 },
  "Baylor": { abbr: "BAY", mascot: "Bears", color: '#154734', altColor: '#FFB81C', city: "Waco, Texas", conference: "Southwest Conference", crop: 3 },
  "Boston College": { abbr: "BC", mascot: "Eagles", color: '#98002E', altColor: '#BC9B6A', city: "Chestnut Hill, Mass.", conference: "Metro Conference", crop: 4 },
  "Boston University": { abbr: "BU", mascot: "Terriers", color: '#CC0000', altColor: '#FFFFFF', city: "Boston, Mass.", conference: "Metro Conference" },
  "Brandeis": { abbr: "BRAN", mascot: "Judges", color: '#003478', altColor: '#FFFFFF', city: "Waltham, Mass.", conference: "University Athletic Association" },
  "Brown": { abbr: "BRWN", mascot: "Bears", color: '#4E3629', altColor: '#C00404', city: "Providence, R.I.", conference: "Ivy League" },
  "Buffalo": { abbr: "BUFF", mascot: "Bulls", color: '#005BBB', altColor: '#FFFFFF', city: "Amherst, N.Y.", conference: "Metro Conference" },
  "BYU": { abbr: "BYU", mascot: "Cougars", color: '#002E5D', altColor: '#FFFFFF', city: "Provo, Utah", conference: "Western Athletic Conference", crop: 3 },
  "California": { abbr: "CAL", mascot: "Golden Bears", color: '#003262', altColor: '#FDB515', city: "Berkeley, Calif.", conference: "Pacific-10 Conference" },
  "Caltech": { abbr: "CIT", mascot: "Beavers", color: '#FF6C0C', altColor: '#333333', city: "Pasadena, Calif.", conference: "UC Athletic Association" },
  "Carnegie Mellon": { abbr: "CMU", mascot: "Tartans", color: '#C41230', altColor: '#6D6E71', city: "Pittsburgh, Pa.", conference: "University Athletic Association" },
  "Case Western": { abbr: "CWRU", mascot: "Spartans", color: '#0A304E', altColor: '#FFFFFF', city: "Cleveland, Ohio", conference: "University Athletic Association" },
  "Charlotte": { abbr: "CLT", mascot: "49ers", color: '#005035', altColor: '#A49665', city: "Charlotte, N.C.", conference: "Colonial 10", crop: 4 },
  "Chicago": { abbr: "UCHI", mascot: "Maroons", color: '#800000', altColor: '#FFFFFF', city: "Chicago, Ill.", conference: "University Athletic Association" },
  "Cincinnati": { abbr: "CIN", mascot: "Bearcats", color: '#E00122', altColor: '#000000', city: "Cincinnati, Ohio", conference: "Horizon Valley Conference", crop: 4 },
  "Colorado": { abbr: "COLO", mascot: "Buffaloes", color: '#000000', altColor: '#CFB87C', city: "Boulder, Colo.", conference: "Pacific-10 Conference" },
  "Colorado School of Mines": { abbr: "MINES", mascot: "Orediggers", color: '#21314D', altColor: '#92A2BD', city: "Golden, Colo.", conference: "Rocky West Conference", crop: 4 },
  "Colorado State": { abbr: "CSU", mascot: "Rams", color: '#1E4D2B', altColor: '#C8C372', city: "Fort Collins, Colo.", conference: "Rocky West Conference", crop: 4 },
  "Columbia": { abbr: "CLMB", mascot: "Lions", color: '#1D4F91', altColor: '#9BCBEB', city: "New York, N.Y.", conference: "Ivy League" },
  "Cornell": { abbr: "COR", mascot: "Big Red", color: '#B31B1B', altColor: '#FFFFFF', city: "Ithaca, N.Y.", conference: "Ivy League" },
  "Dartmouth": { abbr: "DART", mascot: "Big Green", color: '#00693E', altColor: '#FFFFFF', city: "Hanover, N.H.", conference: "Ivy League" },
  "Dayton": { abbr: "DAY", mascot: "Flyers", color: '#CE1141', altColor: '#004B8D', city: "Dayton, Ohio", conference: "Horizon Valley Conference", crop: 4 },
  "Denver": { abbr: "DEN", mascot: "Pioneers", color: '#8B2332', altColor: '#8B6F4E', city: "Denver, Colo.", conference: "Rocky West Conference", crop: 4 },
  "Duke": { abbr: "DUKE", mascot: "Blue Devils", color: '#00539B', altColor: '#FFFFFF', city: "Durham, N.C.", conference: "Coastal Atlantic Conference" },
  "East Carolina": { abbr: "ECU", mascot: "Pirates", color: '#592A8A', altColor: '#FDC82F', city: "Greenville, N.C.", conference: "Colonial 10", crop: 4 },
  "Emory": { abbr: "EMRY", mascot: "Eagles", color: '#012169', altColor: '#F2A900', city: "Atlanta, Ga.", conference: "University Athletic Association" },
  "Florida": { abbr: "FLA", mascot: "Gators", color: '#0021A5', altColor: '#FA4616', city: "Gainesville, Fla.", conference: "Coastal Atlantic Conference" },
  "Florida State": { abbr: "FSU", mascot: "Seminoles", color: '#782F40', altColor: '#CEB888', city: "Tallahassee, Fla.", conference: "Coastal Atlantic Conference", joins: 2032 },
  "George Mason": { abbr: "GMU", mascot: "Patriots", color: '#006633', altColor: '#FFCC33', city: "Fairfax, Va.", conference: "Colonial 10", crop: 4 },
  "George Washington": { abbr: "GW", mascot: "Revolutionaries", color: '#033C5A', altColor: '#AA9868', city: "Washington, D.C.", conference: "Metro Conference" },
  "Georgetown": { abbr: "GTWN", mascot: "Hoyas", color: '#041E42', altColor: '#63666A', city: "Washington, D.C.", conference: "Metro Conference" },
  "Georgia": { abbr: "UGA", mascot: "Bulldogs", color: '#BA0C2F', altColor: '#000000', city: "Athens, Ga.", conference: "Coastal Atlantic Conference", joins: 2032 },
  "Georgia Tech": { abbr: "GT", mascot: "Yellow Jackets", color: '#B3A369', altColor: '#003057', city: "Atlanta, Ga.", conference: "Coastal Atlantic Conference" },
  "Harvard": { abbr: "HARV", mascot: "Crimson", color: '#A51C30', altColor: '#1E1E1E', city: "Boston, Mass.", conference: "Ivy League" },
  "Houston": { abbr: "HOU", mascot: "Cougars", color: '#C8102E', altColor: '#FFFFFF', city: "Houston, Texas", conference: "Southwest Conference", crop: 3 },
  "Illinois": { abbr: "ILL", mascot: "Fighting Illini", color: '#13294B', altColor: '#E84A27', city: "Champaign, Ill.", conference: "Big Ten" },
  "Indiana": { abbr: "IND", mascot: "Hoosiers", color: '#990000', altColor: '#EEEDEB', city: "Bloomington, Ind.", conference: "Big Ten" },
  "Iowa": { abbr: "IOWA", mascot: "Hawkeyes", color: '#000000', altColor: '#FFCD00', city: "Iowa City, Iowa", conference: "Big Ten" },
  "Iowa State": { abbr: "ISU", mascot: "Cyclones", color: '#C8102E', altColor: '#F1BE48', city: "Ames, Iowa", conference: "Southwest Conference", joins: 2032 },
  "IU Indianapolis": { abbr: "IUI", mascot: "Jaguars", color: '#990000', altColor: '#FFC72C', city: "Indianapolis, Ind.", conference: "Horizon Valley Conference", crop: 4 },
  "Johns Hopkins": { abbr: "JHU", mascot: "Blue Jays", color: '#002D72', altColor: '#68ACE5', city: "Baltimore, Md.", conference: "University Athletic Association" },
  "Kansas": { abbr: "KU", mascot: "Jayhawks", color: '#0051BA', altColor: '#E8000D', city: "Lawrence, Kan.", conference: "Southwest Conference" },
  "Lehigh": { abbr: "LEH", mascot: "Mountain Hawks", color: '#653600', altColor: '#FFFFFF', city: "Bethlehem, Pa.", conference: "Colonial 10", crop: 4 },
  "Loyola Chicago": { abbr: "LUC", mascot: "Ramblers", color: '#8A2432', altColor: '#F1BE48', city: "Chicago, Ill.", conference: "Horizon Valley Conference", crop: 4 },
  "Maryland": { abbr: "MD", mascot: "Terrapins", color: '#E21833', altColor: '#FFD200', city: "College Park, Md.", conference: "Coastal Atlantic Conference" },
  "McGill": { abbr: "MCG", mascot: "Martlets", color: '#ED1B2F', altColor: '#FFFFFF', city: "Montreal, Que.", conference: "Metro Conference" },
  "Memphis": { abbr: "MEM", mascot: "Tigers", color: '#003087', altColor: '#898D8D', city: "Memphis, Tenn.", conference: "Greater South Conference", crop: 3 },
  "Miami": { abbr: "MIA", mascot: "Hurricanes", color: '#005030', altColor: '#F47321', city: "Coral Gables, Fla.", conference: "Coastal Atlantic Conference" },
  "Michigan": { abbr: "MICH", mascot: "Wolverines", color: '#00274C', altColor: '#FFCB05', city: "Ann Arbor, Mich.", conference: "Big Ten" },
  "Michigan State": { abbr: "MSU", mascot: "Spartans", color: '#18453B', altColor: '#FFFFFF', city: "East Lansing, Mich.", conference: "Big Ten" },
  "Minnesota": { abbr: "MINN", mascot: "Golden Gophers", color: '#7A0019', altColor: '#FFCC33', city: "Minneapolis, Minn.", conference: "Big Ten" },
  "Missouri": { abbr: "MIZ", mascot: "Tigers", color: '#000000', altColor: '#F1B82D', city: "Columbia, Mo.", conference: "Southwest Conference" },
  "Missouri S&T": { abbr: "MST", mascot: "Miners", color: '#00853E', altColor: '#FDB515', city: "Rolla, Mo.", conference: "Horizon Valley Conference", crop: 4 },
  "MIT": { abbr: "MIT", mascot: "Engineers", color: '#A31F34', altColor: '#8A8B8C', city: "Cambridge, Mass.", conference: "University Athletic Association" },
  "Montana": { abbr: "MONT", mascot: "Grizzlies", color: '#70003C', altColor: '#A7A9AC', city: "Missoula, Mont.", conference: "Rocky West Conference", crop: 4 },
  "Montana State": { abbr: "MTST", mascot: "Bobcats", color: '#003875', altColor: '#B9975B', city: "Bozeman, Mont.", conference: "Rocky West Conference", crop: 4 },
  "Nebraska": { abbr: "NEB", mascot: "Cornhuskers", color: '#E41C38', altColor: '#FDF2D9', city: "Lincoln, Neb.", conference: "Big Ten", joins: 2032 },
  "Nevada": { abbr: "NEV", mascot: "Wolf Pack", color: '#003366', altColor: '#807F84', city: "Reno, Nev.", conference: "Western Athletic Conference", crop: 3 },
  "New Mexico": { abbr: "UNM", mascot: "Lobos", color: '#BA0C2F', altColor: '#A7A8AA', city: "Albuquerque, N.M.", conference: "Rocky West Conference", crop: 4 },
  "New Mexico State": { abbr: "NMSU", mascot: "Aggies", color: '#8C0B42', altColor: '#FFFFFF', city: "Las Cruces, N.M.", conference: "Rocky West Conference", crop: 4 },
  "North Carolina": { abbr: "UNC", mascot: "Tar Heels", color: '#7BAFD4', altColor: '#13294B', city: "Chapel Hill, N.C.", conference: "Coastal Atlantic Conference" },
  "North Dakota": { abbr: "UND", mascot: "Fighting Hawks", color: '#009A44', altColor: '#000000', city: "Grand Forks, N.D.", conference: "Rocky West Conference", crop: 4 },
  "North Dakota State": { abbr: "NDSU", mascot: "Bison", color: '#0A5640', altColor: '#FFC72A', city: "Fargo, N.D.", conference: "Rocky West Conference", crop: 4 },
  "Northeastern": { abbr: "NEU", mascot: "Huskies", color: '#C8102E', altColor: '#000000', city: "Boston, Mass.", conference: "Colonial 10", crop: 4 },
  "Northern Arizona": { abbr: "NAU", mascot: "Lumberjacks", color: '#003466', altColor: '#FFD200', city: "Flagstaff, Ariz.", conference: "Western Athletic Conference", crop: 3 },
  "Northwestern": { abbr: "NU", mascot: "Wildcats", color: '#4E2A84', altColor: '#FFFFFF', city: "Evanston, Ill.", conference: "Big Ten" },
  "Notre Dame": { abbr: "ND", mascot: "Fighting Irish", color: '#0C2340', altColor: '#C99700', city: "Notre Dame, Ind.", conference: "Coastal Atlantic Conference" },
  "NYU": { abbr: "NYU", mascot: "Violets", color: '#57068C', altColor: '#FFFFFF', city: "New York, N.Y.", conference: "University Athletic Association" },
  "Ohio": { abbr: "OHIO", mascot: "Bobcats", color: '#00694E', altColor: '#FFFFFF', city: "Athens, Ohio", conference: "Horizon Valley Conference", crop: 4 },
  "Ohio State": { abbr: "OSU", mascot: "Buckeyes", color: '#BB0000', altColor: '#666666', city: "Columbus, Ohio", conference: "Big Ten" },
  "Oregon": { abbr: "ORE", mascot: "Ducks", color: '#154733', altColor: '#FEE123', city: "Eugene, Ore.", conference: "Pacific-10 Conference" },
  "Oregon State": { abbr: "ORST", mascot: "Beavers", color: '#DC4405', altColor: '#000000', city: "Corvallis, Ore.", conference: "Western Athletic Conference", crop: 3 },
  "Penn": { abbr: "PENN", mascot: "Quakers", color: '#011F5B', altColor: '#990000', city: "Philadelphia, Pa.", conference: "Ivy League" },
  "Penn State": { abbr: "PSU", mascot: "Nittany Lions", color: '#041E42', altColor: '#FFFFFF', city: "University Park, Pa.", conference: "Big Ten" },
  "Pittsburgh": { abbr: "PITT", mascot: "Panthers", color: '#003594', altColor: '#FFB81C', city: "Pittsburgh, Pa.", conference: "Metro Conference" },
  "Princeton": { abbr: "PRIN", mascot: "Tigers", color: '#E77500', altColor: '#000000', city: "Princeton, N.J.", conference: "Ivy League" },
  "Purdue": { abbr: "PUR", mascot: "Boilermakers", color: '#000000', altColor: '#CFB991', city: "West Lafayette, Ind.", conference: "Big Ten" },
  "Rhode Island": { abbr: "URI", mascot: "Rams", color: '#002147', altColor: '#75B2DD', city: "Kingston, R.I.", conference: "Colonial 10", crop: 4 },
  "Rice": { abbr: "RICE", mascot: "Owls", color: '#00205B', altColor: '#7C7E7F', city: "Houston, Texas", conference: "Southwest Conference" },
  "Rochester": { abbr: "ROCH", mascot: "Yellowjackets", color: '#001E5F', altColor: '#FFD100', city: "Rochester, N.Y.", conference: "University Athletic Association" },
  "Rutgers": { abbr: "RUTG", mascot: "Scarlet Knights", color: '#CC0033', altColor: '#5F6A72', city: "Piscataway, N.J.", conference: "Metro Conference" },
  "Saint Louis": { abbr: "SLU", mascot: "Billikens", color: '#003DA5', altColor: '#FFFFFF', city: "St. Louis, Mo.", conference: "Greater South Conference", crop: 3 },
  "San Diego State": { abbr: "SDSU", mascot: "Aztecs", color: '#A6192E', altColor: '#000000', city: "San Diego, Calif.", conference: "Western Athletic Conference", crop: 3 },
  "SMU": { abbr: "SMU", mascot: "Mustangs", color: '#0033A0', altColor: '#C8102E', city: "Dallas, Texas", conference: "Southwest Conference", crop: 3 },
  "South Florida": { abbr: "USF", mascot: "Bulls", color: '#006747', altColor: '#CFC493', city: "Tampa, Fla.", conference: "Coastal Atlantic Conference" },
  "Southern Illinois": { abbr: "SIU", mascot: "Salukis", color: '#720000', altColor: '#FFFFFF', city: "Carbondale, Ill.", conference: "Horizon Valley Conference", crop: 4 },
  "Stanford": { abbr: "STAN", mascot: "Cardinal", color: '#8C1515', altColor: '#FFFFFF', city: "Stanford, Calif.", conference: "Pacific-10 Conference" },
  "Stony Brook": { abbr: "SBU", mascot: "Seawolves", color: '#990000', altColor: '#16243E', city: "Stony Brook, N.Y.", conference: "Metro Conference" },
  "Syracuse": { abbr: "SYR", mascot: "Orange", color: '#F76900', altColor: '#000E54', city: "Syracuse, N.Y.", conference: "Metro Conference", joins: 2032 },
  "Temple": { abbr: "TEM", mascot: "Owls", color: '#9D2235', altColor: '#FFFFFF', city: "Philadelphia, Pa.", conference: "Colonial 10", crop: 4 },
  "Texas": { abbr: "TEX", mascot: "Longhorns", color: '#BF5700', altColor: '#FFFFFF', city: "Austin, Texas", conference: "Southwest Conference" },
  "Texas A&M": { abbr: "TAMU", mascot: "Aggies", color: '#500000', altColor: '#FFFFFF', city: "College Station, Texas", conference: "Southwest Conference" },
  "Texas Tech": { abbr: "TTU", mascot: "Red Raiders", color: '#CC0000', altColor: '#000000', city: "Lubbock, Texas", conference: "Southwest Conference", crop: 3 },
  "Toronto": { abbr: "TOR", mascot: "Varsity Blues", color: '#1E3765', altColor: '#FFFFFF', city: "Toronto, Ont.", conference: "Metro Conference" },
  "Tufts": { abbr: "TUFT", mascot: "Jumbos", color: '#3E8EDE', altColor: '#002E6D', city: "Medford, Mass.", conference: "University Athletic Association" },
  "Tulane": { abbr: "TUL", mascot: "Green Wave", color: '#006747', altColor: '#418FDE', city: "New Orleans, La.", conference: "Southwest Conference" },
  "UAB": { abbr: "UAB", mascot: "Blazers", color: '#1E6B52', altColor: '#F4C300', city: "Birmingham, Ala.", conference: "Southwest Conference" },
  "UC Davis": { abbr: "UCD", mascot: "Aggies", color: '#022851', altColor: '#FFBF00', city: "Davis, Calif.", conference: "UC Athletic Association" },
  "UC Irvine": { abbr: "UCI", mascot: "Anteaters", color: '#0064A4', altColor: '#FFD200', city: "Irvine, Calif.", conference: "UC Athletic Association" },
  "UC Merced": { abbr: "UCM", mascot: "Golden Bobcats", color: '#002856', altColor: '#DAA900', city: "Merced, Calif.", conference: "UC Athletic Association", joins: 2032 },
  "UC Riverside": { abbr: "UCR", mascot: "Highlanders", color: '#003DA5', altColor: '#FFB81C', city: "Riverside, Calif.", conference: "UC Athletic Association" },
  "UC San Diego": { abbr: "UCSD", mascot: "Tritons", color: '#182B49', altColor: '#C69214', city: "La Jolla, Calif.", conference: "UC Athletic Association" },
  "UC Santa Barbara": { abbr: "UCSB", mascot: "Gauchos", color: '#003660', altColor: '#FEBC11', city: "Santa Barbara, Calif.", conference: "UC Athletic Association" },
  "UC Santa Cruz": { abbr: "UCSC", mascot: "Banana Slugs", color: '#003C6C', altColor: '#FDC700', city: "Santa Cruz, Calif.", conference: "UC Athletic Association" },
  "UCLA": { abbr: "UCLA", mascot: "Bruins", color: '#2D68C4', altColor: '#F2A900', city: "Los Angeles, Calif.", conference: "Pacific-10 Conference" },
  "UConn": { abbr: "UCONN", mascot: "Huskies", color: '#000E2F', altColor: '#E4002B', city: "Storrs, Conn.", conference: "Metro Conference", joins: 2032 },
  "UIC": { abbr: "UIC", mascot: "Flames", color: '#001E62', altColor: '#D50032', city: "Chicago, Ill.", conference: "Horizon Valley Conference", crop: 4 },
  "UMass": { abbr: "UMASS", mascot: "Minutemen", color: '#881C1C', altColor: '#000000', city: "Amherst, Mass.", conference: "Colonial 10", crop: 4 },
  "UMKC": { abbr: "UMKC", mascot: "Roos", color: '#0067C5', altColor: '#FFC82E', city: "Kansas City, Mo.", conference: "Horizon Valley Conference", crop: 4 },
  "UNLV": { abbr: "UNLV", mascot: "Rebels", color: '#CF0A2C', altColor: '#666666', city: "Las Vegas, Nev.", conference: "Western Athletic Conference", crop: 3 },
  "USC": { abbr: "USC", mascot: "Trojans", color: '#990000', altColor: '#FFC72C', city: "Los Angeles, Calif.", conference: "Pacific-10 Conference" },
  "UT Dallas": { abbr: "UTD", mascot: "Comets", color: '#E87500', altColor: '#154734', city: "Richardson, Texas", conference: "Southwest Conference", crop: 3 },
  "Utah": { abbr: "UTAH", mascot: "Utes", color: '#CC0000', altColor: '#000000', city: "Salt Lake City, Utah", conference: "Pacific-10 Conference" },
  "Utah State": { abbr: "USU", mascot: "Aggies", color: '#0F2439', altColor: '#A2AAAD', city: "Logan, Utah", conference: "Western Athletic Conference", crop: 3 },
  "UTEP": { abbr: "UTEP", mascot: "Miners", color: '#041E42', altColor: '#FF8200', city: "El Paso, Texas", conference: "Rocky West Conference", crop: 4 },
  "UTSA": { abbr: "UTSA", mascot: "Roadrunners", color: '#0C2340', altColor: '#F15A22', city: "San Antonio, Texas", conference: "Rocky West Conference", crop: 4 },
  "Vanderbilt": { abbr: "VAN", mascot: "Commodores", color: '#000000', altColor: '#CFAE70', city: "Nashville, Tenn.", conference: "Southwest Conference" },
  "VCU": { abbr: "VCU", mascot: "Rams", color: '#000000', altColor: '#FFB300', city: "Richmond, Va.", conference: "Colonial 10", crop: 4 },
  "Virginia": { abbr: "UVA", mascot: "Cavaliers", color: '#232D4B', altColor: '#E57200', city: "Charlottesville, Va.", conference: "Coastal Atlantic Conference" },
  "Washington": { abbr: "UW", mascot: "Huskies", color: '#4B2E83', altColor: '#B7A57A', city: "Seattle, Wash.", conference: "Pacific-10 Conference" },
  "Washington State": { abbr: "WSU", mascot: "Cougars", color: '#981E32', altColor: '#5E6A71', city: "Pullman, Wash.", conference: "Western Athletic Conference", crop: 3 },
  "WashU": { abbr: "WUSTL", mascot: "Bears", color: '#A51417', altColor: '#007360', city: "St. Louis, Mo.", conference: "University Athletic Association" },
  "West Virginia": { abbr: "WVU", mascot: "Mountaineers", color: '#002855', altColor: '#EAAA00', city: "Morgantown, W.Va.", conference: "Horizon Valley Conference", crop: 4 },
  "Wisconsin": { abbr: "WIS", mascot: "Badgers", color: '#C5050C', altColor: '#FFFFFF', city: "Madison, Wis.", conference: "Big Ten" },
  "Yale": { abbr: "YALE", mascot: "Bulldogs", color: '#00356B', altColor: '#FFFFFF', city: "New Haven, Conn.", conference: "Ivy League" },
};

// The owner's AAU conferences (his eight, the Greater South, the Horizon Valley, the WAC, the Rocky West and the Colonial 10), for the "AAU conference" pick on the
// Add conference form (a conference that doesn't sponsor this sport yet can
// be added later): abbreviation, colors and logo, as in the AAU Dynasty.
export const AAU_CONFERENCES = {
  'Big Ten': { abbr: 'B1G', color: '#0088CE', altColor: '#0B2A4A', logo: CONF_LOGO_LINKS.bigten },
  'Coastal Atlantic Conference': { abbr: 'CAC', color: '#3A4A5C', altColor: '#5CC6C2', logo: 'img/conf/cac.svg' },
  'Ivy League': { abbr: 'IVY', color: '#026937', altColor: '#C9B37E', logo: CONF_LOGO_LINKS.ivy },
  'Metro Conference': { abbr: 'METRO', color: '#E03A3E', altColor: '#23262D', logo: CONF_LOGO_LINKS.metro },
  'Pacific-10 Conference': { abbr: 'P10', color: '#092346', altColor: '#D6A84B', logo: CONF_LOGO_LINKS.pac10 },
  'Southwest Conference': { abbr: 'SWC', color: '#719AE8', altColor: '#F28C38', logo: 'img/conf/swc.svg' },
  'UC Athletic Association': { abbr: 'UCAA', color: '#0F6E7A', altColor: '#F2C14E', logo: 'img/conf/ucaa.svg' },
  'Greater South Conference': { abbr: 'GSC', color: '#14284B', altColor: '#A3262C', logo: 'img/conf/gsc.svg' },
  'Horizon Valley Conference': { abbr: 'HVC', color: '#33265A', altColor: '#E5672A', logo: 'img/conf/hvc.svg' },
  'Rocky West Conference': { abbr: 'RWC', color: '#1F4D3A', altColor: '#E3A72F', logo: 'img/conf/rwc.svg' },
  'Colonial 10': { abbr: 'C10', color: '#14274E', altColor: '#B22234', logo: 'img/conf/c10.svg' },
  'Western Athletic Conference': { abbr: 'WAC', color: '#0B2D6B', altColor: '#B9975B', logo: CONF_LOGO_LINKS.wac },
  'University Athletic Association': { abbr: 'UAA', color: '#003087', altColor: '#F2B33D', logo: CONF_LOGO_LINKS.uaa },
};

// Home venue and 2026 head coach, by side, for the schools that join for
// 2032-33 (the sports each one plays here). From the schools' athletics
// sites and Wikipedia, Nov. 2026. Picking one of these schools on the Add
// team form fills these in too.
export const AAU_PROGRAMS = {
  women: {
    "Syracuse": { stadium: "Tennity Ice Pavilion", coach: "Britni Smith" },
    "UConn": { stadium: "Toscano Family Ice Forum", coach: "Chris MacKenzie" },
    // The owner's fourth crop (Nov. 2026): home venue only; coaches are added by hand.
    "Boston College": { stadium: "Kelley Rink at Conte Forum" },
    "Northeastern": { stadium: "Matthews Arena" },
  },
  men: {
    "UConn": { stadium: "Toscano Family Ice Forum", coach: "Mike Cavanaugh" },
    // The owner's fourth crop (Nov. 2026): home venue only; coaches are added by hand.
    "Boston College": { stadium: "Kelley Rink at Conte Forum" },
    "Denver": { stadium: "Magness Arena" },
    "North Dakota": { stadium: "Ralph Engelstad Arena" },
    "Northeastern": { stadium: "Matthews Arena" },
    "UMass": { stadium: "Mullins Center" },
  },
};
