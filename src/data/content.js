// All site copy and scene layout live here, so content edits never touch scene code.

export const OWNER = {
  name: 'César Yamada',
  title: 'Data / AI Engineer · BI Specialist at Honor México',
  tagline:
    'I build AI agents that use tools, query databases and read files to turn real-world data into decisions.',
  bio: [
    'Data scientist based in Mexico, focused on applied AI, especially AI agents that use tools, query databases and read files to complete tasks. My background is in classical machine learning and optimization.',
    'Graduate in Data Science & Mathematics Engineering, Tecnológico de Monterrey.',
  ],
  interests: ['AI agents', 'Machine learning on real-world data', 'Optimization and decision support'],
  links: {
    github: 'https://github.com/CesarYamadaX',
    linkedin: 'https://www.linkedin.com/in/cesaryamada',
    email: 'cedayaxo@gmail.com',
  },
}

export const SECTIONS = [
  { id: 'hero', label: 'Hero' },
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
]

// Direction TO the sun (world space). It sits ahead and to the upper left, so the
// station is back-lit at the About stop and planets show a lit limb.
export const SUN_DIRECTION = [-0.717, 0.358, -0.597]

// Camera stops, one per section, in scroll order. The rig interpolates between them
// with a smooth curve, so there are no cuts.
export const WAYPOINTS = [
  { pos: [0, 0, 12], look: [7, -2, -36] },
  { pos: [2, 0, -55], look: [-9, 5.5, -68] },
  { pos: [0, 1, -108], look: [0, 0, -142] },
  { pos: [0, 0, -178], look: [0, 0, -208] },
  { pos: [0, 4, -262], look: [0, 1.5, -300] },
]

export const HERO_PLANET = { position: [11, -3, -36], radius: 7, texture: '/textures/planet-hero.jpg', atmosphere: '#6fd8ff' }
export const STATION_POSITION = [-14.5, 4.2, -65]
export const LANDING = { position: [0, -66, -300], radius: 60, atmosphere: '#6fd8ff' }

// Project planets face this point (the Projects camera stop) so their media is visible.
export const PROJECT_VIEW = [0, 1, -108]

export const PROJECTS = [
  {
    id: 'pricing',
    name: 'Competitive Pricing Intelligence',
    subtitle: 'Pricing Dashboard + Market Scraping MX',
    short: 'Dashboard on price history scraped from 9 Mexican retailers and carriers.',
    description:
      'A web dashboard built on the historical data collected by a Python scraping suite covering 9 Mexican retailers and carriers. It collects prices, catalog, inventory and promotions for phones, tablets, headphones, smartwatches and accessories, normalized to a common schema and deduplicated by SKU/URL.',
    note: 'AT&T · Elektra · Telcel · Movistar · Liverpool · Coppel · Sears · Suburbia · Mercado Libre',
    stack: ['Python', 'Selenium', 'BeautifulSoup', 'requests', 'Scrapling', 'pandas', 'Web dashboard'],
    links: [
      { label: 'Dashboard repo', url: 'https://github.com/CesarYamadaX/Pricing_Dashboard-' },
      { label: 'Scraping repo', url: 'https://github.com/CesarYamadaX/Scrapping' },
    ],
    media: 'pricing',
    position: [-11, 0.5, -140],
    radius: 4.2,
    texture: '/textures/planet-pricing.jpg',
    atmosphere: '#6fd8ff',
  },
  {
    id: 'whatsapp',
    name: 'Honor WhatsApp AI Assistant',
    subtitle: 'Database answers by text or voice note',
    short: 'Ask the database in plain language over WhatsApp, by text or voice.',
    description:
      'Answers database questions in plain language via text or voice note, with an animated mascot. It connects the WhatsApp API to an LLM through OpenRouter and queries SQL Server.',
    stack: ['Python', 'WhatsApp API', 'OpenRouter', 'SQL Server'],
    links: [{ label: 'GitHub repo', url: 'https://github.com/CesarYamadaX/Honor-WhatsApp-Bot' }],
    media: 'whatsapp',
    position: [1, -5.5, -148],
    radius: 3.4,
    texture: '/textures/planet-whatsapp.jpg',
    atmosphere: '#a9adff',
  },
  {
    id: 'pfizer',
    name: 'Pfizer Clustering Project',
    subtitle: 'Team project · dashboard lead',
    short: 'Team clustering project with a frontend and backend; I built the dashboard.',
    description:
      'Team project for Development of Mathematical Engineering Projects (group 501), with a frontend and backend applying clustering. I was in charge of the dashboard.',
    stack: ['Clustering', 'Dashboard', 'Team project'],
    links: [{ label: 'GitHub repo', url: 'https://github.com/4dr14nL0935/Pfizer-Clustering-Project' }],
    media: 'pfizer',
    position: [11.5, 3, -142],
    radius: 3.1,
    texture: '/textures/planet-pfizer.jpg',
    atmosphere: '#b8d1f2',
  },
]

// Small moons for secondary repos; each orbits one project planet.
export const MOONS = [
  { name: 'foundation-management-system', about: 'Web app for a foundation supporting the deaf community in Mexico', url: 'https://github.com/CesarYamadaX/foundation-management-system', orbits: 'pricing', distance: 6.6, radius: 0.5, speed: 0.12, phase: 0.6 },
  { name: 'Minigames', about: 'Browser minigames', url: 'https://github.com/CesarYamadaX/Minigames', orbits: 'whatsapp', distance: 5.2, radius: 0.38, speed: 0.17, phase: 2.4 },
  { name: 'simple-chess-engine', about: 'A simple chess engine', url: 'https://github.com/CesarYamadaX/simple-chess-engine', orbits: 'pfizer', distance: 5.0, radius: 0.44, speed: 0.14, phase: 4.3 },
]

// Constellations: star coordinates are in a 1440x900 layout space (same as the design),
// converted to world units in Constellations.jsx.
export const SKILLS = [
  { name: 'Languages & ML', origin: [80, 230], closed: true, title: [150, 215], stars: [['Python', 60, 60], ['R', 190, 30], ['TensorFlow', 300, 110], ['scikit-learn', 150, 170]] },
  { name: 'Data', origin: [520, 180], closed: false, title: [190, 235], stars: [['SQL Server', 50, 130], ['MySQL', 160, 50], ['MongoDB', 280, 90], ['Power BI', 330, 190]] },
  { name: 'Web & cloud', origin: [950, 200], closed: true, title: [200, 240], stars: [['JavaScript', 40, 70], ['React', 140, 30], ['Flask', 240, 80], ['AWS', 340, 40], ['GCP', 320, 150], ['Git', 190, 180], ['LaTeX', 70, 190]] },
  { name: 'AI & agents', origin: [230, 560], closed: false, title: [160, 175], stars: [['LangChain', 70, 60], ['Model Context Protocol (MCP)', 250, 120]] },
  { name: 'Methods', origin: [780, 540], closed: true, title: [185, 225], stars: [['Predictive models', 50, 80], ['Clustering', 190, 40], ['Genetic algorithms', 320, 110], ['Markov chains', 170, 170]] },
]
export const SKILLS_PLANE_Z = -208
