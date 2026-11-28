// Pin Drop: the TV names a place. Everyone drops a pin on a world map on their phone. The closer the pin, the more
// points. (A where-in-the-world guessing game with our own name, map and look.)
import { esc } from '../ui.js';

export const meta = {
  id: 'pindrop',
  name: 'Pin Drop',
  min: 2,
  max: 20,
  blurb: 'Where in the world is it? Drop a pin on the map. Closest wins.',
  ownReveal: true,   // this game holds its scores back itself until its reveal has played
};

// [what the TV asks about, where it is, latitude, longitude, picture]
export const PLACES = [
  ['the Eiffel Tower', 'Paris, France', 48.858, 2.294, '🗼'],
  ['the Statue of Liberty', 'New York, USA', 40.689, -74.045, '🗽'],
  ['the Great Pyramid of Giza', 'near Cairo, Egypt', 29.979, 31.134, '🔺'],
  ['the Taj Mahal', 'Agra, India', 27.175, 78.042, '🕌'],
  ['the Sydney Opera House', 'Sydney, Australia', -33.857, 151.215, '🎭'],
  ['Big Ben', 'London, England', 51.501, -0.125, '🕰️'],
  ['the Colosseum', 'Rome, Italy', 41.890, 12.492, '🏛️'],
  ['Machu Picchu', 'the Andes, Peru', -13.163, -72.545, '⛰️'],
  ['the Golden Gate Bridge', 'San Francisco, USA', 37.820, -122.478, '🌉'],
  ['Mount Everest', 'Nepal and China', 27.988, 86.925, '🏔️'],
  ['the Grand Canyon', 'Arizona, USA', 36.107, -112.113, '🏜️'],
  ['Niagara Falls', 'Canada and USA', 43.083, -79.074, '💦'],
  ['the Christ the Redeemer statue', 'Rio de Janeiro, Brazil', -22.952, -43.210, '🗿'],
  ['Mount Fuji', 'Japan', 35.361, 138.727, '🗻'],
  ['the Leaning Tower of Pisa', 'Pisa, Italy', 43.723, 10.397, '🏛️'],
  ['Stonehenge', 'Wiltshire, England', 51.179, -1.826, '🪨'],
  ['the Acropolis', 'Athens, Greece', 37.972, 23.726, '🏛️'],
  ['Mount Kilimanjaro', 'Tanzania', -3.068, 37.355, '🏔️'],
  ['Victoria Falls', 'Zambia and Zimbabwe', -17.924, 25.857, '💦'],
  ['the Great Barrier Reef', 'off Queensland, Australia', -18.287, 147.699, '🐠'],
  ['Mount Rushmore', 'South Dakota, USA', 43.879, -103.459, '🗿'],
  ['the Hollywood Sign', 'Los Angeles, USA', 34.134, -118.322, '🎬'],
  ['the Space Needle', 'Seattle, USA', 47.620, -122.349, '🗼'],
  ['the Gateway Arch', 'St. Louis, USA', 38.625, -90.185, '🌈'],
  ['Yellowstone\'s Old Faithful', 'Wyoming, USA', 44.460, -110.828, '♨️'],
  ['the White House', 'Washington, D.C., USA', 38.898, -77.037, '🏛️'],
  ['Walt Disney World', 'near Orlando, Florida, USA', 28.385, -81.564, '🏰'],
  ['the Alamo', 'San Antonio, Texas, USA', 29.426, -98.486, '🤠'],
  ['Chichén Itzá', 'Yucatán, Mexico', 20.684, -88.568, '🔺'],
  ['the Panama Canal', 'Panama', 9.080, -79.680, '🚢'],
  ['the Galápagos Islands', 'Ecuador', -0.830, -91.135, '🐢'],
  ['Easter Island', 'Chile, in the Pacific', -27.113, -109.350, '🗿'],
  ['Angel Falls', 'Venezuela', 5.968, -62.536, '💦'],
  ['the city of Buenos Aires', 'Argentina', -34.604, -58.382, '💃'],
  ['the CN Tower', 'Toronto, Canada', 43.643, -79.387, '🗼'],
  ['the city of Vancouver', 'British Columbia, Canada', 49.283, -123.121, '🏙️'],
  ['the city of Reykjavík', 'Iceland', 64.147, -21.943, '🌋'],
  ['the Brandenburg Gate', 'Berlin, Germany', 52.516, 13.378, '🏛️'],
  ['the Sagrada Família', 'Barcelona, Spain', 41.404, 2.174, '⛪'],
  ['the canals of Venice', 'Venice, Italy', 45.440, 12.316, '🛶'],
  ['the Kremlin', 'Moscow, Russia', 55.752, 37.617, '🏰'],
  ['the Matterhorn', 'Switzerland and Italy', 45.976, 7.658, '🏔️'],
  ['the city of Amsterdam', 'the Netherlands', 52.370, 4.895, '🚲'],
  ['the Little Mermaid statue', 'Copenhagen, Denmark', 55.693, 12.599, '🧜'],
  ['Loch Ness', 'Scotland', 57.323, -4.424, '🦕'],
  ['the Cliffs of Moher', 'Ireland', 52.972, -9.426, '🌊'],
  ['the Hagia Sophia', 'Istanbul, Türkiye', 41.009, 28.980, '🕌'],
  ['Petra', 'Jordan', 30.329, 35.444, '🏜️'],
  ['the Burj Khalifa', 'Dubai, United Arab Emirates', 25.197, 55.274, '🏙️'],
  ['the Dead Sea', 'Israel and Jordan', 31.559, 35.473, '🧂'],
  ['the Great Wall of China near Beijing', 'China', 40.432, 116.570, '🧱'],
  ['the Forbidden City', 'Beijing, China', 39.916, 116.397, '🏯'],
  ['the city of Shanghai', 'China', 31.230, 121.474, '🏙️'],
  ['Tokyo Tower', 'Tokyo, Japan', 35.659, 139.745, '🗼'],
  ['the city of Seoul', 'South Korea', 37.566, 126.978, '🏙️'],
  ['Angkor Wat', 'Cambodia', 13.412, 103.867, '🛕'],
  ['the Petronas Towers', 'Kuala Lumpur, Malaysia', 3.158, 101.712, '🏙️'],
  ['the city of Singapore', 'Singapore', 1.352, 103.820, '🦁'],
  ['Ha Long Bay', 'Vietnam', 20.910, 107.184, '⛵'],
  ['the island of Bali', 'Indonesia', -8.409, 115.189, '🏝️'],
  ['the city of Mumbai', 'India', 19.076, 72.878, '🏙️'],
  ['Uluru', 'the middle of Australia', -25.345, 131.036, '🪨'],
  ['the city of Auckland', 'New Zealand', -36.848, 174.763, '⛵'],
  ['the island of Fiji', 'the South Pacific', -17.713, 178.065, '🏝️'],
  ['Pearl Harbor', 'Hawaii, USA', 21.365, -157.950, '⚓'],
  ['the city of Anchorage', 'Alaska, USA', 61.218, -149.900, '🐻'],
  ['Table Mountain', 'Cape Town, South Africa', -33.963, 18.410, '⛰️'],
  ['the city of Nairobi', 'Kenya', -1.292, 36.822, '🦒'],
  ['the city of Marrakesh', 'Morocco', 31.630, -7.981, '🕌'],
  ['the island of Madagascar', 'off the east coast of Africa', -18.767, 46.869, '🐒'],
  ['Timbuktu', 'Mali', 16.767, -3.003, '🏜️'],
  ['the city of Lagos', 'Nigeria', 6.524, 3.379, '🏙️'],
  ['the South Pole', 'Antarctica', -90, 0, '🐧'],
  ['the North Pole', 'the Arctic Ocean', 90, 0, '🎅'],
  ['the city of Nuuk', 'the capital of Greenland', 64.175, -51.739, '🧊'],
  ['the island of Jamaica', 'the Caribbean', 18.110, -77.298, '🏝️'],
  ['Havana', 'Cuba', 23.114, -82.367, '🚗'],
  ['the Amazon River\'s mouth', 'northern Brazil', -0.170, -50.000, '🌴'],
  ['the city of Lima', 'Peru', -12.046, -77.043, '🏙️'],
  ['Lake Baikal', 'Siberia, Russia', 53.500, 108.000, '🐟'],
  // --- United States ---
  ['the city of Chicago', 'Illinois, USA', 41.878, -87.630, '🏙️'],
  ['the city of Miami', 'Florida, USA', 25.762, -80.192, '🌴'],
  ['the Las Vegas Strip', 'Nevada, USA', 36.115, -115.173, '🎰'],
  ['the city of New Orleans', 'Louisiana, USA', 29.951, -90.072, '🎷'],
  ['the city of Boston', 'Massachusetts, USA', 42.360, -71.059, '🦞'],
  ['the city of Denver', 'Colorado, USA', 39.739, -104.990, '🏔️'],
  ['the city of Nashville', 'Tennessee, USA', 36.163, -86.782, '🎸'],
  ['the city of Atlanta', 'Georgia, USA', 33.749, -84.388, '🍑'],
  ['the city of Dallas', 'Texas, USA', 32.777, -96.797, '🤠'],
  ['the city of Houston', 'Texas, USA', 29.760, -95.370, '🚀'],
  ['the city of Phoenix', 'Arizona, USA', 33.448, -112.074, '🌵'],
  ['the city of Minneapolis', 'Minnesota, USA', 44.978, -93.265, '❄️'],
  ['the city of Detroit', 'Michigan, USA', 42.331, -83.046, '🚗'],
  ['the city of Philadelphia', 'Pennsylvania, USA', 39.953, -75.165, '🔔'],
  ['the city of Salt Lake City', 'Utah, USA', 40.761, -111.891, '🧂'],
  ['the city of Portland', 'Oregon, USA', 45.515, -122.679, '🌲'],
  ['the city of San Diego', 'California, USA', 32.716, -117.161, '🏖️'],
  ['the city of Honolulu', 'Hawaii, USA', 21.307, -157.858, '🌺'],
  ['Kennedy Space Center', 'Florida, USA', 28.573, -80.649, '🚀'],
  ['the Everglades', 'Florida, USA', 25.286, -80.899, '🐊'],
  ['Key West', 'Florida, USA', 24.555, -81.780, '🏝️'],
  ['Yosemite National Park', 'California, USA', 37.865, -119.538, '🏞️'],
  ['Death Valley', 'California, USA', 36.505, -117.079, '🏜️'],
  ['Lake Tahoe', 'California and Nevada, USA', 39.097, -120.032, '🏞️'],
  ['Crater Lake', 'Oregon, USA', 42.944, -122.109, '🌋'],
  ['Mount St. Helens', 'Washington, USA', 46.191, -122.195, '🌋'],
  ['Glacier National Park', 'Montana, USA', 48.760, -113.787, '🏔️'],
  ['Denali', 'Alaska, USA', 63.069, -151.007, '🏔️'],
  ['the Hoover Dam', 'Nevada and Arizona, USA', 36.016, -114.738, '🏗️'],
  ['Monument Valley', 'Arizona and Utah, USA', 36.998, -110.098, '🏜️'],
  ['Mammoth Cave', 'Kentucky, USA', 37.187, -86.100, '🦇'],
  ['the Great Smoky Mountains', 'Tennessee and North Carolina, USA', 35.612, -83.490, '⛰️'],
  ['the Outer Banks', 'North Carolina, USA', 35.558, -75.467, '🏖️'],
  ['Cape Cod', 'Massachusetts, USA', 41.669, -70.296, '🦀'],
  ['Acadia National Park', 'Maine, USA', 44.339, -68.273, '🌲'],
  ['Mackinac Island', 'Michigan, USA', 45.849, -84.619, '🚲'],
  ['the Mall of America', 'Minnesota, USA', 44.855, -93.242, '🛍️'],
  ['Graceland', 'Memphis, Tennessee, USA', 35.048, -90.026, '🎤'],
  ['the Indianapolis Motor Speedway', 'Indiana, USA', 39.795, -86.235, '🏁'],
  ['Churchill Downs', 'Louisville, Kentucky, USA', 38.203, -85.770, '🐎'],
  ['Colonial Williamsburg', 'Virginia, USA', 37.271, -76.708, '🎩'],
  ['Virginia Beach', 'Virginia, USA', 36.853, -75.978, '🏖️'],
  ['the Liberty Bell', 'Philadelphia, USA', 39.950, -75.150, '🔔'],
  ['Carlsbad Caverns', 'New Mexico, USA', 32.148, -104.557, '🦇'],
  ['the Badlands', 'South Dakota, USA', 43.855, -102.340, '🏜️'],
  ['Devils Tower', 'Wyoming, USA', 44.590, -104.715, '🗿'],
  ['Arches National Park', 'Utah, USA', 38.733, -109.593, '🏜️'],
  ['the Mississippi River\'s mouth', 'Louisiana, USA', 29.150, -89.250, '🌊'],
  ['the island of Puerto Rico', 'the Caribbean', 18.221, -66.590, '🏝️'],
  ['the island of Guam', 'the western Pacific', 13.444, 144.794, '🏝️'],
  // --- Canada, Mexico, Central America, Caribbean ---
  ['the city of Montreal', 'Quebec, Canada', 45.502, -73.567, '🥯'],
  ['Quebec City', 'Quebec, Canada', 46.813, -71.208, '🏰'],
  ['Banff', 'Alberta, Canada', 51.178, -115.571, '🏔️'],
  ['the city of Calgary', 'Alberta, Canada', 51.045, -114.057, '🤠'],
  ['the city of Halifax', 'Nova Scotia, Canada', 44.649, -63.575, '⚓'],
  ['Hudson Bay', 'northern Canada', 60.000, -85.000, '🧊'],
  ['Mexico City', 'Mexico', 19.433, -99.133, '🌮'],
  ['Cancún', 'Mexico', 21.161, -86.851, '🏖️'],
  ['Cabo San Lucas', 'Baja California, Mexico', 22.890, -109.917, '🐋'],
  ['the city of Guadalajara', 'Mexico', 20.660, -103.350, '🎺'],
  ['the city of San José', 'the capital of Costa Rica', 9.928, -84.091, '🦥'],
  ['the island of Barbados', 'the Caribbean', 13.194, -59.543, '🏝️'],
  ['Nassau', 'the Bahamas', 25.047, -77.355, '🐚'],
  ['the island of Aruba', 'the Caribbean', 12.521, -69.968, '🏝️'],
  ['the city of Santo Domingo', 'Dominican Republic', 18.486, -69.931, '⚾'],
  // --- South America ---
  ['the city of Rio de Janeiro', 'Brazil', -22.907, -43.173, '🎉'],
  ['the city of São Paulo', 'Brazil', -23.551, -46.633, '🏙️'],
  ['Iguazú Falls', 'Argentina and Brazil', -25.695, -54.437, '💦'],
  ['the city of Bogotá', 'Colombia', 4.711, -74.072, '☕'],
  ['the city of Santiago', 'Chile', -33.449, -70.669, '🏔️'],
  ['Cape Horn', 'the southern tip of South America', -55.980, -67.270, '⛵'],
  ['Lake Titicaca', 'Peru and Bolivia', -15.840, -69.330, '🛶'],
  ['the Atacama Desert', 'northern Chile', -23.860, -69.130, '🏜️'],
  ['the city of Caracas', 'Venezuela', 10.480, -66.904, '🏙️'],
  ['the city of Quito', 'Ecuador', -0.181, -78.468, '🌋'],
  ['the city of Montevideo', 'Uruguay', -34.901, -56.165, '⚽'],
  ['the Falkland Islands', 'the South Atlantic', -51.796, -59.524, '🐧'],
  ['the city of Manaus', 'the Amazon, Brazil', -3.119, -60.022, '🌴'],
  // --- Europe ---
  ['the city of Madrid', 'Spain', 40.417, -3.704, '💃'],
  ['the city of Lisbon', 'Portugal', 38.722, -9.139, '🚋'],
  ['the city of Dublin', 'Ireland', 53.350, -6.260, '🍀'],
  ['the city of Edinburgh', 'Scotland', 55.953, -3.188, '🏰'],
  ['the city of Brussels', 'Belgium', 50.850, 4.352, '🧇'],
  ['the city of Vienna', 'Austria', 48.208, 16.373, '🎻'],
  ['the city of Prague', 'Czechia', 50.076, 14.438, '🏰'],
  ['the city of Budapest', 'Hungary', 47.498, 19.040, '♨️'],
  ['the city of Warsaw', 'Poland', 52.230, 21.012, '🏙️'],
  ['the city of Stockholm', 'Sweden', 59.329, 18.069, '👑'],
  ['the city of Oslo', 'Norway', 59.914, 10.752, '⛷️'],
  ['the city of Helsinki', 'Finland', 60.170, 24.938, '🧖'],
  ['the city of Zurich', 'Switzerland', 47.377, 8.542, '⌚'],
  ['the city of Munich', 'Germany', 48.135, 11.582, '🥨'],
  ['Neuschwanstein Castle', 'Bavaria, Germany', 47.558, 10.750, '🏰'],
  ['Mont Blanc', 'France and Italy', 45.833, 6.865, '🏔️'],
  ['the Palace of Versailles', 'near Paris, France', 48.805, 2.120, '👑'],
  ['Mont-Saint-Michel', 'Normandy, France', 48.636, -1.511, '🏰'],
  ['the city of Nice', 'the French Riviera, France', 43.710, 7.262, '🏖️'],
  ['Monaco', 'on the Mediterranean', 43.738, 7.425, '🏎️'],
  ['the Rock of Gibraltar', 'the southern tip of Spain', 36.144, -5.353, '🐒'],
  ['the Alhambra', 'Granada, Spain', 37.176, -3.588, '🏰'],
  ['the island of Ibiza', 'Spain', 38.907, 1.421, '🏝️'],
  ['Pompeii', 'near Naples, Italy', 40.749, 14.485, '🌋'],
  ['the city of Florence', 'Italy', 43.770, 11.256, '🎨'],
  ['the city of Milan', 'Italy', 45.464, 9.190, '👗'],
  ['the island of Sicily', 'Italy', 37.600, 14.015, '🍋'],
  ['Vatican City', 'inside Rome, Italy', 41.902, 12.453, '⛪'],
  ['the island of Santorini', 'Greece', 36.393, 25.461, '🏝️'],
  ['the island of Crete', 'Greece', 35.240, 24.810, '🏝️'],
  ['the city of Dubrovnik', 'Croatia', 42.651, 18.094, '🏰'],
  ['the city of St. Petersburg', 'Russia', 59.931, 30.360, '🎭'],
  ['the city of Kyiv', 'Ukraine', 50.450, 30.524, '🌻'],
  ['the White Cliffs of Dover', 'England', 51.135, 1.360, '🌊'],
  ['the city of Liverpool', 'England', 53.408, -2.992, '🎸'],
  ['the Giant\'s Causeway', 'Northern Ireland', 55.241, -6.512, '🪨'],
  ['the island of Malta', 'the Mediterranean', 35.937, 14.375, '🏝️'],
  ['the island of Cyprus', 'the Mediterranean', 35.126, 33.430, '🏝️'],
  ['the city of Bergen', 'on the fjords of Norway', 60.391, 5.322, '⛰️'],
  ['Rovaniemi, the Santa Claus village', 'Lapland, northern Finland', 66.503, 25.727, '🦌'],
  // --- Africa ---
  ['the city of Cairo', 'Egypt', 30.044, 31.236, '🏙️'],
  ['the Suez Canal', 'Egypt', 30.585, 32.265, '🚢'],
  ['the city of Casablanca', 'Morocco', 33.573, -7.590, '🕌'],
  ['the middle of the Sahara Desert', 'southern Algeria', 22.785, 5.523, '🏜️'],
  ['the city of Tunis', 'Tunisia', 36.806, 10.181, '🏛️'],
  ['the city of Dakar', 'Senegal', 14.716, -17.467, '🌊'],
  ['the city of Accra', 'Ghana', 5.604, -0.187, '🥁'],
  ['the city of Addis Ababa', 'Ethiopia', 9.030, 38.740, '☕'],
  ['the Serengeti', 'Tanzania', -2.333, 34.833, '🦁'],
  ['Lake Victoria', 'East Africa', -1.000, 33.000, '🐟'],
  ['the island of Zanzibar', 'Tanzania', -6.165, 39.202, '🏝️'],
  ['the city of Johannesburg', 'South Africa', -26.204, 28.047, '💎'],
  ['the Cape of Good Hope', 'South Africa', -34.357, 18.474, '⛵'],
  ['the Okavango Delta', 'Botswana', -19.290, 22.900, '🐘'],
  ['the Namib Desert', 'Namibia', -24.730, 15.290, '🏜️'],
  ['the city of Kinshasa', 'DR Congo', -4.441, 15.266, '🏙️'],
  ['the island of Mauritius', 'the Indian Ocean', -20.348, 57.552, '🏝️'],
  ['the Seychelles', 'the Indian Ocean', -4.680, 55.492, '🏝️'],
  ['the Canary Islands', 'Spain, off northwest Africa', 28.292, -16.629, '🏝️'],
  // --- Middle East and Asia ---
  ['the city of Jerusalem', 'Israel', 31.768, 35.214, '🕍'],
  ['the city of Mecca', 'Saudi Arabia', 21.389, 39.858, '🕋'],
  ['the city of Riyadh', 'Saudi Arabia', 24.713, 46.675, '🏙️'],
  ['the city of Doha', 'Qatar', 25.285, 51.531, '🏙️'],
  ['the city of Tehran', 'Iran', 35.689, 51.389, '🏙️'],
  ['the city of Baghdad', 'Iraq', 33.315, 44.366, '🏙️'],
  ['Cappadocia', 'Türkiye', 38.643, 34.829, '🎈'],
  ['the city of Delhi', 'India', 28.614, 77.209, '🏙️'],
  ['the city of Kolkata', 'India', 22.573, 88.364, '🏙️'],
  ['the city of Bengaluru', 'India', 12.972, 77.595, '💻'],
  ['the island of Sri Lanka', 'south of India', 7.873, 80.772, '🐘'],
  ['the Maldives', 'the Indian Ocean', 4.175, 73.509, '🏝️'],
  ['the city of Kathmandu', 'Nepal', 27.717, 85.324, '🏔️'],
  ['the city of Karachi', 'Pakistan', 24.861, 67.010, '🏙️'],
  ['the city of Dhaka', 'Bangladesh', 23.810, 90.413, '🏙️'],
  ['the city of Bangkok', 'Thailand', 13.756, 100.502, '🛺'],
  ['the island of Phuket', 'Thailand', 7.880, 98.392, '🏝️'],
  ['Ho Chi Minh City', 'Vietnam', 10.823, 106.630, '🛵'],
  ['the city of Hanoi', 'Vietnam', 21.028, 105.854, '🍜'],
  ['the city of Manila', 'the Philippines', 14.600, 120.984, '🏙️'],
  ['the city of Jakarta', 'Indonesia', -6.209, 106.846, '🏙️'],
  ['the island of Borneo', 'Southeast Asia', 0.960, 114.555, '🦧'],
  ['Hong Kong', 'China', 22.320, 114.169, '🏙️'],
  ['the Terracotta Army', 'Xi\'an, China', 34.384, 109.278, '🗿'],
  ['the city of Chengdu', 'China', 30.573, 104.066, '🐼'],
  ['the city of Lhasa', 'Tibet', 29.652, 91.172, '🏔️'],
  ['the city of Taipei', 'Taiwan', 25.033, 121.565, '🏙️'],
  ['the city of Kyoto', 'Japan', 35.012, 135.768, '⛩️'],
  ['the city of Osaka', 'Japan', 34.694, 135.502, '🏯'],
  ['Hiroshima', 'Japan', 34.385, 132.455, '🕊️'],
  ['the city of Sapporo', 'Hokkaido, Japan', 43.062, 141.354, '⛄'],
  ['the city of Ulaanbaatar', 'Mongolia', 47.886, 106.906, '🐎'],
  ['the city of Vladivostok', 'far eastern Russia', 43.115, 131.885, '🚂'],
  ['the Kamchatka Peninsula', 'far eastern Russia', 56.000, 160.000, '🌋'],
  ['the city of Tashkent', 'Uzbekistan', 41.299, 69.240, '🕌'],
  ['the city of Almaty', 'Kazakhstan', 43.222, 76.851, '🏔️'],
  ['the Caspian Sea', 'between Europe and Asia', 41.700, 50.700, '🌊'],
  ['the Aral Sea', 'Kazakhstan and Uzbekistan', 45.000, 60.000, '🏜️'],
  // --- Oceania and the far corners ---
  ['the city of Melbourne', 'Australia', -37.814, 144.963, '🎾'],
  ['the city of Perth', 'Western Australia', -31.951, 115.861, '🦘'],
  ['the city of Brisbane', 'Australia', -27.470, 153.026, '🐨'],
  ['the island of Tasmania', 'Australia', -42.000, 146.600, '😈'],
  ['the city of Darwin', 'northern Australia', -12.463, 130.845, '🐊'],
  ['the city of Wellington', 'New Zealand', -41.287, 174.776, '🥝'],
  ['Queenstown', 'New Zealand', -45.031, 168.663, '🪂'],
  ['the city of Port Moresby', 'the capital of Papua New Guinea', -9.443, 147.180, '🦜'],
  ['the island of Tahiti', 'French Polynesia', -17.651, -149.426, '🏝️'],
  ['the island of Samoa', 'the South Pacific', -13.759, -172.105, '🏝️'],
  ['Bora Bora', 'French Polynesia', -16.500, -151.741, '🏝️'],
  ['the Mariana Trench', 'the western Pacific', 11.350, 142.200, '🌊'],
  ['the island of Bermuda', 'the North Atlantic', 32.307, -64.750, '🔺'],
  ['the Azores', 'Portugal, in the mid-Atlantic', 37.741, -25.676, '🏝️'],
  ['Svalbard', 'Norway, in the Arctic', 78.223, 15.647, '🐻‍❄️'],
  ['the Faroe Islands', 'the North Atlantic', 62.008, -6.790, '🐑'],
  ['McMurdo Station', 'Antarctica', -77.846, 166.668, '🐧'],
];

