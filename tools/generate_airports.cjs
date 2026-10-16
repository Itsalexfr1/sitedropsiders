const fs = require('fs');
const path = require('path');

const airports = [
  // --- ÉTATS-UNIS (USA) ---
  { iata: 'MCO', name: 'Orlando International Airport', city: 'Orlando', country: 'États-Unis' },
  { iata: 'SFB', name: 'Orlando Sanford International', city: 'Orlando', country: 'États-Unis' },
  { iata: 'ATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', country: 'États-Unis' },
  { iata: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'États-Unis' },
  { iata: 'BUR', name: 'Hollywood Burbank Airport', city: 'Burbank / Los Angeles', country: 'États-Unis' },
  { iata: 'ONT', name: 'Ontario International Airport', city: 'Ontario / Los Angeles', country: 'États-Unis' },
  { iata: 'SNA', name: 'John Wayne Airport (Orange County)', city: 'Santa Ana / Los Angeles', country: 'États-Unis' },
  { iata: 'LGB', name: 'Long Beach Airport', city: 'Long Beach / Los Angeles', country: 'États-Unis' },
  { iata: 'ORD', name: 'Chicago O\'Hare International', city: 'Chicago', country: 'États-Unis' },
  { iata: 'MDW', name: 'Chicago Midway International', city: 'Chicago', country: 'États-Unis' },
  { iata: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas / Fort Worth', country: 'États-Unis' },
  { iata: 'DAL', name: 'Dallas Love Field', city: 'Dallas', country: 'États-Unis' },
  { iata: 'DEN', name: 'Denver International Airport', city: 'Denver', country: 'États-Unis' },
  { iata: 'JFK', name: 'New York John F. Kennedy International', city: 'New York', country: 'États-Unis' },
  { iata: 'EWR', name: 'Newark Liberty International', city: 'New York / Newark', country: 'États-Unis' },
  { iata: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'États-Unis' },
  { iata: 'NYC', name: 'New York (Tous les aéroports)', city: 'New York', country: 'États-Unis' },
  { iata: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'États-Unis' },
  { iata: 'OAK', name: 'Oakland International Airport', city: 'Oakland / San Francisco', country: 'États-Unis' },
  { iata: 'SJC', name: 'San Jose Mineta International', city: 'San Jose / Silicon Valley', country: 'États-Unis' },
  { iata: 'LAS', name: 'Harry Reid International Airport', city: 'Las Vegas', country: 'États-Unis' },
  { iata: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', country: 'États-Unis' },
  { iata: 'CLT', name: 'Charlotte Douglas International', city: 'Charlotte', country: 'États-Unis' },
  { iata: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'États-Unis' },
  { iata: 'FLL', name: 'Fort Lauderdale-Hollywood International', city: 'Fort Lauderdale / Miami', country: 'États-Unis' },
  { iata: 'PBI', name: 'Palm Beach International Airport', city: 'West Palm Beach / Miami', country: 'États-Unis' },
  { iata: 'PHX', name: 'Phoenix Sky Harbor International', city: 'Phoenix', country: 'États-Unis' },
  { iata: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', country: 'États-Unis' },
  { iata: 'HOU', name: 'William P. Hobby Airport', city: 'Houston', country: 'États-Unis' },
  { iata: 'BOS', name: 'Boston Logan International', city: 'Boston', country: 'États-Unis' },
  { iata: 'MSP', name: 'Minneapolis-Saint Paul International', city: 'Minneapolis', country: 'États-Unis' },
  { iata: 'DTW', name: 'Detroit Metropolitan Airport', city: 'Detroit', country: 'États-Unis' },
  { iata: 'PHL', name: 'Philadelphia International Airport', city: 'Philadelphie', country: 'États-Unis' },
  { iata: 'SLC', name: 'Salt Lake City International', city: 'Salt Lake City', country: 'États-Unis' },
  { iata: 'BWI', name: 'Baltimore/Washington International', city: 'Baltimore / Washington', country: 'États-Unis' },
  { iata: 'IAD', name: 'Washington Dulles International', city: 'Washington D.C.', country: 'États-Unis' },
  { iata: 'DCA', name: 'Ronald Reagan Washington National', city: 'Washington D.C.', country: 'États-Unis' },
  { iata: 'WAS', name: 'Washington D.C. (Tous les aéroports)', city: 'Washington D.C.', country: 'États-Unis' },
  { iata: 'SAN', name: 'San Diego International Airport', city: 'San Diego', country: 'États-Unis' },
  { iata: 'TPA', name: 'Tampa International Airport', city: 'Tampa', country: 'États-Unis' },
  { iata: 'PDX', name: 'Portland International Airport', city: 'Portland', country: 'États-Unis' },
  { iata: 'AUS', name: 'Austin-Bergstrom International', city: 'Austin', country: 'États-Unis' },
  { iata: 'BNA', name: 'Nashville International Airport', city: 'Nashville', country: 'États-Unis' },
  { iata: 'HNL', name: 'Daniel K. Inouye International', city: 'Honolulu / Hawaii', country: 'États-Unis' },
  { iata: 'OGG', name: 'Kahului Airport (Maui)', city: 'Kahului / Hawaii', country: 'États-Unis' },
  { iata: 'MSY', name: 'Louis Armstrong New Orleans International', city: 'La Nouvelle-Orléans', country: 'États-Unis' },
  { iata: 'STL', name: 'St. Louis Lambert International', city: 'Saint Louis', country: 'États-Unis' },
  { iata: 'MCI', name: 'Kansas City International Airport', city: 'Kansas City', country: 'États-Unis' },
  { iata: 'IND', name: 'Indianapolis International Airport', city: 'Indianapolis', country: 'États-Unis' },
  { iata: 'RDU', name: 'Raleigh-Durham International', city: 'Raleigh / Durham', country: 'États-Unis' },
  { iata: 'CLE', name: 'Cleveland Hopkins International', city: 'Cleveland', country: 'États-Unis' },
  { iata: 'PIT', name: 'Pittsburgh International Airport', city: 'Pittsburgh', country: 'États-Unis' },
  { iata: 'CMH', name: 'John Glenn Columbus International', city: 'Columbus', country: 'États-Unis' },
  { iata: 'CVG', name: 'Cincinnati/Northern Kentucky International', city: 'Cincinnati', country: 'États-Unis' },
  { iata: 'SAT', name: 'San Antonio International Airport', city: 'San Antonio', country: 'États-Unis' },
  { iata: 'SMF', name: 'Sacramento International Airport', city: 'Sacramento', country: 'États-Unis' },
  { iata: 'MKE', name: 'Milwaukee Mitchell International', city: 'Milwaukee', country: 'États-Unis' },
  { iata: 'JAX', name: 'Jacksonville International Airport', city: 'Jacksonville', country: 'États-Unis' },
  { iata: 'MEM', name: 'Memphis International Airport', city: 'Memphis', country: 'États-Unis' },
  { iata: 'RSW', name: 'Southwest Florida International', city: 'Fort Myers', country: 'États-Unis' },
  { iata: 'ANC', name: 'Ted Stevens Anchorage International', city: 'Anchorage / Alaska', country: 'États-Unis' },
  { iata: 'ABQ', name: 'Albuquerque International Sunport', city: 'Albuquerque', country: 'États-Unis' },
  { iata: 'OMA', name: 'Eppley Airfield', city: 'Omaha', country: 'États-Unis' },
  { iata: 'BOI', name: 'Boise Airport', city: 'Boise', country: 'États-Unis' },
  { iata: 'RNO', name: 'Reno-Tahoe International', city: 'Reno', country: 'États-Unis' },

  // --- CANADA ---
  { iata: 'YYZ', name: 'Toronto Pearson International', city: 'Toronto', country: 'Canada' },
  { iata: 'YTZ', name: 'Billy Bishop Toronto City Airport', city: 'Toronto', country: 'Canada' },
  { iata: 'YTO', name: 'Toronto (Tous les aéroports)', city: 'Toronto', country: 'Canada' },
  { iata: 'YUL', name: 'Montréal-Trudeau International', city: 'Montréal', country: 'Canada' },
  { iata: 'YMQ', name: 'Montréal (Tous les aéroports)', city: 'Montréal', country: 'Canada' },
  { iata: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada' },
  { iata: 'YYC', name: 'Calgary International Airport', city: 'Calgary', country: 'Canada' },
  { iata: 'YEG', name: 'Edmonton International Airport', city: 'Edmonton', country: 'Canada' },
  { iata: 'YOW', name: 'Ottawa Macdonald-Cartier International', city: 'Ottawa', country: 'Canada' },
  { iata: 'YQB', name: 'Québec Jean Lesage International', city: 'Québec', country: 'Canada' },
  { iata: 'YHZ', name: 'Halifax Stanfield International', city: 'Halifax', country: 'Canada' },
  { iata: 'YWG', name: 'Winnipeg Richardson International', city: 'Winnipeg', country: 'Canada' },
  { iata: 'YYJ', name: 'Victoria International Airport', city: 'Victoria', country: 'Canada' },
  { iata: 'YLW', name: 'Kelowna International Airport', city: 'Kelowna', country: 'Canada' },

  // --- FRANCE & OUTRE-MER ---
  { iata: 'PAR', name: 'Paris (Tous les aéroports)', city: 'Paris', country: 'France' },
  { iata: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris', country: 'France' },
  { iata: 'ORY', name: 'Paris Orly', city: 'Paris', country: 'France' },
  { iata: 'BVA', name: 'Paris Beauvais-Tillé', city: 'Beauvais / Paris', country: 'France' },
  { iata: 'MRS', name: 'Marseille Provence', city: 'Marseille', country: 'France' },
  { iata: 'LYS', name: 'Lyon Saint-Exupéry', city: 'Lyon', country: 'France' },
  { iata: 'NCE', name: 'Nice Côte d\'Azur', city: 'Nice', country: 'France' },
  { iata: 'TLS', name: 'Toulouse Blagnac', city: 'Toulouse', country: 'France' },
  { iata: 'NTE', name: 'Nantes Atlantique', city: 'Nantes', country: 'France' },
  { iata: 'BOD', name: 'Bordeaux Mérignac', city: 'Bordeaux', country: 'France' },
  { iata: 'LIL', name: 'Lille Lesquin', city: 'Lille', country: 'France' },
  { iata: 'SXB', name: 'Strasbourg Entzheim', city: 'Strasbourg', country: 'France' },
  { iata: 'MPL', name: 'Montpellier Méditerranée', city: 'Montpellier', country: 'France' },
  { iata: 'RNS', name: 'Rennes Saint-Jacques', city: 'Rennes', country: 'France' },
  { iata: 'BES', name: 'Brest Bretagne', city: 'Brest', country: 'France' },
  { iata: 'BIQ', name: 'Biarritz Pays Basque', city: 'Biarritz', country: 'France' },
  { iata: 'TLN', name: 'Toulon Hyères', city: 'Toulon', country: 'France' },
  { iata: 'PGF', name: 'Perpignan Rivesaltes', city: 'Perpignan', country: 'France' },
  { iata: 'PUF', name: 'Pau Pyrénées', city: 'Pau', country: 'France' },
  { iata: 'LDE', name: 'Tarbes Lourdes Pyrénées', city: 'Tarbes / Lourdes', country: 'France' },
  { iata: 'AJA', name: 'Ajaccio Napoléon Bonaparte', city: 'Ajaccio / Corse', country: 'France' },
  { iata: 'BIA', name: 'Bastia Poretta', city: 'Bastia / Corse', country: 'France' },
  { iata: 'FSC', name: 'Figari Sud-Corse', city: 'Figari / Porto-Vecchio / Corse', country: 'France' },
  { iata: 'CLY', name: 'Calvi Sainte-Catherine', city: 'Calvi / Corse', country: 'France' },
  { iata: 'RUN', name: 'La Réunion Roland Garros', city: 'Saint-Denis / Réunion', country: 'France' },
  { iata: 'PTP', name: 'Pointe-à-Pitre Le Raizet', city: 'Pointe-à-Pitre / Guadeloupe', country: 'France' },
  { iata: 'FDF', name: 'Fort-de-France Martinique Aimé Césaire', city: 'Fort-de-France / Martinique', country: 'France' },
  { iata: 'CAY', name: 'Cayenne Félix Éboué', city: 'Cayenne / Guyane', country: 'France' },
  { iata: 'DZA', name: 'Dzaoudzi-Pamandzi', city: 'Mayotte', country: 'France' },
  { iata: 'PPT', name: 'Tahiti Faa\'a International', city: 'Papeete / Tahiti', country: 'Polynésie française' },
  { iata: 'NOU', name: 'Nouméa La Tontouta', city: 'Nouméa', country: 'Nouvelle-Calédonie' },

  // --- ROYAUME-UNI & IRLANDE ---
  { iata: 'LON', name: 'Londres (Tous les aéroports)', city: 'Londres', country: 'Royaume-Uni' },
  { iata: 'LHR', name: 'London Heathrow Airport', city: 'Londres', country: 'Royaume-Uni' },
  { iata: 'LGW', name: 'London Gatwick Airport', city: 'Londres', country: 'Royaume-Uni' },
  { iata: 'STN', name: 'London Stansted Airport', city: 'Londres', country: 'Royaume-Uni' },
  { iata: 'LTN', name: 'London Luton Airport', city: 'Londres', country: 'Royaume-Uni' },
  { iata: 'LCY', name: 'London City Airport', city: 'Londres', country: 'Royaume-Uni' },
  { iata: 'SEN', name: 'London Southend Airport', city: 'Londres', country: 'Royaume-Uni' },
  { iata: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'Royaume-Uni' },
  { iata: 'BHX', name: 'Birmingham Airport', city: 'Birmingham', country: 'Royaume-Uni' },
  { iata: 'EDI', name: 'Edinburgh Airport', city: 'Édimbourg', country: 'Royaume-Uni' },
  { iata: 'GLA', name: 'Glasgow Airport', city: 'Glasgow', country: 'Royaume-Uni' },
  { iata: 'BRS', name: 'Bristol Airport', city: 'Bristol', country: 'Royaume-Uni' },
  { iata: 'NCL', name: 'Newcastle International', city: 'Newcastle', country: 'Royaume-Uni' },
  { iata: 'LPL', name: 'Liverpool John Lennon', city: 'Liverpool', country: 'Royaume-Uni' },
  { iata: 'LBA', name: 'Leeds Bradford Airport', city: 'Leeds', country: 'Royaume-Uni' },
  { iata: 'BFS', name: 'Belfast International', city: 'Belfast', country: 'Royaume-Uni' },
  { iata: 'ABZ', name: 'Aberdeen Airport', city: 'Aberdeen', country: 'Royaume-Uni' },
  { iata: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Irlande' },
  { iata: 'ORK', name: 'Cork Airport', city: 'Cork', country: 'Irlande' },
  { iata: 'SNN', name: 'Shannon Airport', city: 'Shannon / Limerick', country: 'Irlande' },

  // --- ESPAGNE & PORTUGAL ---
  { iata: 'MAD', name: 'Madrid-Barajas Adolfo Suárez', city: 'Madrid', country: 'Espagne' },
  { iata: 'BCN', name: 'Barcelona-El Prat Josep Tarradellas', city: 'Barcelone', country: 'Espagne' },
  { iata: 'IBZ', name: 'Ibiza Airport (Eivissa)', city: 'Ibiza', country: 'Espagne' },
  { iata: 'PMI', name: 'Palma de Mallorca Son Sant Joan', city: 'Palma de Majorque', country: 'Espagne' },
  { iata: 'MAH', name: 'Menorca Airport', city: 'Minorque / Mahon', country: 'Espagne' },
  { iata: 'AGP', name: 'Málaga-Costa del Sol', city: 'Malaga', country: 'Espagne' },
  { iata: 'ALC', name: 'Alicante-Elche Miguel Hernández', city: 'Alicante', country: 'Espagne' },
  { iata: 'VLC', name: 'Valencia Airport', city: 'Valence', country: 'Espagne' },
  { iata: 'SVQ', name: 'Sevilla San Pablo Airport', city: 'Séville', country: 'Espagne' },
  { iata: 'BIO', name: 'Bilbao Airport', city: 'Bilbao', country: 'Espagne' },
  { iata: 'SCQ', name: 'Santiago de Compostela Airport', city: 'Saint-Jacques-de-Compostelle', country: 'Espagne' },
  { iata: 'TFS', name: 'Tenerife Sur Reina Sofía', city: 'Ténérife / Canaries', country: 'Espagne' },
  { iata: 'TFN', name: 'Tenerife Norte Ciudad de La Laguna', city: 'Ténérife / Canaries', country: 'Espagne' },
  { iata: 'LPA', name: 'Gran Canaria Las Palmas', city: 'Grande Canarie / Las Palmas', country: 'Espagne' },
  { iata: 'ACE', name: 'Lanzarote César Manrique', city: 'Lanzarote / Canaries', country: 'Espagne' },
  { iata: 'FUE', name: 'Fuerteventura Airport', city: 'Fuerteventura / Canaries', country: 'Espagne' },
  { iata: 'LIS', name: 'Lisbon Humberto Delgado Airport', city: 'Lisbonne', country: 'Portugal' },
  { iata: 'OPO', name: 'Porto Francisco Sá Carneiro', city: 'Porto', country: 'Portugal' },
  { iata: 'FAO', name: 'Faro Algarve Airport', city: 'Faro / Algarve', country: 'Portugal' },
  { iata: 'FNC', name: 'Madeira Cristiano Ronaldo (Funchal)', city: 'Madère / Funchal', country: 'Portugal' },
  { iata: 'PDL', name: 'Ponta Delgada João Paulo II', city: 'Ponta Delgada / Açores', country: 'Portugal' },

  // --- ITALIE ---
  { iata: 'ROM', name: 'Rome (Tous les aéroports)', city: 'Rome', country: 'Italie' },
  { iata: 'FCO', name: 'Rome Fiumicino Leonardo da Vinci', city: 'Rome', country: 'Italie' },
  { iata: 'CIA', name: 'Rome Ciampino', city: 'Rome', country: 'Italie' },
  { iata: 'MIL', name: 'Milan (Tous les aéroports)', city: 'Milan', country: 'Italie' },
  { iata: 'MXP', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italie' },
  { iata: 'LIN', name: 'Milan Linate Airport', city: 'Milan', country: 'Italie' },
  { iata: 'BGY', name: 'Milan Bergamo Orio al Serio', city: 'Bergame / Milan', country: 'Italie' },
  { iata: 'VCE', name: 'Venice Marco Polo Airport', city: 'Venise', country: 'Italie' },
  { iata: 'TSF', name: 'Treviso Antonio Canova (Venise)', city: 'Trévise / Venise', country: 'Italie' },
  { iata: 'NAP', name: 'Naples International Airport', city: 'Naples', country: 'Italie' },
  { iata: 'BLQ', name: 'Bologna Guglielmo Marconi', city: 'Bologne', country: 'Italie' },
  { iata: 'FLR', name: 'Florence Peretola Amerigo Vespucci', city: 'Florence', country: 'Italie' },
  { iata: 'PSA', name: 'Pisa Galileo Galilei', city: 'Pise', country: 'Italie' },
  { iata: 'CTA', name: 'Catania Fontanarossa', city: 'Catane / Sicile', country: 'Italie' },
  { iata: 'PMO', name: 'Palermo Falcone-Borsellino', city: 'Palerme / Sicile', country: 'Italie' },
  { iata: 'BRI', name: 'Bari Karol Wojtyla', city: 'Bari', country: 'Italie' },
  { iata: 'CAG', name: 'Cagliari Elmas', city: 'Cagliari / Sardaigne', country: 'Italie' },
  { iata: 'OLB', name: 'Olbia Costa Smeralda', city: 'Olbia / Sardaigne', country: 'Italie' },
  { iata: 'TRN', name: 'Turin Caselle Airport', city: 'Turin', country: 'Italie' },
  { iata: 'VRN', name: 'Verona Valerio Catullo', city: 'Vérone', country: 'Italie' },
  { iata: 'GOA', name: 'Genoa Cristoforo Colombo', city: 'Gênes', country: 'Italie' },

  // --- ALLEMAGNE, SUISSE, AUTRICHE ---
  { iata: 'FRA', name: 'Frankfurt Airport', city: 'Francfort', country: 'Allemagne' },
  { iata: 'HHN', name: 'Frankfurt-Hahn Airport', city: 'Hahn / Francfort', country: 'Allemagne' },
  { iata: 'MUC', name: 'Munich Franz Josef Strauss', city: 'Munich', country: 'Allemagne' },
  { iata: 'BER', name: 'Berlin Brandenburg Willy Brandt', city: 'Berlin', country: 'Allemagne' },
  { iata: 'HAM', name: 'Hamburg Helmut Schmidt', city: 'Hambourg', country: 'Allemagne' },
  { iata: 'DUS', name: 'Düsseldorf Airport', city: 'Düsseldorf', country: 'Allemagne' },
  { iata: 'CGN', name: 'Cologne Bonn Konrad Adenauer', city: 'Cologne / Bonn', country: 'Allemagne' },
  { iata: 'STR', name: 'Stuttgart Manfred Rommel', city: 'Stuttgart', country: 'Allemagne' },
  { iata: 'HAJ', name: 'Hannover Airport', city: 'Hanovre', country: 'Allemagne' },
  { iata: 'NUE', name: 'Nuremberg Albrecht Dürer', city: 'Nuremberg', country: 'Allemagne' },
  { iata: 'LEJ', name: 'Leipzig/Halle Airport', city: 'Leipzig', country: 'Allemagne' },
  { iata: 'DTM', name: 'Dortmund Airport', city: 'Dortmund', country: 'Allemagne' },
  { iata: 'ZRH', name: 'Zurich Kloten Airport', city: 'Zurich', country: 'Suisse' },
  { iata: 'GVA', name: 'Geneva Cointrin Airport', city: 'Genève', country: 'Suisse' },
  { iata: 'BSL', name: 'EuroAirport Basel-Mulhouse-Freiburg', city: 'Bâle / Mulhouse', country: 'Suisse / France' },
  { iata: 'VIE', name: 'Vienna International Airport', city: 'Vienne', country: 'Autriche' },
  { iata: 'SZG', name: 'Salzburg W.A. Mozart', city: 'Salzbourg', country: 'Autriche' },
  { iata: 'INN', name: 'Innsbruck Kranebitten', city: 'Innsbruck', country: 'Autriche' },

  // --- BENELUX ---
  { iata: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Pays-Bas' },
  { iata: 'EIN', name: 'Eindhoven Airport', city: 'Eindhoven', country: 'Pays-Bas' },
  { iata: 'RTM', name: 'Rotterdam The Hague Airport', city: 'Rotterdam / La Haye', country: 'Pays-Bas' },
  { iata: 'BRU', name: 'Brussels Airport (Zaventem)', city: 'Bruxelles', country: 'Belgique' },
  { iata: 'CRL', name: 'Brussels South Charleroi', city: 'Charleroi / Bruxelles', country: 'Belgique' },
  { iata: 'LUX', name: 'Luxembourg Findel Airport', city: 'Luxembourg', country: 'Luxembourg' },

  // --- SCANDINAVIE & BALTIQUE ---
  { iata: 'CPH', name: 'Copenhagen Kastrup Airport', city: 'Copenhague', country: 'Danemark' },
  { iata: 'BLL', name: 'Billund Airport (Legoland)', city: 'Billund', country: 'Danemark' },
  { iata: 'ARN', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Suède' },
  { iata: 'BMA', name: 'Stockholm Bromma Airport', city: 'Stockholm', country: 'Suède' },
  { iata: 'NYO', name: 'Stockholm Skavsta Airport', city: 'Stockholm / Nyköping', country: 'Suède' },
  { iata: 'GOT', name: 'Göteborg Landvetter', city: 'Göteborg', country: 'Suède' },
  { iata: 'OSL', name: 'Oslo Gardermoen Airport', city: 'Oslo', country: 'Norvège' },
  { iata: 'TRF', name: 'Sandefjord Torp (Oslo)', city: 'Sandefjord / Oslo', country: 'Norvège' },
  { iata: 'BGO', name: 'Bergen Flesland Airport', city: 'Bergen', country: 'Norvège' },
  { iata: 'SVG', name: 'Stavanger Sola Airport', city: 'Stavanger', country: 'Norvège' },
  { iata: 'TRD', name: 'Trondheim Værnes Airport', city: 'Trondheim', country: 'Norvège' },
  { iata: 'TOS', name: 'Tromsø Langnes Airport', city: 'Tromsø', country: 'Norvège' },
  { iata: 'HEL', name: 'Helsinki-Vantaa Airport', city: 'Helsinki', country: 'Finlande' },
  { iata: 'RVN', name: 'Rovaniemi Santa Claus Airport', city: 'Rovaniemi / Laponie', country: 'Finlande' },
  { iata: 'KEF', name: 'Keflavik International Airport', city: 'Reykjavik', country: 'Islande' },
  { iata: 'TLL', name: 'Tallinn Lennart Meri', city: 'Tallinn', country: 'Estonie' },
  { iata: 'RIX', name: 'Riga International Airport', city: 'Riga', country: 'Lettonie' },
  { iata: 'VNO', name: 'Vilnius International Airport', city: 'Vilnius', country: 'Lituanie' },

  // --- EUROPE CENTRALE & DE L'EST ---
  { iata: 'PRG', name: 'Prague Václav Havel Airport', city: 'Prague', country: 'République Tchèque' },
  { iata: 'WAW', name: 'Warsaw Chopin Airport', city: 'Varsovie', country: 'Pologne' },
  { iata: 'WMI', name: 'Warsaw Modlin Airport', city: 'Varsovie', country: 'Pologne' },
  { iata: 'KRK', name: 'Kraków John Paul II International', city: 'Cracovie', country: 'Pologne' },
  { iata: 'GDN', name: 'Gdańsk Lech Wałęsa Airport', city: 'Gdańsk', country: 'Pologne' },
  { iata: 'WRO', name: 'Wrocław Copernicus Airport', city: 'Wrocław', country: 'Pologne' },
  { iata: 'BUD', name: 'Budapest Ferenc Liszt International', city: 'Budapest', country: 'Hongrie' },
  { iata: 'OTP', name: 'Bucharest Henri Coandă International', city: 'Bucarest', country: 'Roumanie' },
  { iata: 'CLJ', name: 'Cluj-Napoca International', city: 'Cluj-Napoca', country: 'Roumanie' },
  { iata: 'SOF', name: 'Sofia Airport', city: 'Sofia', country: 'Bulgarie' },
  { iata: 'ZAG', name: 'Zagreb Franjo Tuđman Airport', city: 'Zagreb', country: 'Croatie' },
  { iata: 'SPU', name: 'Split Airport', city: 'Split', country: 'Croatie' },
  { iata: 'DBV', name: 'Dubrovnik Airport', city: 'Dubrovnik', country: 'Croatie' },
  { iata: 'ZAD', name: 'Zadar Airport', city: 'Zadar', country: 'Croatie' },
  { iata: 'PUY', name: 'Pula Airport', city: 'Pula', country: 'Croatie' },
  { iata: 'LJU', name: 'Ljubljana Jože Pučnik', city: 'Ljubljana', country: 'Slovénie' },
  { iata: 'BEG', name: 'Belgrade Nikola Tesla Airport', city: 'Belgrade', country: 'Serbie' },
  { iata: 'SJJ', name: 'Sarajevo International Airport', city: 'Sarajevo', country: 'Bosnie-Herzégovine' },
  { iata: 'TGD', name: 'Podgorica Airport', city: 'Podgorica', country: 'Monténégro' },
  { iata: 'TIV', name: 'Tivat Airport', city: 'Tivat / Kotor', country: 'Monténégro' },
  { iata: 'TIA', name: 'Tirana International Mother Teresa', city: 'Tirana', country: 'Albanie' },
  { iata: 'BTS', name: 'Bratislava M. R. Štefánik', city: 'Bratislava', country: 'Slovaquie' },

  // --- GRÈCE, CHYPRE, MALTE ---
  { iata: 'ATH', name: 'Athens Eleftherios Venizelos', city: 'Athènes', country: 'Grèce' },
  { iata: 'SKG', name: 'Thessaloniki Macedonia Airport', city: 'Thessalonique', country: 'Grèce' },
  { iata: 'HER', name: 'Heraklion Nikos Kazantzakis', city: 'Héraklion / Crète', country: 'Grèce' },
  { iata: 'CHQ', name: 'Chania Ioannis Daskalogiannis', city: 'La Canée / Crète', country: 'Grèce' },
  { iata: 'RHO', name: 'Rhodes Diagoras Airport', city: 'Rhodes', country: 'Grèce' },
  { iata: 'CFU', name: 'Corfu Ioannis Kapodistrias', city: 'Corfou', country: 'Grèce' },
  { iata: 'JMK', name: 'Mykonos Airport', city: 'Mykonos', country: 'Grèce' },
  { iata: 'JTR', name: 'Santorini Thira Airport', city: 'Santorin', country: 'Grèce' },
  { iata: 'KGS', name: 'Kos International Airport', city: 'Kos', country: 'Grèce' },
  { iata: 'ZTH', name: 'Zakynthos International', city: 'Zante', country: 'Grèce' },
  { iata: 'LCA', name: 'Larnaca International Airport', city: 'Larnaca', country: 'Chypre' },
  { iata: 'PFO', name: 'Paphos International Airport', city: 'Paphos', country: 'Chypre' },
  { iata: 'MLA', name: 'Malta International Airport', city: 'La Valette / Luqa', country: 'Malte' },

  // --- TURQUIE ---
  { iata: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turquie' },
  { iata: 'SAW', name: 'Istanbul Sabiha Gökçen', city: 'Istanbul', country: 'Turquie' },
  { iata: 'AYT', name: 'Antalya Airport', city: 'Antalya', country: 'Turquie' },
  { iata: 'ADB', name: 'Izmir Adnan Menderes', city: 'Izmir', country: 'Turquie' },
  { iata: 'ESB', name: 'Ankara Esenboğa Airport', city: 'Ankara', country: 'Turquie' },
  { iata: 'BJV', name: 'Milas-Bodrum Airport', city: 'Bodrum', country: 'Turquie' },
  { iata: 'DLM', name: 'Dalaman Airport', city: 'Dalaman / Marmaris', country: 'Turquie' },

  // --- MOYEN-ORIENT ---
  { iata: 'DXB', name: 'Dubai International Airport', city: 'Dubaï', country: 'Émirats arabes unis' },
  { iata: 'DWC', name: 'Dubai Al Maktoum International', city: 'Dubaï', country: 'Émirats arabes unis' },
  { iata: 'AUH', name: 'Zayed International Airport (Abu Dhabi)', city: 'Abou Dabi', country: 'Émirats arabes unis' },
  { iata: 'SHJ', name: 'Sharjah International Airport', city: 'Charjah', country: 'Émirats arabes unis' },
  { iata: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar' },
  { iata: 'RUH', name: 'King Khalid International', city: 'Riyad', country: 'Arabie saoudite' },
  { iata: 'JED', name: 'King Abdulaziz International', city: 'Djeddah / La Mecque', country: 'Arabie saoudite' },
  { iata: 'DMM', name: 'King Fahd International', city: 'Dammam', country: 'Arabie saoudite' },
  { iata: 'MED', name: 'Prince Mohammad Bin Abdulaziz', city: 'Médine', country: 'Arabie saoudite' },
  { iata: 'KWI', name: 'Kuwait International Airport', city: 'Koweït City', country: 'Koweït' },
  { iata: 'BAH', name: 'Bahrain International Airport', city: 'Manama', country: 'Bahreïn' },
  { iata: 'MCT', name: 'Muscat International Airport', city: 'Mascate', country: 'Oman' },
  { iata: 'AMM', name: 'Queen Alia International', city: 'Amman', country: 'Jordanie' },
  { iata: 'BEY', name: 'Beirut-Rafic Hariri International', city: 'Beyrouth', country: 'Liban' },
  { iata: 'TLV', name: 'Ben Gurion International Airport', city: 'Tel Aviv', country: 'Israël' },

  // --- ASIE DE L'EST & DU SUD-EST ---
  { iata: 'TYO', name: 'Tokyo (Tous les aéroports)', city: 'Tokyo', country: 'Japon' },
  { iata: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japon' },
  { iata: 'NRT', name: 'Tokyo Narita International', city: 'Tokyo', country: 'Japon' },
  { iata: 'KIX', name: 'Kansai International Airport', city: 'Osaka', country: 'Japon' },
  { iata: 'ITM', name: 'Osaka Itami International', city: 'Osaka', country: 'Japon' },
  { iata: 'NGO', name: 'Chubu Centrair International', city: 'Nagoya', country: 'Japon' },
  { iata: 'FUK', name: 'Fukuoka Airport', city: 'Fukuoka', country: 'Japon' },
  { iata: 'CTS', name: 'New Chitose Airport', city: 'Sapporo', country: 'Japon' },
  { iata: 'OKA', name: 'Naha Airport (Okinawa)', city: 'Okinawa', country: 'Japon' },
  { iata: 'SEL', name: 'Séoul (Tous les aéroports)', city: 'Séoul', country: 'Corée du Sud' },
  { iata: 'ICN', name: 'Seoul Incheon International', city: 'Séoul', country: 'Corée du Sud' },
  { iata: 'GMP', name: 'Seoul Gimpo International', city: 'Séoul', country: 'Corée du Sud' },
  { iata: 'PUS', name: 'Busan Gimhae International', city: 'Busan', country: 'Corée du Sud' },
  { iata: 'CJU', name: 'Jeju International Airport', city: 'Jeju', country: 'Corée du Sud' },
  { iata: 'BJS', name: 'Pékin (Tous les aéroports)', city: 'Pékin', country: 'Chine' },
  { iata: 'PEK', name: 'Beijing Capital International', city: 'Pékin', country: 'Chine' },
  { iata: 'PKX', name: 'Beijing Daxing International', city: 'Pékin', country: 'Chine' },
  { iata: 'SHA', name: 'Shanghai Hongqiao International', city: 'Shanghai', country: 'Chine' },
  { iata: 'PVG', name: 'Shanghai Pudong International', city: 'Shanghai', country: 'Chine' },
  { iata: 'CAN', name: 'Guangzhou Baiyun International', city: 'Canton / Guangzhou', country: 'Chine' },
  { iata: 'SZX', name: 'Shenzhen Bao\'an International', city: 'Shenzhen', country: 'Chine' },
  { iata: 'TFU', name: 'Chengdu Tianfu International', city: 'Chengdu', country: 'Chine' },
  { iata: 'CTU', name: 'Chengdu Shuangliu International', city: 'Chengdu', country: 'Chine' },
  { iata: 'CKG', name: 'Chongqing Jiangbei International', city: 'Chongqing', country: 'Chine' },
  { iata: 'KMG', name: 'Kunming Changshui International', city: 'Kunming', country: 'Chine' },
  { iata: 'XIY', name: 'Xi\'an Xianyang International', city: 'Xi\'an', country: 'Chine' },
  { iata: 'HGH', name: 'Hangzhou Xiaoshan International', city: 'Hangzhou', country: 'Chine' },
  { iata: 'HKG', name: 'Hong Kong International (Chek Lap Kok)', city: 'Hong Kong', country: 'Hong Kong' },
  { iata: 'MFM', name: 'Macau International Airport', city: 'Macao', country: 'Macao' },
  { iata: 'TPE', name: 'Taiwan Taoyuan International', city: 'Taipei', country: 'Taïwan' },
  { iata: 'TSA', name: 'Taipei Songshan Airport', city: 'Taipei', country: 'Taïwan' },
  { iata: 'KHH', name: 'Kaohsiung International', city: 'Kaohsiung', country: 'Taïwan' },
  { iata: 'SIN', name: 'Singapore Changi Airport', city: 'Singapour', country: 'Singapour' },
  { iata: 'BKK', name: 'Bangkok Suvarnabhumi Airport', city: 'Bangkok', country: 'Thaïlande' },
  { iata: 'DMK', name: 'Bangkok Don Mueang International', city: 'Bangkok', country: 'Thaïlande' },
  { iata: 'HKT', name: 'Phuket International Airport', city: 'Phuket', country: 'Thaïlande' },
  { iata: 'CNX', name: 'Chiang Mai International', city: 'Chiang Mai', country: 'Thaïlande' },
  { iata: 'USM', name: 'Samui International Airport', city: 'Koh Samui', country: 'Thaïlande' },
  { iata: 'KBV', name: 'Krabi International Airport', city: 'Krabi', country: 'Thaïlande' },
  { iata: 'KUL', name: 'Kuala Lumpur International (KLIA)', city: 'Kuala Lumpur', country: 'Malaisie' },
  { iata: 'PEN', name: 'Penang International Airport', city: 'Penang', country: 'Malaisie' },
  { iata: 'BKI', name: 'Kota Kinabalu International', city: 'Kota Kinabalu / Bornéo', country: 'Malaisie' },
  { iata: 'CGK', name: 'Soekarno-Hatta International (Jakarta)', city: 'Jakarta', country: 'Indonésie' },
  { iata: 'DPS', name: 'Ngurah Rai International (Bali)', city: 'Denpasar / Bali', country: 'Indonésie' },
  { iata: 'SUB', name: 'Juanda International (Surabaya)', city: 'Surabaya', country: 'Indonésie' },
  { iata: 'MNL', name: 'Ninoy Aquino International (Manila)', city: 'Manille', country: 'Philippines' },
  { iata: 'CEB', name: 'Mactan-Cebu International', city: 'Cebu', country: 'Philippines' },
  { iata: 'SGN', name: 'Tan Son Nhat International (Saigon)', city: 'Hô Chi Minh-Ville', country: 'Vietnam' },
  { iata: 'HAN', name: 'Noi Bai International Airport', city: 'Hanoï', country: 'Vietnam' },
  { iata: 'DAD', name: 'Da Nang International Airport', city: 'Đà Nẵng', country: 'Vietnam' },
  { iata: 'PQC', name: 'Phu Quoc International Airport', city: 'Phú Quốc', country: 'Vietnam' },
  { iata: 'REP', name: 'Siem Reap Angkor International', city: 'Siem Reap / Angkor', country: 'Cambodge' },
  { iata: 'PNH', name: 'Phnom Penh International', city: 'Phnom Penh', country: 'Cambodge' },
  { iata: 'VTE', name: 'Wattay International Airport', city: 'Vientiane', country: 'Laos' },
  { iata: 'RGN', name: 'Yangon International Airport', city: 'Rangoun / Yangon', country: 'Birmanie' },

  // --- ASIE DU SUD & CENTRALE ---
  { iata: 'DEL', name: 'Indira Gandhi International', city: 'Delhi / New Delhi', country: 'Inde' },
  { iata: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai / Bombay', country: 'Inde' },
  { iata: 'BLR', name: 'Kempegowda International', city: 'Bangalore', country: 'Inde' },
  { iata: 'MAA', name: 'Chennai International Airport', city: 'Chennai / Madras', country: 'Inde' },
  { iata: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad', country: 'Inde' },
  { iata: 'CCU', name: 'Netaji Subhash Chandra Bose', city: 'Kolkata / Calcutta', country: 'Inde' },
  { iata: 'COK', name: 'Cochin International Airport', city: 'Kochi / Cochin', country: 'Inde' },
  { iata: 'GOI', name: 'Dabolim Airport (Goa)', city: 'Goa', country: 'Inde' },
  { iata: 'GOX', name: 'Manohar International (Mopa, Goa)', city: 'Goa', country: 'Inde' },
  { iata: 'AMD', name: 'Sardar Vallabhbhai Patel', city: 'Ahmedabad', country: 'Inde' },
  { iata: 'CMB', name: 'Bandaranaike International', city: 'Colombo', country: 'Sri Lanka' },
  { iata: 'MLE', name: 'Velana International Airport (Malé)', city: 'Malé / Maldives', country: 'Maldives' },
  { iata: 'DAC', name: 'Hazrat Shahjalal International', city: 'Dacca', country: 'Bangladesh' },
  { iata: 'KTM', name: 'Tribhuvan International Airport', city: 'Katmandou', country: 'Népal' },
  { iata: 'ISB', name: 'Islamabad International Airport', city: 'Islamabad', country: 'Pakistan' },
  { iata: 'KHI', name: 'Jinnah International Airport', city: 'Karachi', country: 'Pakistan' },
  { iata: 'LHE', name: 'Allama Iqbal International', city: 'Lahore', country: 'Pakistan' },
  { iata: 'TAS', name: 'Islam Karimov Tashkent International', city: 'Tachkent', country: 'Ouzbékistan' },
  { iata: 'ALA', name: 'Almaty International Airport', city: 'Almaty', country: 'Kazakhstan' },

  // --- AMÉRIQUE LATINE & CARAÏBES ---
  { iata: 'MEX', name: 'Mexico City Benito Juárez International', city: 'Mexico', country: 'Mexique' },
  { iata: 'CUN', name: 'Cancún International Airport', city: 'Cancún', country: 'Mexique' },
  { iata: 'GDL', name: 'Guadalajara International', city: 'Guadalajara', country: 'Mexique' },
  { iata: 'MTY', name: 'Monterrey International Airport', city: 'Monterrey', country: 'Mexique' },
  { iata: 'TIJ', name: 'Tijuana International Airport', city: 'Tijuana', country: 'Mexique' },
  { iata: 'SJD', name: 'Los Cabos International Airport', city: 'San José del Cabo / Cabo', country: 'Mexique' },
  { iata: 'PVR', name: 'Puerto Vallarta Licenciado Gustavo Díaz Ordaz', city: 'Puerto Vallarta', country: 'Mexique' },
  { iata: 'MID', name: 'Manuel Crescencio Rejón (Mérida)', city: 'Mérida', country: 'Mexique' },
  { iata: 'PTY', name: 'Tocumen International Airport', city: 'Panama City', country: 'Panama' },
  { iata: 'SJO', name: 'Juan Santamaría International', city: 'San José', country: 'Costa Rica' },
  { iata: 'SAL', name: 'Monseñor Óscar Arnulfo Romero', city: 'San Salvador', country: 'Salvador' },
  { iata: 'GUA', name: 'La Aurora International Airport', city: 'Guatemala City', country: 'Guatemala' },
  { iata: 'BZE', name: 'Philip S.W. Goldson International', city: 'Belize City', country: 'Belize' },
  { iata: 'PUJ', name: 'Punta Cana International Airport', city: 'Punta Cana', country: 'République Dominicaine' },
  { iata: 'SDQ', name: 'Las Américas International', city: 'Saint-Domingue', country: 'République Dominicaine' },
  { iata: 'SJU', name: 'Luis Muñoz Marín International', city: 'San Juan', country: 'Porto Rico' },
  { iata: 'HAV', name: 'José Martí International Airport', city: 'La Havane', country: 'Cuba' },
  { iata: 'VRA', name: 'Juan Gualberto Gómez (Varadero)', city: 'Varadero', country: 'Cuba' },
  { iata: 'MBJ', name: 'Sangster International Airport', city: 'Montego Bay', country: 'Jamaïque' },
  { iata: 'KIN', name: 'Norman Manley International', city: 'Kingston', country: 'Jamaïque' },
  { iata: 'NAS', name: 'Lynden Pindling International', city: 'Nassau', country: 'Bahamas' },
  { iata: 'BGI', name: 'Grantley Adams International', city: 'Bridgetown', country: 'Barbade' },
  { iata: 'SXM', name: 'Princess Juliana International', city: 'Philipsburg / Saint-Martin', country: 'Saint-Martin' },
  { iata: 'CUR', name: 'Curaçao International Airport', city: 'Willemstad / Curaçao', country: 'Curaçao' },
  { iata: 'AUA', name: 'Queen Beatrix International', city: 'Oranjestad / Aruba', country: 'Aruba' },
  { iata: 'POS', name: 'Piarco International Airport', city: 'Port d\'Espagne', country: 'Trinité-et-Tobago' },

  // --- AMÉRIQUE DU SUD ---
  { iata: 'GRU', name: 'São Paulo/Guarulhos International', city: 'São Paulo', country: 'Brésil' },
  { iata: 'CGH', name: 'São Paulo/Congonhas Airport', city: 'São Paulo', country: 'Brésil' },
  { iata: 'VCP', name: 'Viracopos International Airport', city: 'Campinas / São Paulo', country: 'Brésil' },
  { iata: 'GIG', name: 'Rio de Janeiro/Galeão International', city: 'Rio de Janeiro', country: 'Brésil' },
  { iata: 'SDU', name: 'Santos Dumont Airport', city: 'Rio de Janeiro', country: 'Brésil' },
  { iata: 'BSB', name: 'Brasília International Airport', city: 'Brasília', country: 'Brésil' },
  { iata: 'SSA', name: 'Salvador Bahia International', city: 'Salvador de Bahia', country: 'Brésil' },
  { iata: 'FOR', name: 'Fortaleza Pinto Martins', city: 'Fortaleza', country: 'Brésil' },
  { iata: 'CNF', name: 'Belo Horizonte Confins', city: 'Belo Horizonte', country: 'Brésil' },
  { iata: 'REC', name: 'Recife/Guararapes International', city: 'Recife', country: 'Brésil' },
  { iata: 'POA', name: 'Porto Alegre Salgado Filho', city: 'Porto Alegre', country: 'Brésil' },
  { iata: 'FLN', name: 'Florianópolis Hercílio Luz', city: 'Florianópolis', country: 'Brésil' },
  { iata: 'CWB', name: 'Curitiba Afonso Pena', city: 'Curitiba', country: 'Brésil' },
  { iata: 'EZE', name: 'Ministro Pistarini (Ezeiza)', city: 'Buenos Aires', country: 'Argentine' },
  { iata: 'AEP', name: 'Aeroparque Jorge Newbery', city: 'Buenos Aires', country: 'Argentine' },
  { iata: 'BOG', name: 'El Dorado International Airport', city: 'Bogotá', country: 'Colombie' },
  { iata: 'MDE', name: 'José María Córdova (Medellín)', city: 'Medellín', country: 'Colombie' },
  { iata: 'CTG', name: 'Rafael Núñez International', city: 'Carthagène', country: 'Colombie' },
  { iata: 'CLO', name: 'Alfonso Bonilla Aragón (Cali)', city: 'Cali', country: 'Colombie' },
  { iata: 'SCL', name: 'Arturo Merino Benítez International', city: 'Santiago', country: 'Chili' },
  { iata: 'LIM', name: 'Jorge Chávez International', city: 'Lima', country: 'Pérou' },
  { iata: 'CUZ', name: 'Alejandro Velasco Astete (Cusco)', city: 'Cusco', country: 'Pérou' },
  { iata: 'UIO', name: 'Mariscal Sucre International', city: 'Quito', country: 'Équateur' },
  { iata: 'GYE', name: 'José Joaquín de Olmedo', city: 'Guayaquil', country: 'Équateur' },
  { iata: 'MVD', name: 'Carrasco International Airport', city: 'Montevideo', country: 'Uruguay' },
  { iata: 'ASU', name: 'Silvio Pettirossi International', city: 'Asunción', country: 'Paraguay' },
  { iata: 'LPB', name: 'El Alto International Airport', city: 'La Paz', country: 'Bolivie' },
  { iata: 'VVI', name: 'Viru Viru International Airport', city: 'Santa Cruz', country: 'Bolivie' },
  { iata: 'CCS', name: 'Simón Bolívar International (Maiquetía)', city: 'Caracas', country: 'Venezuela' },

  // --- AFRIQUE ---
  { iata: 'CMN', name: 'Mohammed V International', city: 'Casablanca', country: 'Maroc' },
  { iata: 'RAK', name: 'Marrakech Menara Airport', city: 'Marrakech', country: 'Maroc' },
  { iata: 'AGA', name: 'Agadir Al Massira Airport', city: 'Agadir', country: 'Maroc' },
  { iata: 'TNG', name: 'Tangier Ibn Battouta Airport', city: 'Tanger', country: 'Maroc' },
  { iata: 'FEZ', name: 'Fès Saïss Airport', city: 'Fès', country: 'Maroc' },
  { iata: 'RBA', name: 'Rabat-Salé Airport', city: 'Rabat', country: 'Maroc' },
  { iata: 'OUD', name: 'Oujda Angads Airport', city: 'Oujda', country: 'Maroc' },
  { iata: 'NDR', name: 'Nador Al Aroui Airport', city: 'Nador', country: 'Maroc' },
  { iata: 'TUN', name: 'Tunis-Carthage International', city: 'Tunis', country: 'Tunisie' },
  { iata: 'DJE', name: 'Djerba-Zarzis International', city: 'Djerba', country: 'Tunisie' },
  { iata: 'NBE', name: 'Enfidha-Hammamet International', city: 'Enfidha / Hammamet', country: 'Tunisie' },
  { iata: 'MIR', name: 'Monastir Habib Bourguiba', city: 'Monastir', country: 'Tunisie' },
  { iata: 'ALG', name: 'Houari Boumediene Airport', city: 'Alger', country: 'Algérie' },
  { iata: 'ORN', name: 'Ahmed Ben Bella Airport', city: 'Oran', country: 'Algérie' },
  { iata: 'CZL', name: 'Mohamed Boudiaf International', city: 'Constantine', country: 'Algérie' },
  { iata: 'CAI', name: 'Cairo International Airport', city: 'Le Caire', country: 'Égypte' },
  { iata: 'HRG', name: 'Hurghada International Airport', city: 'Hurghada', country: 'Égypte' },
  { iata: 'SSH', name: 'Sharm El Sheikh International', city: 'Charm el-Cheikh', country: 'Égypte' },
  { iata: 'LXR', name: 'Luxor International Airport', city: 'Louxor', country: 'Égypte' },
  { iata: 'JNB', name: 'O. R. Tambo International', city: 'Johannesbourg', country: 'Afrique du Sud' },
  { iata: 'CPT', name: 'Cape Town International Airport', city: 'Le Cap', country: 'Afrique du Sud' },
  { iata: 'DUR', name: 'King Shaka International', city: 'Durban', country: 'Afrique du Sud' },
  { iata: 'NBO', name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'Kenya' },
  { iata: 'MBA', name: 'Moi International Airport', city: 'Mombasa', country: 'Kenya' },
  { iata: 'ADD', name: 'Addis Ababa Bole International', city: 'Addis-Abeba', country: 'Éthiopie' },
  { iata: 'LOS', name: 'Murtala Muhammed International', city: 'Lagos', country: 'Nigeria' },
  { iata: 'ABV', name: 'Nnamdi Azikiwe International', city: 'Abuja', country: 'Nigeria' },
  { iata: 'ACC', name: 'Kotoka International Airport', city: 'Accra', country: 'Ghana' },
  { iata: 'DSS', name: 'Blaise Diagne International', city: 'Dakar', country: 'Sénégal' },
  { iata: 'ABJ', name: 'Félix-Houphouët-Boigny International', city: 'Abidjan', country: 'Côte d\'Ivoire' },
  { iata: 'DLA', name: 'Douala International Airport', city: 'Douala', country: 'Cameroun' },
  { iata: 'NSI', name: 'Yaoundé Nsimalen International', city: 'Yaoundé', country: 'Cameroun' },
  { iata: 'LBV', name: 'Léon-Mba International Airport', city: 'Libreville', country: 'Gabon' },
  { iata: 'BZV', name: 'Maya-Maya Airport', city: 'Brazzaville', country: 'Congo' },
  { iata: 'FIH', name: 'N\'djili International Airport', city: 'Kinshasa', country: 'RD Congo' },
  { iata: 'LAD', name: 'Quatro de Fevereiro International', city: 'Luanda', country: 'Angola' },
  { iata: 'DAR', name: 'Julius Nyerere International', city: 'Dar es Salaam', country: 'Tanzanie' },
  { iata: 'ZNZ', name: 'Abeid Amani Karume International', city: 'Zanzibar', country: 'Tanzanie' },
  { iata: 'JRO', name: 'Kilimanjaro International', city: 'Kilimandjaro / Arusha', country: 'Tanzanie' },
  { iata: 'MRU', name: 'Sir Seewoosagur Ramgoolam International', city: 'Port-Louis / Île Maurice', country: 'Maurice' },
  { iata: 'SEZ', name: 'Seychelles International Airport', city: 'Mahé / Victoria', country: 'Seychelles' },
  { iata: 'TNR', name: 'Ivato International Airport', city: 'Antananarivo', country: 'Madagascar' },
  { iata: 'NOS', name: 'Fascene Airport (Nosy Be)', city: 'Nosy Be', country: 'Madagascar' },

  // --- OCÉANIE ---
  { iata: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australie' },
  { iata: 'MEL', name: 'Melbourne Tullamarine Airport', city: 'Melbourne', country: 'Australie' },
  { iata: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australie' },
  { iata: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australie' },
  { iata: 'ADL', name: 'Adelaide Airport', city: 'Adélaïde', country: 'Australie' },
  { iata: 'OOL', name: 'Gold Coast Airport', city: 'Gold Coast / Coolangatta', country: 'Australie' },
  { iata: 'CNS', name: 'Cairns Airport', city: 'Cairns', country: 'Australie' },
  { iata: 'DRW', name: 'Darwin International Airport', city: 'Darwin', country: 'Australie' },
  { iata: 'HBA', name: 'Hobart Airport', city: 'Hobart / Tasmanie', country: 'Australie' },
  { iata: 'CBR', name: 'Canberra Airport', city: 'Canberra', country: 'Australie' },
  { iata: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'Nouvelle-Zélande' },
  { iata: 'CHC', name: 'Christchurch International', city: 'Christchurch', country: 'Nouvelle-Zélande' },
  { iata: 'WLG', name: 'Wellington International', city: 'Wellington', country: 'Nouvelle-Zélande' },
  { iata: 'ZQN', name: 'Queenstown Airport', city: 'Queenstown', country: 'Nouvelle-Zélande' },
  { iata: 'NAN', name: 'Nadi International Airport', city: 'Nadi', country: 'Fidji' }
];

// Deduplicate by IATA
const seen = new Set();
const deduped = [];
let id = 1;
for (const a of airports) {
  if (!seen.has(a.iata)) {
    seen.add(a.iata);
    deduped.push({
      id: String(id++),
      iata_code: a.iata,
      iata: a.iata,
      name: a.name,
      city_name: a.city,
      country_name: a.country
    });
  }
}

const fileContent = `export interface AirportItem {
  id: string;
  iata_code: string;
  iata: string;
  name: string;
  city_name: string;
  country_name: string;
}

export const MAJOR_AIRPORTS: AirportItem[] = ${JSON.stringify(deduped, null, 2)};

export function searchAirports(query: string, limit: number = 15): AirportItem[] {
  if (!query || query.trim().length < 2) return [];
  const qClean = query.trim().toUpperCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');

  const exactIata: AirportItem[] = [];
  const cityPrefix: AirportItem[] = [];
  const namePrefix: AirportItem[] = [];
  const cityContains: AirportItem[] = [];
  const nameContains: AirportItem[] = [];
  const countryContains: AirportItem[] = [];

  for (const a of MAJOR_AIRPORTS) {
    const iata = (a.iata_code || '').toUpperCase();
    const city = (a.city_name || '').toUpperCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    const name = (a.name || '').toUpperCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    const country = (a.country_name || '').toUpperCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');

    if (iata === qClean) {
      exactIata.push(a);
    } else if (iata.startsWith(qClean)) {
      exactIata.push(a);
    } else if (city === qClean || city.startsWith(qClean + ' ') || city.startsWith(qClean + '-') || city.startsWith(qClean + '/')) {
      cityPrefix.push(a);
    } else if (city.startsWith(qClean)) {
      cityPrefix.push(a);
    } else if (name.startsWith(qClean)) {
      namePrefix.push(a);
    } else if (city.includes(qClean)) {
      cityContains.push(a);
    } else if (name.includes(qClean)) {
      nameContains.push(a);
    } else if (country.includes(qClean)) {
      countryContains.push(a);
    }
  }

  const combined = [
    ...exactIata,
    ...cityPrefix,
    ...namePrefix,
    ...cityContains,
    ...nameContains,
    ...countryContains
  ];

  const seenIata = new Set<string>();
  const results: AirportItem[] = [];
  for (const item of combined) {
    if (!seenIata.has(item.iata_code)) {
      seenIata.add(item.iata_code);
      results.push(item);
      if (results.length >= limit) break;
    }
  }

  return results;
}
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'airports.ts'), fileContent, 'utf8');
console.log('Successfully generated src/data/airports.ts with ' + deduped.length + ' airports.');
