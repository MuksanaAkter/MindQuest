import "server-only";
import type { Difficulty, Category } from "../shared/contracts";
export type Question = { id: string; category: Exclude<Category, "mixed">; difficulty: Difficulty; prompt: string; options: string[]; explanation: string };
// Immutable version-one IDs. The first authored option is correct; never ship this module to clients.
export const QUESTIONS: readonly Question[] = [
  {
    "id": "science-easy-1",
    "category": "science",
    "difficulty": "EASY",
    "prompt": "Which planet is known as the Red Planet?",
    "options": [
      "Mars",
      "Venus",
      "Jupiter",
      "Mercury"
    ],
    "explanation": "Iron minerals in the surface dust give Mars its reddish appearance."
  },
  {
    "id": "science-easy-2",
    "category": "science",
    "difficulty": "EASY",
    "prompt": "What do plants absorb from the air during photosynthesis?",
    "options": [
      "Carbon dioxide",
      "Helium",
      "Hydrogen",
      "Neon"
    ],
    "explanation": "Plants use carbon dioxide and water, powered by sunlight, to make sugars."
  },
  {
    "id": "science-easy-3",
    "category": "science",
    "difficulty": "EASY",
    "prompt": "What is the chemical formula for water?",
    "options": [
      "H₂O",
      "CO₂",
      "O₂",
      "NaCl"
    ],
    "explanation": "A water molecule contains two hydrogen atoms and one oxygen atom."
  },
  {
    "id": "science-easy-4",
    "category": "science",
    "difficulty": "EASY",
    "prompt": "Which organ pumps blood around your body?",
    "options": [
      "Heart",
      "Liver",
      "Lungs",
      "Stomach"
    ],
    "explanation": "The heart contracts to circulate blood through your blood vessels."
  },
  {
    "id": "science-easy-5",
    "category": "science",
    "difficulty": "EASY",
    "prompt": "Which force pulls objects toward Earth?",
    "options": [
      "Gravity",
      "Magnetism",
      "Friction",
      "Static electricity"
    ],
    "explanation": "Gravity attracts objects with mass toward one another."
  },
  {
    "id": "science-easy-6",
    "category": "science",
    "difficulty": "EASY",
    "prompt": "Which part of a plant usually takes in water from soil?",
    "options": [
      "Roots",
      "Flowers",
      "Fruit",
      "Petals"
    ],
    "explanation": "Roots absorb water and dissolved minerals from the soil."
  },
  {
    "id": "science-easy-7",
    "category": "science",
    "difficulty": "EASY",
    "prompt": "What is the closest star to Earth?",
    "options": [
      "The Sun",
      "Sirius",
      "Polaris",
      "Betelgeuse"
    ],
    "explanation": "Our Sun is a star; the next nearest stars are far beyond our solar system."
  },
  {
    "id": "science-easy-8",
    "category": "science",
    "difficulty": "EASY",
    "prompt": "Which sense relies on the ears?",
    "options": [
      "Hearing",
      "Taste",
      "Smell",
      "Sight"
    ],
    "explanation": "Sound vibrations travel through the ear and are converted into nerve signals."
  },
  {
    "id": "science-medium-1",
    "category": "science",
    "difficulty": "MEDIUM",
    "prompt": "Which gas makes up most of Earth’s atmosphere?",
    "options": [
      "Nitrogen",
      "Oxygen",
      "Carbon dioxide",
      "Argon"
    ],
    "explanation": "Nitrogen accounts for about 78 percent of the atmosphere by volume."
  },
  {
    "id": "science-medium-2",
    "category": "science",
    "difficulty": "MEDIUM",
    "prompt": "Which cell structure contains most human DNA?",
    "options": [
      "Nucleus",
      "Ribosome",
      "Cell membrane",
      "Lysosome"
    ],
    "explanation": "Most human DNA is in the nucleus; mitochondria contain a small amount too."
  },
  {
    "id": "science-medium-3",
    "category": "science",
    "difficulty": "MEDIUM",
    "prompt": "What is the SI unit of electrical resistance?",
    "options": [
      "Ohm",
      "Volt",
      "Ampere",
      "Watt"
    ],
    "explanation": "Resistance is measured in ohms, named after physicist Georg Ohm."
  },
  {
    "id": "science-medium-4",
    "category": "science",
    "difficulty": "MEDIUM",
    "prompt": "What is a change from a solid directly to a gas called?",
    "options": [
      "Sublimation",
      "Condensation",
      "Melting",
      "Freezing"
    ],
    "explanation": "Sublimation skips the liquid phase, as dry ice does at ordinary pressure."
  },
  {
    "id": "science-medium-5",
    "category": "science",
    "difficulty": "MEDIUM",
    "prompt": "Which vitamin can skin produce with sunlight exposure?",
    "options": [
      "Vitamin D",
      "Vitamin C",
      "Vitamin B12",
      "Vitamin K"
    ],
    "explanation": "UVB light helps skin begin the process of producing vitamin D."
  },
  {
    "id": "science-medium-6",
    "category": "science",
    "difficulty": "MEDIUM",
    "prompt": "Which planet has the largest mass in our solar system?",
    "options": [
      "Jupiter",
      "Saturn",
      "Neptune",
      "Earth"
    ],
    "explanation": "Jupiter is more massive than all the other planets combined."
  },
  {
    "id": "science-medium-7",
    "category": "science",
    "difficulty": "MEDIUM",
    "prompt": "Which particle carries a negative electric charge?",
    "options": [
      "Electron",
      "Proton",
      "Neutron",
      "Photon"
    ],
    "explanation": "Electrons have negative charge; protons have positive charge."
  },
  {
    "id": "science-medium-8",
    "category": "science",
    "difficulty": "MEDIUM",
    "prompt": "What does a light-year measure?",
    "options": [
      "Distance",
      "Time",
      "Brightness",
      "Temperature"
    ],
    "explanation": "A light-year is the distance light travels in vacuum in one year."
  },
  {
    "id": "science-hard-1",
    "category": "science",
    "difficulty": "HARD",
    "prompt": "What is the SI unit of capacitance?",
    "options": [
      "Farad",
      "Henry",
      "Tesla",
      "Weber"
    ],
    "explanation": "Capacitance is charge stored per unit voltage, measured in farads."
  },
  {
    "id": "science-hard-2",
    "category": "science",
    "difficulty": "HARD",
    "prompt": "Which enzyme unwinds the DNA double helix during replication?",
    "options": [
      "Helicase",
      "Ligase",
      "Amylase",
      "Pepsin"
    ],
    "explanation": "Helicase separates DNA strands so each can serve as a template."
  },
  {
    "id": "science-hard-3",
    "category": "science",
    "difficulty": "HARD",
    "prompt": "Which law relates gas pressure and volume at constant temperature?",
    "options": [
      "Boyle’s law",
      "Ohm’s law",
      "Hooke’s law",
      "Faraday’s law"
    ],
    "explanation": "For a fixed amount of gas at constant temperature, pressure is inversely proportional to volume."
  },
  {
    "id": "science-hard-4",
    "category": "science",
    "difficulty": "HARD",
    "prompt": "What is the atomic number of carbon?",
    "options": [
      "6",
      "8",
      "12",
      "14"
    ],
    "explanation": "Atomic number counts protons. Every carbon atom has six protons."
  },
  {
    "id": "science-hard-5",
    "category": "science",
    "difficulty": "HARD",
    "prompt": "Which organelle is the main site of aerobic ATP production in human cells?",
    "options": [
      "Mitochondrion",
      "Golgi apparatus",
      "Ribosome",
      "Nucleolus"
    ],
    "explanation": "Mitochondria produce most ATP through oxidative phosphorylation."
  },
  {
    "id": "science-hard-6",
    "category": "science",
    "difficulty": "HARD",
    "prompt": "Which quantity is conserved in an isolated system of colliding objects?",
    "options": [
      "Total momentum",
      "Each object’s speed",
      "Each object’s kinetic energy",
      "Total temperature"
    ],
    "explanation": "Total momentum is conserved when there is no net external force."
  },
  {
    "id": "science-hard-7",
    "category": "science",
    "difficulty": "HARD",
    "prompt": "What is the approximate pH of pure water at 25°C?",
    "options": [
      "7",
      "0",
      "3",
      "14"
    ],
    "explanation": "At 25°C, pure water has equal hydrogen and hydroxide ion concentrations, giving pH 7."
  },
  {
    "id": "science-hard-8",
    "category": "science",
    "difficulty": "HARD",
    "prompt": "Which electromagnetic waves have the shortest wavelengths?",
    "options": [
      "Gamma rays",
      "Radio waves",
      "Microwaves",
      "Infrared"
    ],
    "explanation": "Gamma rays occupy the highest-frequency, shortest-wavelength end of the electromagnetic spectrum."
  },
  {
    "id": "world-easy-1",
    "category": "world",
    "difficulty": "EASY",
    "prompt": "On which continent is Brazil?",
    "options": [
      "South America",
      "Europe",
      "Africa",
      "Asia"
    ],
    "explanation": "Brazil occupies a large part of eastern South America."
  },
  {
    "id": "world-easy-2",
    "category": "world",
    "difficulty": "EASY",
    "prompt": "Which ocean is the largest by surface area?",
    "options": [
      "Pacific",
      "Atlantic",
      "Indian",
      "Arctic"
    ],
    "explanation": "The Pacific stretches between the Americas and Asia and Oceania."
  },
  {
    "id": "world-easy-3",
    "category": "world",
    "difficulty": "EASY",
    "prompt": "What is the capital of Japan?",
    "options": [
      "Tokyo",
      "Kyoto",
      "Osaka",
      "Seoul"
    ],
    "explanation": "Tokyo is Japan’s capital; Kyoto was the imperial capital for many centuries."
  },
  {
    "id": "world-easy-4",
    "category": "world",
    "difficulty": "EASY",
    "prompt": "Which country is home to the pyramids at Giza?",
    "options": [
      "Egypt",
      "Greece",
      "Mexico",
      "India"
    ],
    "explanation": "The Giza pyramids stand near Cairo in Egypt."
  },
  {
    "id": "world-easy-5",
    "category": "world",
    "difficulty": "EASY",
    "prompt": "Which direction is opposite to east?",
    "options": [
      "West",
      "North",
      "South",
      "Northeast"
    ],
    "explanation": "East and west are opposite points on the compass."
  },
  {
    "id": "world-easy-6",
    "category": "world",
    "difficulty": "EASY",
    "prompt": "Which continent contains the South Pole?",
    "options": [
      "Antarctica",
      "Australia",
      "Asia",
      "Europe"
    ],
    "explanation": "The geographic South Pole lies on the Antarctic ice sheet."
  },
  {
    "id": "world-easy-7",
    "category": "world",
    "difficulty": "EASY",
    "prompt": "What is the capital of Bangladesh?",
    "options": [
      "Dhaka",
      "Chattogram",
      "Sylhet",
      "Khulna"
    ],
    "explanation": "Dhaka is Bangladesh’s capital and lies near the Buriganga River."
  },
  {
    "id": "world-easy-8",
    "category": "world",
    "difficulty": "EASY",
    "prompt": "Which country contains the city of Barcelona?",
    "options": [
      "Spain",
      "Portugal",
      "Italy",
      "France"
    ],
    "explanation": "Barcelona is in Catalonia in northeastern Spain."
  },
  {
    "id": "world-medium-1",
    "category": "world",
    "difficulty": "MEDIUM",
    "prompt": "Which mountain range separates much of Europe from Asia?",
    "options": [
      "Ural Mountains",
      "Andes",
      "Rockies",
      "Atlas Mountains"
    ],
    "explanation": "The Ural Mountains are part of the conventional boundary between Europe and Asia."
  },
  {
    "id": "world-medium-2",
    "category": "world",
    "difficulty": "MEDIUM",
    "prompt": "Which river flows through Paris?",
    "options": [
      "Seine",
      "Thames",
      "Danube",
      "Rhine"
    ],
    "explanation": "The Seine flows through Paris and onward to the English Channel."
  },
  {
    "id": "world-medium-3",
    "category": "world",
    "difficulty": "MEDIUM",
    "prompt": "Which country has Wellington as its capital?",
    "options": [
      "New Zealand",
      "Australia",
      "Canada",
      "Ireland"
    ],
    "explanation": "Wellington lies at the southern end of New Zealand’s North Island."
  },
  {
    "id": "world-medium-4",
    "category": "world",
    "difficulty": "MEDIUM",
    "prompt": "Which sea lies between Europe and northern Africa?",
    "options": [
      "Mediterranean Sea",
      "Baltic Sea",
      "Caribbean Sea",
      "Arabian Sea"
    ],
    "explanation": "The Mediterranean connects to the Atlantic through the Strait of Gibraltar."
  },
  {
    "id": "world-medium-5",
    "category": "world",
    "difficulty": "MEDIUM",
    "prompt": "Which desert covers much of northern Africa?",
    "options": [
      "Sahara",
      "Gobi",
      "Atacama",
      "Kalahari"
    ],
    "explanation": "The Sahara is the vast hot desert across northern Africa."
  },
  {
    "id": "world-medium-6",
    "category": "world",
    "difficulty": "MEDIUM",
    "prompt": "Which country is the island of Java part of?",
    "options": [
      "Indonesia",
      "Philippines",
      "Malaysia",
      "Thailand"
    ],
    "explanation": "Java is an Indonesian island and includes the city of Jakarta."
  },
  {
    "id": "world-medium-7",
    "category": "world",
    "difficulty": "MEDIUM",
    "prompt": "Which imaginary line divides Earth into Northern and Southern Hemispheres?",
    "options": [
      "Equator",
      "Prime Meridian",
      "Tropic of Cancer",
      "Arctic Circle"
    ],
    "explanation": "The Equator is at zero degrees latitude."
  },
  {
    "id": "world-medium-8",
    "category": "world",
    "difficulty": "MEDIUM",
    "prompt": "Which continent contains the Andes?",
    "options": [
      "South America",
      "North America",
      "Asia",
      "Africa"
    ],
    "explanation": "The Andes run along the western edge of South America."
  },
  {
    "id": "world-hard-1",
    "category": "world",
    "difficulty": "HARD",
    "prompt": "Which strait separates Morocco from Spain?",
    "options": [
      "Strait of Gibraltar",
      "Strait of Hormuz",
      "Bering Strait",
      "Strait of Malacca"
    ],
    "explanation": "The Strait of Gibraltar links the Atlantic Ocean and Mediterranean Sea."
  },
  {
    "id": "world-hard-2",
    "category": "world",
    "difficulty": "HARD",
    "prompt": "Which country is completely surrounded by South Africa?",
    "options": [
      "Lesotho",
      "Eswatini",
      "Botswana",
      "Namibia"
    ],
    "explanation": "Lesotho is an enclave entirely within South Africa."
  },
  {
    "id": "world-hard-3",
    "category": "world",
    "difficulty": "HARD",
    "prompt": "Which city is located on both sides of the Bosporus?",
    "options": [
      "Istanbul",
      "Athens",
      "Rome",
      "Cairo"
    ],
    "explanation": "The Bosporus divides Istanbul between its European and Asian sides."
  },
  {
    "id": "world-hard-4",
    "category": "world",
    "difficulty": "HARD",
    "prompt": "Which lake is the deepest in the world?",
    "options": [
      "Lake Baikal",
      "Lake Victoria",
      "Lake Superior",
      "Lake Tanganyika"
    ],
    "explanation": "Lake Baikal in Siberia reaches a depth of over 1,600 metres."
  },
  {
    "id": "world-hard-5",
    "category": "world",
    "difficulty": "HARD",
    "prompt": "Which sea is bounded by ocean currents rather than land?",
    "options": [
      "Sargasso Sea",
      "Red Sea",
      "Black Sea",
      "Caspian Sea"
    ],
    "explanation": "The Sargasso Sea lies within the North Atlantic gyre."
  },
  {
    "id": "world-hard-6",
    "category": "world",
    "difficulty": "HARD",
    "prompt": "Which country contains the ancient city of Petra?",
    "options": [
      "Jordan",
      "Lebanon",
      "Oman",
      "Türkiye"
    ],
    "explanation": "Petra is famous for rock-cut architecture in southern Jordan."
  },
  {
    "id": "world-hard-7",
    "category": "world",
    "difficulty": "HARD",
    "prompt": "Which latitude marks the Tropic of Capricorn, approximately?",
    "options": [
      "23.5° south",
      "23.5° north",
      "66.5° south",
      "0°"
    ],
    "explanation": "The Tropic of Capricorn is near 23.5 degrees south latitude."
  },
  {
    "id": "world-hard-8",
    "category": "world",
    "difficulty": "HARD",
    "prompt": "Which river flows through Baghdad?",
    "options": [
      "Tigris",
      "Euphrates",
      "Jordan",
      "Nile"
    ],
    "explanation": "Baghdad developed along the Tigris in what is now Iraq."
  },
  {
    "id": "history-easy-1",
    "category": "history",
    "difficulty": "EASY",
    "prompt": "Which civilization built the Colosseum?",
    "options": [
      "Ancient Romans",
      "Ancient Egyptians",
      "Maya",
      "Vikings"
    ],
    "explanation": "The Colosseum was built in Rome during the first century CE."
  },
  {
    "id": "history-easy-2",
    "category": "history",
    "difficulty": "EASY",
    "prompt": "Who painted the Mona Lisa?",
    "options": [
      "Leonardo da Vinci",
      "Pablo Picasso",
      "Claude Monet",
      "Vincent van Gogh"
    ],
    "explanation": "Leonardo da Vinci painted the Mona Lisa during the Italian Renaissance."
  },
  {
    "id": "history-easy-3",
    "category": "history",
    "difficulty": "EASY",
    "prompt": "In which year did Bangladesh become independent?",
    "options": [
      "1971",
      "1947",
      "1952",
      "1990"
    ],
    "explanation": "Bangladesh achieved independence in 1971 after the Liberation War."
  },
  {
    "id": "history-easy-4",
    "category": "history",
    "difficulty": "EASY",
    "prompt": "Who was the first person to walk on the Moon?",
    "options": [
      "Neil Armstrong",
      "Yuri Gagarin",
      "Buzz Aldrin",
      "John Glenn"
    ],
    "explanation": "Neil Armstrong stepped onto the Moon during Apollo 11 in July 1969."
  },
  {
    "id": "history-easy-5",
    "category": "history",
    "difficulty": "EASY",
    "prompt": "Which ancient people used hieroglyphic writing along the Nile?",
    "options": [
      "Egyptians",
      "Romans",
      "Vikings",
      "Inca"
    ],
    "explanation": "Ancient Egyptians used hieroglyphs, including on monuments and religious texts."
  },
  {
    "id": "history-easy-6",
    "category": "history",
    "difficulty": "EASY",
    "prompt": "Which structure was built as a network of fortifications in China?",
    "options": [
      "Great Wall",
      "Hadrian’s Wall",
      "Berlin Wall",
      "Tower of London"
    ],
    "explanation": "Sections of the Great Wall were built and rebuilt across many Chinese dynasties."
  },
  {
    "id": "history-easy-7",
    "category": "history",
    "difficulty": "EASY",
    "prompt": "Which instrument is associated with Ludwig van Beethoven?",
    "options": [
      "Piano",
      "Saxophone",
      "Electric guitar",
      "Synthesizer"
    ],
    "explanation": "Beethoven was a pianist and composer whose works include 32 piano sonatas."
  },
  {
    "id": "history-easy-8",
    "category": "history",
    "difficulty": "EASY",
    "prompt": "Which city hosted the ancient Olympic Games?",
    "options": [
      "Olympia",
      "Athens",
      "Sparta",
      "Rome"
    ],
    "explanation": "The ancient Olympics took place at Olympia in Greece."
  },
  {
    "id": "history-medium-1",
    "category": "history",
    "difficulty": "MEDIUM",
    "prompt": "In which year did the Berlin Wall fall?",
    "options": [
      "1989",
      "1979",
      "1991",
      "1961"
    ],
    "explanation": "The border opened in November 1989, becoming a symbol of the end of the Cold War."
  },
  {
    "id": "history-medium-2",
    "category": "history",
    "difficulty": "MEDIUM",
    "prompt": "Which document was sealed by King John in 1215?",
    "options": [
      "Magna Carta",
      "Bill of Rights",
      "Declaration of Independence",
      "Treaty of Versailles"
    ],
    "explanation": "Magna Carta set out limits on royal power and certain legal protections."
  },
  {
    "id": "history-medium-3",
    "category": "history",
    "difficulty": "MEDIUM",
    "prompt": "Which empire was ruled by Ashoka?",
    "options": [
      "Maurya Empire",
      "Roman Empire",
      "Ottoman Empire",
      "Mughal Empire"
    ],
    "explanation": "Ashoka ruled the Maurya Empire in the third century BCE."
  },
  {
    "id": "history-medium-4",
    "category": "history",
    "difficulty": "MEDIUM",
    "prompt": "Which invention is Johannes Gutenberg best known for in Europe?",
    "options": [
      "Movable-type printing press",
      "Steam engine",
      "Telescope",
      "Telephone"
    ],
    "explanation": "Gutenberg developed a practical movable metal-type printing system in fifteenth-century Europe."
  },
  {
    "id": "history-medium-5",
    "category": "history",
    "difficulty": "MEDIUM",
    "prompt": "Who wrote Pride and Prejudice?",
    "options": [
      "Jane Austen",
      "Charlotte Brontë",
      "Mary Shelley",
      "George Eliot"
    ],
    "explanation": "Jane Austen’s novel Pride and Prejudice was published in 1813."
  },
  {
    "id": "history-medium-6",
    "category": "history",
    "difficulty": "MEDIUM",
    "prompt": "Which civilization built Machu Picchu?",
    "options": [
      "Inca",
      "Aztec",
      "Maya",
      "Olmec"
    ],
    "explanation": "The Inca built Machu Picchu in the Andes in the fifteenth century."
  },
  {
    "id": "history-medium-7",
    "category": "history",
    "difficulty": "MEDIUM",
    "prompt": "Which war ended with the 1918 armistice on the Western Front?",
    "options": [
      "First World War",
      "Second World War",
      "Crimean War",
      "Hundred Years’ War"
    ],
    "explanation": "The armistice of 11 November 1918 ended fighting on the Western Front in World War I."
  },
  {
    "id": "history-medium-8",
    "category": "history",
    "difficulty": "MEDIUM",
    "prompt": "Who composed The Four Seasons?",
    "options": [
      "Antonio Vivaldi",
      "Johann Sebastian Bach",
      "Wolfgang Amadeus Mozart",
      "Frédéric Chopin"
    ],
    "explanation": "Vivaldi’s The Four Seasons is a set of four violin concertos."
  },
  {
    "id": "history-hard-1",
    "category": "history",
    "difficulty": "HARD",
    "prompt": "Which treaty ended the Thirty Years’ War in 1648?",
    "options": [
      "Peace of Westphalia",
      "Treaty of Utrecht",
      "Treaty of Paris",
      "Treaty of Tordesillas"
    ],
    "explanation": "The Peace of Westphalia refers to treaties signed in 1648 ending the Thirty Years’ War."
  },
  {
    "id": "history-hard-2",
    "category": "history",
    "difficulty": "HARD",
    "prompt": "Which dynasty commissioned much of the Forbidden City’s original construction?",
    "options": [
      "Ming",
      "Han",
      "Tang",
      "Song"
    ],
    "explanation": "Construction of the Forbidden City began under the Ming Yongle Emperor."
  },
  {
    "id": "history-hard-3",
    "category": "history",
    "difficulty": "HARD",
    "prompt": "In which year was the Battle of Hastings?",
    "options": [
      "1066",
      "1215",
      "1415",
      "1485"
    ],
    "explanation": "William of Normandy defeated King Harold II at Hastings in 1066."
  },
  {
    "id": "history-hard-4",
    "category": "history",
    "difficulty": "HARD",
    "prompt": "Which scholar wrote the Muqaddimah?",
    "options": [
      "Ibn Khaldun",
      "Ibn Sina",
      "Al-Khwarizmi",
      "Ibn Battuta"
    ],
    "explanation": "Ibn Khaldun’s Muqaddimah discusses history, society, and the rise and fall of civilizations."
  },
  {
    "id": "history-hard-5",
    "category": "history",
    "difficulty": "HARD",
    "prompt": "Which empire had Tenochtitlan as its capital?",
    "options": [
      "Aztec",
      "Inca",
      "Roman",
      "Persian"
    ],
    "explanation": "Tenochtitlan was the Mexica capital and a centre of the Aztec Empire."
  },
  {
    "id": "history-hard-6",
    "category": "history",
    "difficulty": "HARD",
    "prompt": "Which movement included artists Claude Monet and Pierre-Auguste Renoir?",
    "options": [
      "Impressionism",
      "Cubism",
      "Surrealism",
      "Baroque"
    ],
    "explanation": "Impressionist painters often explored light and everyday scenes with visible brushwork."
  },
  {
    "id": "history-hard-7",
    "category": "history",
    "difficulty": "HARD",
    "prompt": "Which mathematician is associated with the book Al-Jabr?",
    "options": [
      "Al-Khwarizmi",
      "Euclid",
      "Archimedes",
      "Pythagoras"
    ],
    "explanation": "Al-Khwarizmi’s work on al-jabr helped establish algebra as a systematic discipline."
  },
  {
    "id": "history-hard-8",
    "category": "history",
    "difficulty": "HARD",
    "prompt": "Which ancient library was associated with the Ptolemaic rulers of Egypt?",
    "options": [
      "Library of Alexandria",
      "Library of Pergamum",
      "Library of Ashurbanipal",
      "Library of Celsus"
    ],
    "explanation": "The Library of Alexandria developed in Ptolemaic Egypt as a major centre of scholarship."
  }
];