export const TIMES = { place: 35000, after: 7000 };
const ROUNDS = 8, MILES = 0.621371;
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
// Distance over the globe between two points, in kilometres.
export function km(lat1, lon1, lat2, lon2) {
  const r = Math.PI / 180, a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}
// 1,000 for a bullseye (within about 60 miles), falling to nothing at 5,000 km (about 3,100 miles) away.
export const pointsFor = d => (d <= 100 ? 1000 : Math.round((1000 * Math.max(0, 1 - d / 5000) ** 1.6) / 10) * 10);
const miles = d => Math.round((d * MILES) / (d * MILES >= 100 ? 10 : 1)) * (d * MILES >= 100 ? 10 : 1);

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const used = new Set(prev?.usedPlaces || []);
  let pool = PLACES.map((_, i) => i).filter(i => !used.has(i));
  const n = opts.short ? 5 : ROUNDS;
  if (pool.length < n) { used.clear(); pool = PLACES.map((_, i) => i); }
  const order = shuffle(pool, rnd).slice(0, n);
  return {
    game: 'pindrop', players: players.map(p => ({ pid: p.pid, name: p.name })), round: 0,
    scores: Object.fromEntries(players.map(p => [p.pid, 0])),
    order, i: 0, pins: {}, result: null, settled: false, settleAt: 0,
    usedPlaces: [...used, ...order],
    phase: 'place', deadline: Date.now() + TIMES.place,
  };
}
const place = s => PLACES[s.order[s.i]];

