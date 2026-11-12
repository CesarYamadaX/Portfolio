// All site copy and scene layout live here, so content edits never touch scene code.

// Public files are addressed through the build's base path, so the site also works under a sub-path.
const BASE = import.meta.env.BASE_URL

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
  { id: 'hero', label: 'Intro' },
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
  // narrow screens see a thin slice, so there the station is framed head-on, above the text card
  { pos: [2, 0, -55], look: [-9, 5.5, -68], narrowPos: [0, 0, -35], narrowLook: [-14.5, -3.5, -65] },
  { pos: [0, 1, -108], look: [0, 0, -142] },
  { pos: [0, 0, -178], look: [0, 0, -208] },
  { pos: [0, 4, -262], look: [0, 1.5, -300] },
]

export const HERO_PLANET = { position: [11, -3, -36], radius: 7, texture: `${BASE}textures/planet-hero.jpg`, atmosphere: '#6fd8ff' }
export const STATION_POSITION = [-14.5, 4.2, -65]
export const LANDING = { position: [0, -66, -300], radius: 60, atmosphere: '#6fd8ff' }

// Project planets face this point (the Projects camera stop) so their media is visible.
export const PROJECT_VIEW = [0, 1, -108]

export const PROJECTS = [
  {
    id: 'pricing',
    name: 'Competitive Pricing Analysis',
    subtitle: 'Pricing Dashboard + Market Scraping MX',
    short: 'Dashboard on price history scraped from 9 Mexican retailers and carriers.',
    description:
      'A web dashboard built on the historical data collected by a Python scraping suite covering 9 Mexican retailers and carriers. It collects prices, catalog, inventory and promotions for phones, tablets, headphones, smartwatches and accessories, normalized to a common schema and deduplicated by SKU/URL.',
    note: 'AT&T · Elektra · Telcel · Movistar · Liverpool · Coppel · Sears · Suburbia · Mercado Libre',
    stack: ['Python', 'Selenium', 'BeautifulSoup', 'requests', 'Scrapling', 'pandas', 'Web dashboard'],
    links: [
      { label: 'Scraping suite · source code', url: 'https://github.com/CesarYamadaX/Scrapping' },
    ],
    media: 'pricing',
    position: [-11, 0.5, -140],
    narrowPosition: [-1.6, 1.7, -146],
    radius: 4.2,
    texture: `${BASE}textures/planet-pricing.jpg`,
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
    links: [{ label: 'Source code', url: 'https://github.com/CesarYamadaX/Honor-WhatsApp-Bot' }],
    media: 'whatsapp',
    position: [1, -5.5, -148],
    narrowPosition: [1.6, -3.0, -146],
    radius: 3.4,
    texture: `${BASE}textures/planet-whatsapp.jpg`,
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
    links: [{ label: 'Source code', url: 'https://github.com/4dr14nL0935/Pfizer-Clustering-Project' }],
    media: 'pfizer',
    position: [11.5, 3, -142],
    narrowPosition: [-1.2, -7.15, -146],
    radius: 3.1,
    texture: `${BASE}textures/planet-pfizer.jpg`,
    atmosphere: '#b8d1f2',
  },
]


/**
 * The projects as the scene should lay them out. Side by side they need a wide screen; on a
 * narrow one they are stacked in a column and drawn a little smaller, so all three stay in view.
 */
const NARROW_PROJECTS = PROJECTS.map((p) => ({ ...p, position: p.narrowPosition, radius: p.radius * 0.5 }))
export const projectsFor = (narrow) => (narrow ? NARROW_PROJECTS : PROJECTS)

// Constellations: star coordinates are in a 1440x900 layout space (same as the design),
// converted to world units in Constellations.jsx. Each group draws a figure: `lines` joins
// stars by index, and a star with a null label is an unnamed one that only completes the shape.
// A fourth value places the name on the phone chart ('below' the star instead of to its right).
export const SKILLS = [
  // a kite with its tail
  { name: 'Languages & ML', origin: [80, 215], title: [150, 285], stars: [['Python', 60, 90], ['R', 170, 20], ['TensorFlow', 290, 80], ['scikit-learn', 180, 150], [null, 160, 205], [null, 130, 245]], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 3], [3, 4], [4, 5]] },
  // a ladle: handle on the left, bowl on the right
  { name: 'Data', origin: [520, 170], title: [190, 235], stars: [['SQL Server', 30, 130], [null, 90, 85], ['MySQL', 150, 50], ['MongoDB', 230, 70], [null, 335, 55], ['Power BI', 345, 150], [null, 245, 160]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
  // a W that trails into a hook
  { name: 'Web & cloud', origin: [950, 190], title: [150, 315], stars: [['JavaScript', 20, 60], ['React', 100, 150], ['Flask', 180, 70], ['AWS', 260, 160], ['GCP', 340, 80], ['Git', 385, 165], ['LaTeX', 330, 235], ['RESTful APIs', 240, 262], ['Webhooks', 138, 238], ['WebSockets', 85, 200]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]] },
  // an arrow in flight
  { name: 'AI & agents', origin: [230, 580], title: [190, 175], stars: [['LangChain', 40, 90], ['LangGraph', 190, 90], ['Model Context Protocol (MCP)', 340, 90, 'below'], [null, 292, 50], [null, 292, 130], [null, -2, 58], [null, -2, 122]], lines: [[0, 1], [1, 2], [2, 3], [2, 4], [0, 5], [0, 6]] },
  // a lyre: a slanted box hanging from one bright star
  { name: 'Methods', origin: [780, 545], title: [185, 245], stars: [['Predictive models', 60, 150], ['Clustering', 150, 90], ['Genetic algorithms', 250, 120], ['Markov chains', 160, 185], [null, 215, 20]], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 1], [4, 2]] },
]
export const SKILLS_PLANE_Z = -208