// The reveal on the TV: pins land one at a time, farthest first; then the real spot; then the distances.
export const revealMs = n => 1200 + n * 420 + 1800;
function reveal(s, now) {
  const [, , lat, lon] = place(s), before = { ...s.scores };
  const rows = s.players.map(p => { const pin = s.pins[p.pid]; const d = pin ? km(lat, lon, pin[1], pin[0]) : null; return { pid: p.pid, d, pts: d === null ? 0 : pointsFor(d) }; });
  rows.forEach(r => (s.scores[r.pid] += r.pts));
  s.result = { rows, before };
  s.settled = false; s.settleAt = now + revealMs(rows.filter(r => r.d !== null).length);
  s.phase = 'reveal'; s.round++; s.deadline = s.settleAt + TIMES.after;
}
function next(s, now) {
  if (s.i + 1 >= s.order.length) { s.phase = 'over'; s.round++; s.deadline = 0; return; }
  s.i++; s.pins = {}; s.result = null; s.settled = false; s.phase = 'place'; s.round++; s.deadline = now + TIMES.place;
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || !s.players.some(p => p.pid === pid)) return s;
  if (s.phase === 'place' && a.type === 'pin' && !s.pins[pid]) {
    const lon = Number(a.lon), lat = Number(a.lat);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return s;
    s.pins[pid] = [Math.max(-180, Math.min(180, lon)), Math.max(-90, Math.min(90, lat))];
    if (s.players.every(p => s.pins[p.pid])) reveal(s, now);
  }
  return s;
}
export function hostAct(s, a, now = Date.now()) {
  if (a !== 'next') return s;
  if (s.phase === 'place') reveal(s, now);
  else if (s.phase === 'reveal') next(s, now);
  return s;
}
export function tick(s, now = Date.now()) {
  if (s.phase === 'reveal' && !s.settled && now >= s.settleAt) { s.settled = true; return s; }   // the reveal has played: scores and phones catch up
  return s.deadline && now >= s.deadline ? hostAct(s, 'next', now) : s;
}

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
export function narration(s) {
  if (s.phase === 'place' && s.i === 0) return 'Welcome to Pin Drop! Drop your pin on the map. Closest wins.';
  if (s.phase === 'over') return 'That\'s the whole world tour. Thanks for playing!';
  return '';
}
export function cue(s) {
  if (s.phase === 'place') return { sound: 'join', wait: 700, title: s.i === 0 ? 'Pin Drop' : `Place ${s.i + 1}`, sub: s.i === 0 ? 'Where in the world?' : `of ${s.order.length}` };
  if (s.phase === 'reveal') return s.settled ? null : { sound: 'drumroll', wait: 0 };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} knows the world`, tone: 'dawn', fx: 'confetti' };
  return null;
}

export function botAct(v, rnd = Math.random) {
  if (v.phase !== 'place' || v.pinned || !v._t) return null;
  const spread = 4 + rnd() * 34, ang = rnd() * Math.PI * 2;
  return { type: 'pin', lon: v._t[0] + Math.cos(ang) * spread * 1.3, lat: Math.max(-85, Math.min(85, v._t[1] + Math.sin(ang) * spread)) };
}

export function tvView(s, now = Date.now()) {
  const p = place(s);
  const v = { phase: s.phase, n: s.i + 1, of: s.order.length, what: p[0], icon: p[4], left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), scores: ranking(s) };
  if (s.phase === 'place') v.players = s.players.map(x => ({ name: x.name, done: !!s.pins[x.pid] }));
  if (s.phase === 'reveal') {
    v.where = p[1]; v.target = [p[3], p[2]]; v.settled = !!s.settled;
    v.pins = s.result.rows.filter(r => r.d !== null).sort((a, b) => b.d - a.d).map(r => ({ name: nameOf(s, r.pid), at: s.pins[r.pid], mi: miles(r.d), pts: r.pts }));
    v.missed = s.result.rows.filter(r => r.d === null).map(r => nameOf(s, r.pid));
    if (!s.settled) v.scores = s.players.map(x => ({ pid: x.pid, name: x.name, score: s.result.before[x.pid] })).sort((a, b) => b.score - a.score);
  }
  return v;
}
export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const p = place(s), v = { phase: s.phase, n: s.i + 1, of: s.order.length, what: p[0], icon: p[4], score: s.scores[pid] };
  if (s.phase === 'place') { v.pinned = !!s.pins[pid]; if (String(pid).startsWith('bot-')) v._t = [p[3], p[2]]; }
  if (s.phase === 'reveal') { v.settled = !!s.settled; if (s.settled) { const r = s.result.rows.find(x => x.pid === pid); v.where = p[1]; v.mi = r && r.d !== null ? miles(r.d) : null; v.pts = r ? r.pts : 0; } }
  if (s.phase === 'over') { const r = ranking(s); v.rank = r.findIndex(x => x.pid === pid) + 1; v.winner = r[0].name; }
  return v;
}

// ---------- the map ----------
// The map data is large, so it is fetched the first time a map is drawn; whoever asked gets redrawn when it lands.
let MAP = null, waiting = [];
function needMap(redraw) { if (MAP) return true; if (redraw) waiting.push(redraw); if (waiting.loading) return false; waiting.loading = true; import('./worldmap.js').then(m => { MAP = m; const w = waiting; waiting = []; w.forEach(f => { try { f(); } catch {} }); }).catch(() => { waiting.loading = false; }); return false; }
const X = lon => ((lon + 180) / 360) * 1000, Y = lat => ((90 - lat) / 180) * 500;
// box = [x, y, w, h] in map units; `inside` is extra SVG drawn on top (pins, the target).
const mapSvg = (box, inside = '', cls = '') => `<svg class="pdmap ${cls}" viewBox="${box.map(n => +n.toFixed(1)).join(' ')}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><rect x="-10" y="-10" width="1020" height="520" class="pdsea"/><path class="pdland" d="${MAP.LAND}"/><path class="pdborder" d="${MAP.BORDERS}"/>${inside}</svg>`;
// A 2:1 box around some points, with room to spare, never smaller than a continent and never past the map's edge.
function boxAround(points) {
  const xs = points.map(p => X(p[0])), ys = points.map(p => Y(p[1]));
  let w = Math.max(260, (Math.max(...xs) - Math.min(...xs)) * 1.5, (Math.max(...ys) - Math.min(...ys)) * 3);
  if (w >= 860) return [0, 0, 1000, 500];
  const h = w / 2, cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  return [Math.max(0, Math.min(1000 - w, cx - w / 2)), Math.max(0, Math.min(500 - h, cy - h / 2)), w, h];
}

// ---------- renderers ----------
const COLORS = ['#ff5d73', '#ffb020', '#3ddc97', '#4cc9f0', '#b388ff', '#ff8fab', '#f9f871', '#7bdff2', '#f4a261', '#90be6d'];
let revealKey = '', revealAt = 0, revealTimers = [];
export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  const ready = needMap(() => { if (el.isConnected && el.querySelector('.pdwait')) renderTV(v, el); });
  let h = '';
  if (v.phase === 'place') {
    h = `<p class="cat">Place ${v.n} of ${v.of}</p><div class="pdq"><span>${v.icon}</span><div><small>Where in the world is</small><b>${esc(v.what)}?</b></div><em class="clock ${v.left <= 8 ? 'hurry' : ''}">${v.left}</em></div>
      ${ready ? mapSvg([0, 0, 1000, 500]) : '<div class="pdwait">Unrolling the map…</div>'}
      <div class="roster">${v.players.map(p => `<div class="chip ${p.done ? '' : 'waiting'}">${esc(p.name)}${p.done ? ' ✓' : ''}</div>`).join('')}</div>
      <p class="muted center">Drop your pin on your phone, then lock it in.</p><button class="btn ghost" data-host="next">Show the answer</button>`;
  }
  if (v.phase === 'reveal') {
    const key = 'r' + v.n, first = key !== revealKey;
    if (first) { revealKey = key; revealAt = Date.now(); revealTimers.forEach(clearTimeout); revealTimers = []; }
    const el0 = Date.now() - revealAt, n = v.pins.length, tAt = 1200 + n * 420;   // a redraw part-way through carries on from where the reveal is
    const box = boxAround([v.target, ...v.pins.map(p => p.at)]), u = box[2] / 1000;   // u: one screen unit at this zoom
    const pins = v.pins.map((p, k) => { const x = X(p.at[0]), y = Y(p.at[1]), c = COLORS[k % COLORS.length], d = 1200 + k * 420 - el0;
      return `<g class="pdpin" style="animation-delay:${d}ms"><line x1="${x}" y1="${y}" x2="${X(v.target[0])}" y2="${Y(v.target[1])}" class="pdline" style="animation-delay:${tAt + 300 - el0}ms" stroke="${c}" stroke-width="${2.2 * u}" stroke-dasharray="${7 * u} ${6 * u}"/><circle cx="${x}" cy="${y}" r="${9 * u}" fill="${c}" stroke="#fff" stroke-width="${2.5 * u}"/><text x="${x}" y="${y - 14 * u}" font-size="${17 * u}" text-anchor="middle" class="pdname">${esc(p.name)}</text></g>`; }).join('');
    const tx = X(v.target[0]), ty = Y(v.target[1]);
    const target = `<g class="pdtarget" style="animation-delay:${tAt - el0}ms"><circle cx="${tx}" cy="${ty}" r="${30 * u}" class="pdring"/><circle cx="${tx}" cy="${ty}" r="${11 * u}" fill="#fff" stroke="#12203c" stroke-width="${3 * u}"/><text x="${tx}" y="${ty + 7 * u}" font-size="${17 * u}" text-anchor="middle">⭐</text></g>`;
    const board = [...v.pins].reverse().slice(0, 5).map((p, k) => `<div class="pdrow ${k === 0 ? 'best' : ''}" style="animation-delay:${tAt + 700 + k * 160 - el0}ms"><b>${esc(p.name)}</b><span>${p.mi.toLocaleString()} mi</span><em>+${p.pts.toLocaleString()}</em></div>`).join('');
    h = `<p class="cat">Place ${v.n} of ${v.of}</p><div class="pdq small"><span>${v.icon}</span><div><small>${esc(v.what[0].toUpperCase() + v.what.slice(1))}</small><b class="pdwhere" style="animation-delay:${tAt - el0}ms">${esc(v.where)}</b></div></div>
      <div class="pdreveal">${ready ? mapSvg(box, pins + target, 'zoomed') : '<div class="pdwait">Unrolling the map…</div>'}<div class="pdboard">${board}${v.missed.length ? `<p class="pdmiss" style="animation-delay:${tAt + 900 - el0}ms">No pin: ${v.missed.map(esc).join(', ')}</p>` : ''}</div></div><button class="btn" data-host="next">Next place</button>`;
    if (first) import('../sfx.js').then(m => {
      const at = (ms, fn) => revealTimers.push(setTimeout(fn, ms));
      v.pins.forEach((_, k) => at(1200 + k * 420, () => m.play('pop')));
      at(tAt, () => m.play('stamp'));
      at(tAt + 500, () => m.play(v.pins.some(p => p.pts >= 800) ? 'win' : v.pins.some(p => p.pts >= 300) ? 'safe' : 'groan'));
      if (v.pins.some(p => p.pts >= 900)) at(tAt + 900, () => m.play('cheer'));
    }).catch(() => {});
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} knows the world!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel pd">${h}</div>${scores}</div>`;
}

// The phone's map: tap to drop the pin, drag to move the map, + and − to zoom. The view survives redraws.
let pad = { key: '', box: [0, 0, 1000, 500], pin: null };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="${v.rank === 1 ? 'win' : ''}">${v.rank === 1 ? 'You know the world!' : `${esc(v.winner)} wins`}</h2><p class="say">You finished ${['1st', '2nd', '3rd'][v.rank - 1] || v.rank + 'th'} with ${v.score.toLocaleString()} points.</p>`; return; }
  if (v.phase === 'reveal') {
    el.innerHTML = !v.settled ? '<h2>Watch the TV…</h2><p class="say">Here come the pins.</p>'
      : `<p class="muted">${esc(v.what[0].toUpperCase() + v.what.slice(1))} is in</p><h2>${esc(v.where)}</h2><p class="say ${v.pts >= 800 ? 'win' : ''}">${v.mi === null ? 'You did not drop a pin.' : `You were <b>${v.mi.toLocaleString()} miles</b> away. <b>+${v.pts.toLocaleString()}</b>`}</p><p class="muted">${v.score.toLocaleString()} point${v.score === 1 ? '' : 's'}</p>`;
    return;
  }
  if (v.pinned) { el.innerHTML = `<p class="muted">Place ${v.n} of ${v.of}</p><h2>Pin locked 📍</h2><p class="say">Waiting for everyone else…</p>`; return; }
  const key = 'p' + v.n;
  if (pad.key !== key) pad = { key, box: [0, 0, 1000, 500], pin: null };
  if (!needMap(() => { if (el.isConnected) renderPhone(v, el, send); })) { el.innerHTML = '<p class="say">Unrolling the map…</p>'; return; }
  const draw = () => {
    const u = pad.box[2] / 1000, pin = pad.pin ? `<g><circle cx="${X(pad.pin[0])}" cy="${Y(pad.pin[1])}" r="${16 * u}" fill="#ff3b5c55"/><circle cx="${X(pad.pin[0])}" cy="${Y(pad.pin[1])}" r="${7 * u}" fill="#ff3b5c" stroke="#fff" stroke-width="${2.5 * u}"/></g>` : '';
    el.innerHTML = `<p class="muted">Place ${v.n} of ${v.of} · tap the map to drop your pin</p><p class="tq small pdask">${v.icon} Where is <b>${esc(v.what)}</b>?</p>
      <div class="pdpad" id="pdpad">${mapSvg(pad.box, pin, 'phone')}<div class="pdzoom"><button type="button" id="zin" aria-label="Zoom in">＋</button><button type="button" id="zout" aria-label="Zoom out">－</button></div></div>
      <p class="muted small">Drag to move the map. Zoom in to be exact.</p><button class="btn" id="pdlock" ${pad.pin ? '' : 'disabled'}>${pad.pin ? 'Lock it in' : 'Tap the map first'}</button>`;
    const box = el.querySelector('#pdpad'), svg = box.querySelector('svg');
    const toMap = e => { const r = svg.getBoundingClientRect(), s = Math.min(r.width / pad.box[2], r.height / pad.box[3]), ox = r.left + (r.width - pad.box[2] * s) / 2, oy = r.top + (r.height - pad.box[3] * s) / 2; return [pad.box[0] + (e.clientX - ox) / s, pad.box[1] + (e.clientY - oy) / s, s]; };
    const clamp = () => { pad.box[0] = Math.max(0, Math.min(1000 - pad.box[2], pad.box[0])); pad.box[1] = Math.max(0, Math.min(500 - pad.box[3], pad.box[1])); };
    let down = null;
    svg.onpointerdown = e => { down = { x: e.clientX, y: e.clientY, box: [...pad.box], moved: false }; try { svg.setPointerCapture(e.pointerId); } catch {} };
    svg.onpointermove = e => { if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; if (!down.moved && Math.hypot(dx, dy) < 9) return; down.moved = true; const s = toMap(e)[2]; pad.box[0] = down.box[0] - dx / s; pad.box[1] = down.box[1] - dy / s; clamp(); svg.setAttribute('viewBox', pad.box.map(n => +n.toFixed(1)).join(' ')); };
    svg.onpointerup = e => { const d = down; down = null; if (!d) return; if (d.moved) return; const [mx, my] = toMap(e); pad.pin = [Math.max(-180, Math.min(180, (mx / 1000) * 360 - 180)), Math.max(-90, Math.min(90, 90 - (my / 500) * 180))]; draw(); };
    svg.onpointercancel = () => { down = null; };
    const zoom = f => { const w = Math.max(60, Math.min(1000, pad.box[2] * f)), hh = w >= 1000 ? 500 : Math.min(500, w * 0.75), c = pad.pin && f < 1 ? [X(pad.pin[0]), Y(pad.pin[1])] : [pad.box[0] + pad.box[2] / 2, pad.box[1] + pad.box[3] / 2]; pad.box = [c[0] - w / 2, c[1] - hh / 2, w, hh]; clamp(); draw(); };   // zoomed in, the view is 4:3 so the phone shows more of the map
    el.querySelector('#zin').onclick = () => zoom(0.5);
    el.querySelector('#zout').onclick = () => zoom(2);
    el.querySelector('#pdlock').onclick = () => { if (pad.pin) { el.querySelector('#pdlock').disabled = true; send({ type: 'pin', lon: pad.pin[0], lat: pad.pin[1] }); } };
  };
  draw();
}
