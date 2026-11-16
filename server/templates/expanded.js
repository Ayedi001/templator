/**
 * The expanded Nexora template collection.
 * Each design here has its own palette, typography, layout archetype, content
 * model and demo story — no template is a recolour of another.
 */

const P = {
  serif: "Georgia, 'Times New Roman', serif",
  display: "'Instrument Serif', Georgia, serif",
  editorial: "'Playfair Display', Georgia, serif",
  cormorant: "'Cormorant Garamond', Georgia, serif",
  fraunces: "'Fraunces', Georgia, serif",
  sans: "'DM Sans', Inter, system-ui, sans-serif",
  grotesk: "'Space Grotesk', system-ui, sans-serif",
  manrope: "'Manrope', system-ui, sans-serif",
  syne: "'Syne', system-ui, sans-serif",
  sora: "'Sora', system-ui, sans-serif",
  jakarta: "'Plus Jakarta Sans', system-ui, sans-serif",
  archivo: "'Archivo', system-ui, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
  bricolage: "'Bricolage Grotesque', system-ui, sans-serif",
};

const img = (name) => `/images/${name}.jpg`;
const item = (name, description, price, category, extra = {}) => ({ name, description, price, category, ...extra });
const review = (quote, name, role) => ({ quote, name, role });

function template(config, demo) {
  return {
    featured: false,
    tags: [],
    sections: ['marquee', 'featured', 'about', 'gallery', 'testimonials', 'cta'],
    radius: '14px',
    card: 'cover',
    nav: 'classic',
    ...config,
    demo: {
      eyebrow: 'Made for modern business',
      primaryCta: 'Explore now',
      secondaryCta: 'Our story',
      stats: [],
      features: [],
      gallery: [],
      testimonials: [],
      items: [],
      ...demo,
    },
  };
}

export const EXPANDED_TEMPLATES = [
  // ── HOME, PLANTS & SLOW LIVING ───────────────────────────────────────────
  template({
    id: 'nook-home', name: 'Nook', category: 'ecommerce', style: 'Considered homeware',
    description: 'A tactile, oat-toned homeware store with an editorial product story and a maker-led ethos.',
    featured: true, palette: { primary: '#2b2720', secondary: '#8a9176', accent: '#9a5b3d', bg: '#f4ede2', surface: '#fffaf2', text: '#2b2720', muted: '#7c7468', line: '#e3d6c5' },
    fonts: { heading: P.fraunces, body: P.sans }, layout: 'editorial', hero: 'split', card: 'overlap', nav: 'center', image: img('homeware'), image2: img('crafts'), radius: '6px', tags: ['homeware', 'interiors', 'slow living'],
  }, {
    eyebrow: 'Objects for everyday rituals', headline: 'A slower kind of home.', highlight: 'slower kind',
    subheadline: 'Hand-finished ceramics, honest materials and useful things made to be kept. Designed for the way you actually live.',
    primaryCta: 'Shop the collection', secondaryCta: 'Meet our makers',
    aboutTitle: 'Fewer things, made better.',
    aboutBody: 'Nook works with independent studios across Europe to bring together objects with warmth, weight and a reason to exist. We choose pieces we would keep for decades.',
    features: [{ title: 'Made in small runs', body: 'Every piece is produced in limited quantities by independent studios.' }, { title: 'Natural materials', body: 'Clay, oak, linen and wool — chosen for how they age.' }, { title: 'Built to be used', body: 'Functional objects first, decorative second.' }],
    stats: [{ value: '34', label: 'Independent makers' }, { value: '100%', label: 'Natural materials' }, { value: '10yr', label: 'Repair promise' }],
    items: [
      item('The Fold Vase', 'Hand-thrown stoneware in a chalk glaze.', 78, 'Ceramics', { tag: 'New' }),
      item('Washed Linen Throw', 'Stonewashed European flax with a raw edge.', 120, 'Textiles'),
      item('Oak Step Stool', 'Solid oak, hand-finished with natural oil.', 340, 'Furniture'),
      item('Cedar & Fig Candle', 'Hand-poured soy wax, 50-hour burn.', 38, 'Home fragrance'),
    ],
    gallery: [img('homeware'), img('crafts'), img('natural')],
    testimonials: [review('The vase has become the thing everyone asks about when they visit. Beautiful weight, beautiful glaze.', 'Imogen T.', 'Customer'), review('A shop that understands restraint. I have bought three things and kept all three.', 'Lucas B.', 'Customer')],
  }),
  template({
    id: 'verde-plants', name: 'Verde', category: 'ecommerce', style: 'Plant studio',
    description: 'A lush botanical storefront with a deep green palette, generous imagery and plant-care guidance.',
    palette: { primary: '#1f4d33', secondary: '#c46a3a', accent: '#c46a3a', bg: '#eef2e5', surface: '#fbfcf6', text: '#1d3527', muted: '#677967', line: '#d8e2cf' },
    fonts: { heading: P.bricolage, body: P.manrope }, layout: 'organic', hero: 'full', card: 'rounded', nav: 'pill', image: img('plants'), image2: img('flowers'), radius: '30px', tags: ['plants', 'botanical', 'garden'],
  }, {
    eyebrow: 'Plants for real homes', headline: 'Bring the outside in.', highlight: 'outside in.',
    subheadline: 'Hardy houseplants, handmade pots and the honest care advice you need to keep them thriving.',
    primaryCta: 'Find your plant', secondaryCta: 'Care guides',
    aboutTitle: 'Plants without the guesswork.',
    aboutBody: 'Verde is a small plant studio with a simple approach: match the plant to the light you actually have. Every order comes with a care card written by the team who grew it.',
    features: [{ title: 'Grown here', body: 'Most of our plants are propagated in our own greenhouse.' }, { title: 'Care that fits', body: 'A clear care card with every plant, based on your home.' }, { title: 'Doorstep delivery', body: 'Carefully packed, delivered within two days.' }],
    stats: [{ value: '80+', label: 'Plant varieties' }, { value: '2-day', label: 'Doorstep delivery' }, { value: '4.9', label: 'Customer rating' }],
    items: [
      item('Monstera Deliciosa', 'A generous, easy-going statement plant.', 48, 'Leafy', { tag: 'Easy care' }),
      item('Olive Tree', 'A sun-loving Mediterranean classic.', 120, 'Trees'),
      item('Terracotta Planter', 'Hand-thrown pot with a drainage saucer.', 28, 'Pots'),
      item('The Starter Kit', 'Three low-light plants, pots and care cards.', 64, 'Kits'),
    ],
    gallery: [img('plants'), img('flowers'), img('natural')],
    testimonials: [review('The care card was better than any plant book I have read. My monstera is thriving.', 'Nina P.', 'Customer'), review('Beautiful plants, sensible advice, no fuss. This is how it should be done.', 'Sam O.', 'Customer')],
  }),

  // ── FOOD, DRINK & HOSPITALITY DETAILS ────────────────────────────────────
  template({
    id: 'forno-pizza', name: 'Forno', category: 'food', style: 'Wood-fired pizzeria',
    description: 'A punchy, charred pizzeria template with brutalist type, a simple menu and a local-neighborhood voice.',
    featured: true, palette: { primary: '#191713', secondary: '#c7432e', accent: '#c7432e', bg: '#f3eee3', surface: '#fbf7ee', text: '#191713', muted: '#756c60', line: '#dcd2c1' },
    fonts: { heading: P.archivo, body: P.sans }, layout: 'brutalist', hero: 'split', card: 'bordered', nav: 'minimal', image: img('pizza'), image2: img('restaurant'), radius: '0px', tags: ['pizza', 'restaurant', 'casual'],
  }, {
    eyebrow: 'Wood-fired · Since 2016', headline: 'Fire. Flour. Few rules.', highlight: 'Few rules.',
    subheadline: 'Neapolitan-style pizza, natural wine and a room full of noise. Walk in, grab a stool, stay a while.',
    primaryCta: 'See the menu', secondaryCta: 'Find Forno',
    aboutTitle: 'Three days to make a pizza.',
    aboutBody: 'Our dough ferments for 72 hours. The tomatoes come from one family in Campania. The oven burns oak and beech. Everything else is kept deliberately simple.',
    features: [{ title: '72-hour dough', body: 'Slow-fermented and hand-stretched to order.' }, { title: 'One farm, one tomato', body: 'San Marzano tomatoes from a single grower.' }, { title: 'Natural wine', body: 'A short, ever-changing list of bottles we love.' }],
    stats: [{ value: '72h', label: 'Dough ferment' }, { value: '480°C', label: 'Oven heat' }, { value: '1', label: 'Tomato farm' }],
    items: [
      item('Margherita', 'Tomato, fior di latte, basil, olive oil.', 12, 'Pizza', { tag: 'The one' }),
      item('Nduja & Honey', 'Spicy nduja, mozzarella, hot honey.', 15, 'Pizza'),
      item('Marinara', 'Tomato, garlic, oregano. No cheese.', 10, 'Pizza'),
      item('Tiramisu for two', 'Made every morning, served in the dish.', 9, 'Dessert'),
    ],
    gallery: [img('pizza'), img('restaurant'), img('brunch')],
    testimonials: [review('The crust is blistered, chewy and perfect. We drove an hour and would do it again.', 'Lola M.', 'Regular'), review('No booking, no nonsense, brilliant pizza. The kind of place every neighborhood needs.', 'Marco R.', 'Local')],
  }),
  template({
    id: 'bitter-orange', name: 'Bitter Orange', category: 'food', style: 'Cocktail bar',
    description: 'A midnight-blue cocktail bar with amber light, a seductive serif voice and a menu built for browsing.',
    featured: true, palette: { primary: '#d99a5b', secondary: '#5e7c8a', accent: '#e05c3e', bg: '#10161a', surface: '#172026', text: '#f2e8d8', muted: '#a39888', line: '#2b363d' },
    fonts: { heading: P.cormorant, body: P.jakarta }, layout: 'immersive', hero: 'full', card: 'minimal', nav: 'minimal', image: img('cocktail'), image2: img('restaurant'), radius: '2px', tags: ['cocktails', 'bar', 'nightlife'],
  }, {
    eyebrow: 'A bar for the after-hours', headline: 'The evening starts here.', highlight: 'starts here.',
    subheadline: 'Modern cocktails, low light and a soundtrack you can talk over. Open Tuesday through Saturday, late.',
    primaryCta: 'View the menu', secondaryCta: 'Book a table',
    aboutTitle: 'A serious bar with a light touch.',
    aboutBody: 'Bitter Orange is a thirty-seat bar built around good ice, seasonal citrus and bartenders who would rather make you something you love than show off.',
    features: [{ title: 'House-made everything', body: 'Cordials, syrups and bitters made behind the bar.' }, { title: 'Seasonal list', body: 'A new menu every quarter, led by what is growing.' }, { title: 'Walk-ins welcome', body: 'Half the room is kept for spontaneous evenings.' }],
    stats: [{ value: '30', label: 'Seats' }, { value: '1am', label: 'Last pour' }, { value: '16', label: 'House cocktails' }],
    items: [
      item('Bitter Orange Negroni', 'Our house aperitivo, blood orange and rosemary.', 14, 'Signature', { tag: 'House favourite' }),
      item('Pear & Smoke', 'Poire eau de vie, lapsang, lemon, honey.', 15, 'Cocktails'),
      item('Salt & Soda', 'A clean, bright highball with olive.', 12, 'Low ABV'),
      item('Midnight Espresso', 'Coffee, cacao, amaro, cream.', 14, 'After dinner'),
    ],
    gallery: [img('cocktail'), img('restaurant'), img('cinema')],
    testimonials: [review('A proper cocktail bar. Thoughtful drinks, warm service, none of the theatre.', 'Ines D.', 'Guest'), review('The Bitter Orange Negroni is worth crossing town for. The room feels like a secret.', 'Jamie K.', 'Guest')],
  }),
  template({
    id: 'all-day-brunch', name: 'All Day', category: 'food', style: 'All-day brunch cafe',
    description: 'A bright, optimistic brunch cafe with sunny colours, a centered hero and a generous all-day menu.',
    palette: { primary: '#204a6b', secondary: '#f0a33c', accent: '#e56b4a', bg: '#fbf4df', surface: '#fffdf3', text: '#203544', muted: '#73808a', line: '#ecdfc3' },
    fonts: { heading: P.bricolage, body: P.sans }, layout: 'centered', hero: 'centered', card: 'rounded', nav: 'classic', image: img('brunch'), image2: img('bakery'), radius: '26px', tags: ['brunch', 'cafe', 'breakfast'],
  }, {
    eyebrow: 'Breakfast until close', headline: 'Good mornings, all day.', highlight: 'all day.',
    subheadline: 'Fluffy pancakes, proper coffee and a sunny room that makes it acceptable to order eggs at 4pm.',
    primaryCta: 'See the menu', secondaryCta: 'Find us',
    aboutTitle: 'A cafe that refuses to rush.',
    aboutBody: 'All Day is a neighborhood cafe built for long breakfasts and laptop-free weekends. Everything is made in-house, from the hot sauce to the granola.',
    features: [{ title: 'Served all day', body: 'Brunch is the menu, from open to close.' }, { title: 'House bakery', body: 'Sourdough, pastries and cakes baked each morning.' }, { title: 'Good coffee', body: 'A rotating local roaster, always dialled in.' }],
    stats: [{ value: '7am', label: 'Doors open' }, { value: 'All day', label: 'Brunch' }, { value: '4.8', label: 'Google rating' }],
    items: [
      item('Buttermilk Pancakes', 'Whipped mascarpone, salted maple, berries.', 14, 'Sweet', { tag: 'Most loved' }),
      item('Green Eggs', 'Sourdough, smashed avocado, herby eggs.', 13, 'Savoury'),
      item('The Big All Day', 'Eggs, bacon, sausage, beans, toast.', 18, 'Brunch'),
      item('Cinnamon Knot', 'Warm, sticky and made this morning.', 5, 'Bakery'),
    ],
    gallery: [img('brunch'), img('bakery'), img('coffee')],
    testimonials: [review('The pancakes are absurdly good. We bring everyone who visits the city here.', 'Tara J.', 'Regular'), review('Bright, kind and unhurried. Exactly what a Sunday morning needs.', 'Ben F.', 'Local')],
  }),

  // ── FASHION STORIES ──────────────────────────────────────────────────────
  template({
    id: 'vow-bridal', name: 'Vow', category: 'fashion', style: 'Bridal atelier',
    description: 'An ivory bridal atelier with champagne accents, an intimate editorial layout and appointment-led booking.',
    featured: true, palette: { primary: '#5e3b3e', secondary: '#c8a97a', accent: '#b7777f', bg: '#faf6f1', surface: '#fffdf9', text: '#342527', muted: '#8a7776', line: '#eaded4' },
    fonts: { heading: P.cormorant, body: P.jakarta }, layout: 'minimal', hero: 'editorial', card: 'minimal', nav: 'center', image: img('bridal'), image2: img('flowers'), radius: '999px', tags: ['bridal', 'wedding', 'atelier'],
  }, {
    eyebrow: 'The bridal atelier', headline: 'Made for the moment.', highlight: 'the moment.',
    subheadline: 'Quietly beautiful wedding dresses, made to be worn once and remembered forever. Private appointments in our studio.',
    primaryCta: 'Book an appointment', secondaryCta: 'The collection',
    aboutTitle: 'Dresses that feel like you.',
    aboutBody: 'Vow is a small bridal atelier focused on considered design and personal service. Every dress is made to order, with fittings tailored to the person who will wear it.',
    features: [{ title: 'Made to order', body: 'Each dress is cut for you in our London workroom.' }, { title: 'Private appointments', body: 'The studio is yours for the full appointment.' }, { title: 'Thoughtful alterations', body: 'Two fittings included with every made-to-order gown.' }],
    stats: [{ value: '12', label: 'Atelier gowns' }, { value: '2', label: 'Fittings included' }, { value: '6mo', label: 'Typical lead time' }],
    items: [
      item('The Marguerite', 'Silk crepe column with a hand-finished cowl back.', 3200, 'Gowns', { tag: 'Signature' }),
      item('The June', 'Soft tulle A-line with hand-embroidered flowers.', 4100, 'Gowns'),
      item('The Ellis', 'Tailored silk suit for a modern ceremony.', 2400, 'Tailoring'),
    ],
    gallery: [img('bridal'), img('flowers'), img('events')],
    testimonials: [review('I felt completely myself in my dress, which is the highest compliment I can give.', 'Amelia R.', 'Bride'), review('The atelier made the whole experience calm and personal. Nothing felt rushed.', 'Priya N.', 'Bride')],
  }),
  template({
    id: 'atelier-homme', name: 'Atelier Homme', category: 'fashion', style: 'Modern menswear',
    description: 'A structured, charcoal menswear atelier with camel accents, sharp tailoring and a discreet editorial tone.',
    palette: { primary: '#222222', secondary: '#a7774e', accent: '#a7774e', bg: '#ece8e0', surface: '#f8f5ef', text: '#222222', muted: '#766f65', line: '#d9d2c6' },
    fonts: { heading: P.editorial, body: P.archivo }, layout: 'classic', hero: 'split', card: 'minimal', nav: 'split', image: img('menswear'), image2: img('fashion-2'), radius: '2px', tags: ['menswear', 'tailoring', 'modern'],
  }, {
    eyebrow: 'Modern tailoring, made well', headline: 'A sharper kind of everyday.', highlight: 'everyday.',
    subheadline: 'Unstructured jackets, honest shirts and trousers that hold their line. Designed to be worn hard and often.',
    primaryCta: 'Shop the collection', secondaryCta: 'Book a fitting',
    aboutTitle: 'The uniform, refined.',
    aboutBody: 'Atelier Homme makes a small, deliberate wardrobe. We work with two Italian mills and a Portuguese shirtmaker, and we keep the collection tight enough to know every piece.',
    features: [{ title: 'Italian cloth', body: 'Wool and cotton from two family-run mills.' }, { title: 'Made in Portugal', body: 'Produced in a workshop we visit every year.' }, { title: 'Free alterations', body: 'Every jacket and trouser can be adjusted in store.' }],
    stats: [{ value: '2', label: 'Mills' }, { value: '3', label: 'Collections / year' }, { value: 'Free', label: 'Alterations' }],
    items: [
      item('The Unstructured Jacket', 'Soft shoulder, unlined body, Italian wool.', 520, 'Tailoring', { tag: 'Signature' }),
      item('Poplin Studio Shirt', 'Crisp cotton with a relaxed collar.', 145, 'Shirts'),
      item('Pleated Wool Trouser', 'Single pleat, tapered leg, side adjusters.', 240, 'Trousers'),
    ],
    gallery: [img('menswear'), img('fashion-2'), img('architecture')],
    testimonials: [review('The jacket fits like it was made for me, without the bespoke wait. I wear it constantly.', 'Daniel K.', 'Customer'), review('A rare men’s shop that edits properly. You can buy everything on the rail.', 'Alex M.', 'Customer')],
  }),

  // ── MODERN TECHNOLOGY ────────────────────────────────────────────────────
  template({
    id: 'northstar-fintech', name: 'Northstar', category: 'technology', style: 'Modern finance platform',
    description: 'A calm, confident fintech product site with product UI, trust signals and a clear onboarding path.',
    featured: true, palette: { primary: '#4338ca', secondary: '#6ee7b7', accent: '#6ee7b7', bg: '#f6f7fb', surface: '#ffffff', text: '#1f2340', muted: '#71758c', line: '#e5e7f1' },
    fonts: { heading: P.sora, body: P.sans }, layout: 'centered', hero: 'bento', card: 'rounded', nav: 'pill', image: img('fintech'), image2: img('consulting'), radius: '22px', tags: ['fintech', 'finance', 'product'], commerce: false,
  }, {
    eyebrow: 'Business finance, made clear', headline: 'Money, moving with clarity.', highlight: 'clarity.',
    subheadline: 'A single account for income, spending and forecasting. Built for independent businesses that want to understand their numbers.',
    primaryCta: 'Open an account', secondaryCta: 'See how it works',
    aboutTitle: 'Your finances should not need a translator.',
    aboutBody: 'Northstar brings banking, accounting and cash-flow forecasting into one calm view. No spreadsheets to reconcile, no surprises at month end.',
    features: [{ title: 'Real-time cash flow', body: 'See what is coming in and going out before it happens.' }, { title: 'Smart categorisation', body: 'Every transaction tagged and reconciled automatically.' }, { title: 'Forecasts you can trust', body: 'A rolling 90-day view built from your actual data.' }],
    stats: [{ value: '12k+', label: 'Businesses' }, { value: '99.99%', label: 'Uptime' }, { value: '£4.2B', label: 'Processed yearly' }],
    items: [
      item('Solo', 'For sole traders who want clarity from day one.', 0, 'Plan', { suffix: '/mo' }),
      item('Studio', 'For teams of up to ten with shared controls.', 19, 'Plan', { tag: 'Most popular', suffix: '/mo' }),
      item('Scale', 'Multi-entity accounts, forecasting and support.', 59, 'Plan', { suffix: '/mo' }),
    ],
    gallery: [img('fintech'), img('consulting'), img('saas')],
    testimonials: [review('We finally know what the next ninety days look like. The forecast alone changed how we run the studio.', 'Hana S.', 'Founder, Common Ground'), review('Clean, considered and genuinely useful. It feels like a product made by people who run a business.', 'Theo A.', 'Director, Fieldwork')],
  }),
  template({
    id: 'helix-security', name: 'Helix', category: 'technology', style: 'Cybersecurity infrastructure',
    description: 'A dark, high-contrast security platform with terminal details, technical credibility and a zero-trust story.',
    palette: { primary: '#6bffb8', secondary: '#61a6ff', accent: '#6bffb8', bg: '#05090b', surface: '#0a1114', text: '#e8fff6', muted: '#7e9c93', line: '#152a26' },
    fonts: { heading: P.syne, body: P.mono }, layout: 'grid', hero: 'type', card: 'bordered', nav: 'minimal', image: img('cybersecurity'), image2: img('saas'), radius: '4px', tags: ['security', 'cybersecurity', 'infrastructure'],
  }, {
    eyebrow: 'Zero-trust security infrastructure', headline: 'Trust is engineered.', highlight: 'engineered.',
    subheadline: 'Identity, access and threat detection in one control plane. Built for security teams who do not get to be wrong.',
    primaryCta: 'Read the docs', secondaryCta: 'Talk to security',
    aboutTitle: 'Security that assumes nothing.',
    aboutBody: 'Helix is a policy engine and detection platform for modern infrastructure. Every request is verified, every action is logged, and every alert arrives with the context to act on it.',
    features: [{ title: 'Continuous verification', body: 'Identity and device posture checked on every request.' }, { title: 'Detection with context', body: 'Alerts linked to the exact policy, actor and blast radius.' }, { title: 'Audit by default', body: 'Immutable logs and exportable evidence for every action.' }],
    stats: [{ value: '0', label: 'Trust by default' }, { value: '<50ms', label: 'Policy decision' }, { value: 'SOC 2', label: 'Type II' }],
    items: [
      item('Helix Control', 'Policy engine, identity graph and audit log.', 0, 'Platform', { tag: 'Core' }),
      item('Helix Detect', 'Behavioural threat detection with response playbooks.', 0, 'Platform'),
      item('Enterprise', 'Private deployment, custom SLAs and dedicated engineers.', 0, 'Platform'),
    ],
    gallery: [img('cybersecurity'), img('saas'), img('electronics')],
    testimonials: [review('Helix gave us a single place to reason about access. Our audit prep went from a week to an afternoon.', 'Mira L.', 'Head of Security'), review('The alerting is the best I have used. Context first, noise last.', 'Owen R.', 'Staff Engineer')],
  }),

  // ── WELLNESS & STUDIO CULTURE ────────────────────────────────────────────
  template({
    id: 'still-yoga', name: 'Still', category: 'health-beauty', style: 'Yoga & movement studio',
    description: 'A grounded, sage-and-cream yoga studio with a centered hero, class storytelling and a gentle booking flow.',
    featured: true, palette: { primary: '#4f6149', secondary: '#b78d72', accent: '#b78d72', bg: '#f1f0e6', surface: '#fbfaf4', text: '#30392d', muted: '#798272', line: '#dcdccd' },
    fonts: { heading: P.cormorant, body: P.manrope }, layout: 'organic', hero: 'centered', card: 'overlap', nav: 'classic', image: img('yoga'), image2: img('natural'), radius: '999px', tags: ['yoga', 'wellness', 'studio'],
  }, {
    eyebrow: 'A movement studio for everybody', headline: 'Come back to yourself.', highlight: 'yourself.',
    subheadline: 'Slow flow, breathwork and strength classes in a quiet studio with natural light. No performance required.',
    primaryCta: 'See the timetable', secondaryCta: 'New to Still?',
    aboutTitle: 'A quieter kind of practice.',
    aboutBody: 'Still is a neighborhood movement studio. Our classes are small, our teachers are experienced, and there is no expectation to be flexible, fast or already good at it.',
    features: [{ title: 'Small classes', body: 'Twelve mats maximum, every class.' }, { title: 'All levels', body: 'Clear options for every body and every day.' }, { title: 'Quiet room', body: 'No mirrors, no phones, no rush.' }],
    stats: [{ value: '12', label: 'Mats per class' }, { value: '28', label: 'Classes weekly' }, { value: '4.9', label: 'Student rating' }],
    items: [
      item('Slow Flow', 'A grounding vinyasa practice with long holds.', 18, 'Yoga', { tag: 'Most loved', duration: '60 min' }),
      item('Strength & Mobility', 'Low-impact strength for everyday movement.', 18, 'Movement', { duration: '45 min' }),
      item('Breathwork', 'Guided breath and meditation practice.', 14, 'Breath', { duration: '30 min' }),
      item('First Month', 'Unlimited classes for your first month.', 59, 'Passes'),
    ],
    gallery: [img('yoga'), img('natural'), img('beauty')],
    testimonials: [review('The first studio where I have not felt like I needed to keep up. It has changed my relationship with movement.', 'Naomi C.', 'Student'), review('Small classes, excellent teachers, and a room that feels like an exhale.', 'Marcus W.', 'Student')],
  }),
  template({
    id: 'ink-bone', name: 'Ink & Bone', category: 'health-beauty', style: 'Tattoo studio',
    description: 'A raw, high-contrast tattoo studio with artist profiles, flash work and appointment-led booking.',
    palette: { primary: '#eee7da', secondary: '#e04b35', accent: '#e04b35', bg: '#111010', surface: '#1a1817', text: '#eee7da', muted: '#a59d90', line: '#2c2926' },
    fonts: { heading: P.syne, body: P.grotesk }, layout: 'brutalist', hero: 'split', card: 'bordered', nav: 'minimal', image: img('tattoo'), image2: img('crafts'), radius: '0px', tags: ['tattoo', 'studio', 'art'],
  }, {
    eyebrow: 'Custom tattoos · By appointment', headline: 'Permanent work. Zero regrets.', highlight: 'Zero regrets.',
    subheadline: 'Fine-line, blackwork and custom pieces by a small team of artists. Consultations are free; good tattoos are not rushed.',
    primaryCta: 'Book a consultation', secondaryCta: 'Meet the artists',
    aboutTitle: 'Made with care, for the long haul.',
    aboutBody: 'Ink & Bone is a private studio with four resident artists. Every piece begins with a conversation, a sketch and a plan — never a rushed decision.',
    features: [{ title: 'Custom only', body: 'Original designs drawn for each client.' }, { title: 'Private studio', body: 'One appointment at a time, always.' }, { title: 'Aftercare included', body: 'A full aftercare kit and follow-up.' }],
    stats: [{ value: '4', label: 'Resident artists' }, { value: '10yr', label: 'Studio' }, { value: '18+', label: 'Strictly' }],
    items: [
      item('Consultation', 'A free conversation and sketch plan.', 0, 'Studio', { tag: 'Start here', duration: '30 min' }),
      item('Fine-line piece', 'Small, detailed work with a single needle.', 180, 'Tattoos', { duration: '2 hr' }),
      item('Blackwork sleeve', 'A larger composition built over sessions.', 1200, 'Tattoos'),
    ],
    gallery: [img('tattoo'), img('crafts'), img('portfolio')],
    testimonials: [review('They listened, sketched something better than I imagined, and the studio was spotless.', 'Rae B.', 'Client'), review('A thoughtful, calm experience for a first tattoo. I would not go anywhere else.', 'Ollie S.', 'Client')],
  }),

  // ── DESIGN-LED SERVICES ──────────────────────────────────────────────────
  template({
    id: 'fieldwork-interiors', name: 'Fieldwork', category: 'services', style: 'Interior design studio',
    description: 'A calm, material-led interior design studio with project storytelling, process and a quiet contact path.',
    featured: true, palette: { primary: '#3d342b', secondary: '#b1764f', accent: '#b1764f', bg: '#f3ede3', surface: '#fbf7ef', text: '#3d342b', muted: '#7f7465', line: '#e0d4c3' },
    fonts: { heading: P.fraunces, body: P.manrope }, layout: 'editorial', hero: 'editorial', card: 'overlap', nav: 'split', image: img('homeware'), image2: img('architecture'), radius: '4px', tags: ['interiors', 'design', 'architecture'],
  }, {
    eyebrow: 'Interior design studio · London', headline: 'Rooms with a point of view.', highlight: 'point of view.',
    subheadline: 'Considered interiors for homes that are actually lived in. We work with material, light and the people who use the space.',
    primaryCta: 'Start a project', secondaryCta: 'Selected work',
    aboutTitle: 'Good rooms are made, not styled.',
    aboutBody: 'Fieldwork is a small interior design studio led by two architects. We take on a handful of residential projects each year and work closely with makers, joiners and lighting designers.',
    features: [{ title: 'Full-service design', body: 'From plans and joinery to the final cushion.' }, { title: 'Material-first', body: 'A tactile, natural palette that gets better with age.' }, { title: 'Built with makers', body: 'Long-standing relationships with UK workshops.' }],
    stats: [{ value: '24', label: 'Homes completed' }, { value: '2', label: 'Projects at a time' }, { value: '12yr', label: 'Studio' }],
    items: [
      item('The Garden House', 'A full renovation of a Victorian terrace.', 0, 'Project', { tag: 'Featured' }),
      item('The Sea Apartment', 'A calm coastal flat for a family of four.', 0, 'Project'),
      item('Design Consultation', 'A two-hour session on your space and plans.', 450, 'Service'),
    ],
    gallery: [img('homeware'), img('architecture'), img('crafts')],
    testimonials: [review('They made a home that feels like us, only calmer. Every material has a reason.', 'Elena & Rob P.', 'Clients'), review('The studio listens first and designs second. That shows in the result.', 'James F.', 'Client')],
  }),
  template({
    id: 'eventide-events', name: 'Eventide', category: 'services', style: 'Wedding & event planning',
    description: 'A romantic, editorial celebration studio with event storytelling, packages and an enquiry-first flow.',
    palette: { primary: '#5a3148', secondary: '#c6a15b', accent: '#c8849b', bg: '#f6edf0', surface: '#fdf8fa', text: '#412536', muted: '#8d747f', line: '#ead9e0' },
    fonts: { heading: P.editorial, body: P.jakarta }, layout: 'minimal', hero: 'full', card: 'minimal', nav: 'center', image: img('events'), image2: img('flowers'), radius: '20px', tags: ['events', 'weddings', 'planning'],
  }, {
    eyebrow: 'Weddings, parties and occasions', headline: 'Moments, made unforgettable.', highlight: 'unforgettable.',
    subheadline: 'Full-service planning for celebrations with soul. We handle the details so you can feel present for all of it.',
    primaryCta: 'Plan with us', secondaryCta: 'Explore celebrations',
    aboutTitle: 'An eye for the extraordinary.',
    aboutBody: 'Eventide is a small planning studio working across London and the coast. We design celebrations with warmth, texture and a sense of place — then run them with military calm.',
    features: [{ title: 'Full planning', body: 'From the first brief to the final taxi.' }, { title: 'Venue sourcing', body: 'A network of spaces you will not find in directories.' }, { title: 'On-the-day direction', body: 'A calm team keeping every detail on track.' }],
    stats: [{ value: '120+', label: 'Events' }, { value: '14yr', label: 'Planning' }, { value: '2', label: 'Lead planners' }],
    items: [
      item('Full Wedding Planning', 'Everything from concept to the last dance.', 6500, 'Weddings', { tag: 'Most booked' }),
      item('Celebration Design', 'Concept, styling and supplier curation.', 2800, 'Events'),
      item('On-the-day Coordination', 'A calm hand on the day itself.', 1400, 'Events'),
    ],
    gallery: [img('events'), img('flowers'), img('restaurant')],
    testimonials: [review('Our wedding was the best day of our lives, and we actually got to enjoy it. They are extraordinary.', 'Cleo & Sam', 'Wedding clients'), review('Warm, calm and incredibly organised. I trusted them completely.', 'Priya M.', 'Client')],
  }),

  // ── PROFESSIONAL SERVICES ────────────────────────────────────────────────
  template({
    id: 'ledger-accounting', name: 'Ledger & Co', category: 'corporate', style: 'Modern accounting firm',
    description: 'A friendly, trustworthy accounting firm with plain-English positioning, service tiers and a booking CTA.',
    palette: { primary: '#132f3f', secondary: '#bd7a45', accent: '#bd7a45', bg: '#f2f4f5', surface: '#fbfcfc', text: '#132f3f', muted: '#6c7a80', line: '#dbe1e3' },
    fonts: { heading: P.editorial, body: P.sans }, layout: 'classic', hero: 'split', card: 'minimal', nav: 'classic', image: img('finance'), image2: img('consulting'), radius: '6px', tags: ['accounting', 'finance', 'advisory'],
  }, {
    eyebrow: 'Accounting for independent businesses', headline: 'Numbers, in plain English.', highlight: 'plain English.',
    subheadline: 'Bookkeeping, tax and annual accounts from a small team that explains things clearly and answers the phone.',
    primaryCta: 'Book a discovery call', secondaryCta: 'What we do',
    aboutTitle: 'A steady hand on the numbers.',
    aboutBody: 'Ledger & Co works with freelancers, studios and growing companies. We keep the books clean, the deadlines calm and the advice genuinely useful.',
    features: [{ title: 'Fixed monthly fees', body: 'No surprise invoices, ever.' }, { title: 'A real accountant', body: 'One named contact who knows your business.' }, { title: 'Year-round support', body: 'Questions are included, not billed by the minute.' }],
    stats: [{ value: '340', label: 'Businesses supported' }, { value: '£12M', label: 'Tax savings found' }, { value: '1', label: 'Named accountant' }],
    items: [
      item('Bookkeeping', 'Monthly reconciliation and clean, useful reports.', 120, 'Service', { suffix: '/mo' }),
      item('Annual Accounts', 'Statutory accounts and corporation tax.', 950, 'Service'),
      item('Self Assessment', 'A straightforward return, handled.', 320, 'Service', { tag: 'Most booked' }),
    ],
    gallery: [img('finance'), img('consulting'), img('law')],
    testimonials: [review('The first accountant who has made me feel like I understand my own business.', 'Ruth E.', 'Founder'), review('Calm, clear and always ahead of the deadline. We moved everything over within a month.', 'Tom D.', 'Director')],
  }),

  // ── MODERN MEDIA ─────────────────────────────────────────────────────────
  template({
    id: 'airwaves-podcast', name: 'Airwaves', category: 'media', style: 'Podcast network',
    description: 'A sharp, black-and-acid podcast network with episode cards, host profiles and a strong listening CTA.',
    featured: true, palette: { primary: '#111111', secondary: '#d7ff3f', accent: '#d7ff3f', bg: '#f0efe9', surface: '#faf9f4', text: '#111111', muted: '#71716a', line: '#d9d8ce' },
    fonts: { heading: P.bricolage, body: P.mono }, layout: 'grid', hero: 'type', card: 'bordered', nav: 'minimal', image: img('podcast'), image2: img('consulting'), radius: '2px', tags: ['podcast', 'audio', 'media'],
  }, {
    eyebrow: 'An independent podcast network', headline: 'Stories worth pressing play for.', highlight: 'pressing play',
    subheadline: 'Long-form conversations about design, work and the people quietly changing both. New episodes every Tuesday.',
    primaryCta: 'Listen to the latest', secondaryCta: 'All shows',
    aboutTitle: 'Good audio, made slowly.',
    aboutBody: 'Airwaves makes three shows about the way people work. No hot takes, no ad breaks in the middle of a thought — just careful conversations, edited properly.',
    features: [{ title: 'Three shows', body: 'Design, independent business and the spaces in between.' }, { title: 'New every week', body: 'A fresh episode each Tuesday morning.' }, { title: 'Ad-light', body: 'One sponsor per episode, read by the host.' }],
    stats: [{ value: '3', label: 'Shows' }, { value: '120k', label: 'Monthly listeners' }, { value: '180+', label: 'Episodes' }],
    items: [
      item('The Long Way Round', 'A conversation with architect Mala Okafor.', 0, 'Design', { tag: 'Latest', author: 'Airwaves', readTime: '54 min' }),
      item('Small Business, Big Questions', 'Pricing, boundaries and the myth of scale.', 0, 'Business', { author: 'Airwaves', readTime: '48 min' }),
      item('Spaces Between', 'What a studio actually needs.', 0, 'Spaces', { author: 'Airwaves', readTime: '42 min' }),
    ],
    gallery: [img('podcast'), img('consulting'), img('agency')],
    testimonials: [review('The only podcast I save for a long walk. It respects your attention.', 'Cleo M.', 'Listener'), review('Consistently thoughtful, beautifully edited and never too long.', 'Rory B.', 'Listener')],
  }),
  template({
    id: 'silver-screen', name: 'Silver Screen', category: 'media', style: 'Film journal',
    description: 'A cinematic film journal in darkness and cream, with long-form criticism, interviews and a strong archive feel.',
    palette: { primary: '#c94035', secondary: '#c9b99b', accent: '#c94035', bg: '#0f0e0d', surface: '#171513', text: '#f0e9da', muted: '#a39a8a', line: '#2f2b26' },
    fonts: { heading: P.cormorant, body: P.archivo }, layout: 'editorial', hero: 'full', card: 'minimal', nav: 'center', image: img('cinema'), image2: img('photography'), radius: '0px', tags: ['film', 'journal', 'criticism'],
  }, {
    eyebrow: 'A journal of cinema', headline: 'Cinema, in writing.', highlight: 'in writing.',
    subheadline: 'Long-form criticism, director interviews and a love of the big screen. Published slowly, on purpose.',
    primaryCta: 'Read the latest', secondaryCta: 'The archive',
    aboutTitle: 'A slower film journal.',
    aboutBody: 'Silver Screen is an independent film journal published every two weeks. We write about the films that stay with you and the people who make them.',
    features: [{ title: 'Long-form criticism', body: 'Essays with room to think.' }, { title: 'Director interviews', body: 'Conversations about craft, not press junkets.' }, { title: 'The archive', body: 'A decade of writing, properly indexed.' }],
    stats: [{ value: '11', label: 'Years publishing' }, { value: '24', label: 'Issues / year' }, { value: '28k', label: 'Readers' }],
    items: [
      item('The Last Frame', 'A career-spanning conversation with Roger Deakins.', 0, 'Interview', { tag: 'Featured', author: 'Maya Hart', readTime: '18 min' }),
      item('The Quiet Thriller', 'How tension works without a score.', 0, 'Criticism', { author: 'Idris Cole', readTime: '12 min' }),
      item('Cinema of the Everyday', 'A new wave of films about ordinary life.', 0, 'Feature', { author: 'Ana Reis', readTime: '15 min' }),
    ],
    gallery: [img('cinema'), img('photography'), img('portfolio')],
    testimonials: [review('The film writing I look forward to most. Thoughtful, unhurried and never snobbish.', 'Daniel A.', 'Reader'), review('A journal that still believes a review can be a piece of writing.', 'Harriet L.', 'Subscriber')],
  }),

  // ── PORTFOLIO & PROPERTY ─────────────────────────────────────────────────
  template({
    id: 'kite-motion', name: 'Kite', category: 'portfolio', style: 'Motion design studio',
    description: 'A kinetic, electric-blue motion studio with a bento portfolio, process notes and a playful confidence.',
    featured: true, palette: { primary: '#4f7cff', secondary: '#f4e55b', accent: '#f4e55b', bg: '#0c1530', surface: '#111d3c', text: '#f5f7ff', muted: '#9aa6cc', line: '#24315a' },
    fonts: { heading: P.syne, body: P.archivo }, layout: 'bento', hero: 'bento', card: 'cover', nav: 'split', image: img('portfolio'), image2: img('cinema'), radius: '16px', tags: ['motion', 'portfolio', 'studio'],
  }, {
    eyebrow: 'Motion design studio', headline: 'Motion with a pulse.', highlight: 'a pulse.',
    subheadline: 'We make title sequences, product films and brand motion for people who care how things move.',
    primaryCta: 'Watch the reel', secondaryCta: 'Start a project',
    aboutTitle: 'Built to move people.',
    aboutBody: 'Kite is a four-person motion studio. We combine animation, 3D and a strong edit brain to make work that feels alive without shouting.',
    features: [{ title: 'Direction & design', body: 'Concepts boards, styleframes and art direction.' }, { title: 'Animation & 3D', body: '2D, 3D and everything in between.' }, { title: 'Editorial', body: 'The edit is where the story gets made.' }],
    stats: [{ value: '4', label: 'People' }, { value: '28', label: 'Awards' }, { value: '9yr', label: 'Making' }],
    items: [
      item('Aperture', 'A launch film for a new camera system.', 0, 'Film', { tag: 'Latest' }),
      item('Northstar', 'Product motion and title design.', 0, 'Brand'),
      item('After Hours', 'A self-initiated short about the city at night.', 0, 'Short'),
    ],
    gallery: [img('portfolio'), img('cinema'), img('photography')],
    testimonials: [review('They understood the idea before we finished explaining it. The film did numbers we did not expect.', 'Nils H.', 'Brand Director'), review('A rare studio that can do craft and strategy in the same breath.', 'Mara J.', 'Founder')],
  }),
  template({
    id: 'atlas-commercial', name: 'Atlas Commercial', category: 'real-estate', style: 'Commercial property',
    description: 'A precise, data-led commercial property site with building listings, market insight and tenant-focused storytelling.',
    palette: { primary: '#243746', secondary: '#b48a57', accent: '#b48a57', bg: '#f1f3f4', surface: '#fbfcfc', text: '#243746', muted: '#6e7c86', line: '#dbe1e4' },
    fonts: { heading: P.sora, body: P.sans }, layout: 'grid', hero: 'split', card: 'bordered', nav: 'split', image: img('commercial'), image2: img('architecture'), radius: '4px', tags: ['commercial', 'offices', 'property'],
  }, {
    eyebrow: 'Commercial property, clearly presented', headline: 'Space for ambitious business.', highlight: 'ambitious business.',
    subheadline: 'Offices, studios and light industrial space across the city. Straight answers, good buildings and no jargon.',
    primaryCta: 'Browse space', secondaryCta: 'Talk to the team',
    aboutTitle: 'Buildings that work harder.',
    aboutBody: 'Atlas Commercial represents a focused portfolio of well-located buildings. We know every site, every landlord and what it actually costs to operate.',
    features: [{ title: 'Focused portfolio', body: 'A tight list of verified, well-managed buildings.' }, { title: 'Transparent costs', body: 'Service charge and fit-out estimates up front.' }, { title: 'Tenant-first', body: 'We stay involved after the lease is signed.' }],
    stats: [{ value: '£240M', label: 'Space transacted' }, { value: '38', label: 'Buildings' }, { value: '92%', label: 'Occupancy' }],
    items: [
      item('The Foundry', 'A converted ironworks with 12,000 sq ft of studio space.', 0, 'Offices', { tag: 'Featured', meta: '12,000 sq ft · Shoreditch' }),
      item('Northbank House', 'Grade A offices with river views and secure parking.', 0, 'Offices', { meta: '24,000 sq ft · Bankside' }),
      item('Atlas Yard', 'Light industrial units with yard access.', 0, 'Industrial', { meta: '4,500 sq ft · Hackney' }),
    ],
    gallery: [img('commercial'), img('architecture'), img('consulting')],
    testimonials: [review('They found us a building that actually fitted how we work, not just the square footage.', 'Hugo P.', 'COO, Studio North'), review('Refreshingly direct about costs and constraints. We signed in three weeks.', 'Nadia S.', 'Founder')],
  }),

  // ── ESCAPE & LEARNING ────────────────────────────────────────────────────
  template({
    id: 'fernwood-retreat', name: 'Fernwood', category: 'hospitality', style: 'Cabins & retreat',
    description: 'A darker, woodland retreat site with full-bleed nature, studio cabins and a slow-holiday philosophy.',
    featured: true, palette: { primary: '#b56a3f', secondary: '#8d9b7b', accent: '#b56a3f', bg: '#131711', surface: '#1b2019', text: '#efe9d9', muted: '#a7a292', line: '#30362c' },
    fonts: { heading: P.fraunces, body: P.sans }, layout: 'immersive', hero: 'full', card: 'overlap', nav: 'minimal', image: img('cabin'), image2: img('natural'), radius: '6px', tags: ['cabins', 'retreat', 'nature'],
  }, {
    eyebrow: 'Off-grid cabins in the woods', headline: 'A slower kind of stay.', highlight: 'slower kind',
    subheadline: 'Six architect-designed cabins in a quiet wood. Wood burner, outdoor bath and absolutely no schedule.',
    primaryCta: 'Check availability', secondaryCta: 'Explore the cabins',
    aboutTitle: 'Nothing to do, by design.',
    aboutBody: 'Fernwood is a small off-grid retreat. The cabins run on solar, the water comes from a spring, and the only notifications are the birds.',
    features: [{ title: 'Off-grid', body: 'Solar power, spring water and a wood burner.' }, { title: 'Outdoor baths', body: 'Every cabin has a private bath under the trees.' }, { title: 'No wifi', body: 'A proper switch-off. There is a landline for emergencies.' }],
    stats: [{ value: '6', label: 'Cabins' }, { value: '40', label: 'Acres of wood' }, { value: '0', label: 'Wifi' }],
    items: [
      item('The Birch Cabin', 'A studio cabin with a wood burner and outdoor bath.', 220, 'Cabins', { tag: 'Most loved', meta: '2 guests · Wood burner · Outdoor bath' }),
      item('The Fern Cabin', 'A larger cabin with a separate reading room.', 295, 'Cabins', { meta: '2 guests · Reading room · Forest view' }),
      item('The Woodland House', 'Three bedrooms and a private clearing.', 620, 'Houses', { meta: '6 guests · Private clearing · Fire pit' }),
    ],
    gallery: [img('cabin'), img('natural'), img('architecture')],
    testimonials: [review('We slept better than we have all year. The cabin is beautifully considered, and the silence is the luxury.', 'Hana & Tom', 'Guests'), review('No wifi, no pretence, just a fire, a bath and the trees. Exactly what we needed.', 'Nina R.', 'Guest')],
  }),
  template({
    id: 'note-music-school', name: 'Note', category: 'education', style: 'Music school',
    description: 'A warm, marigold-and-plum music school with instrument lessons, teacher profiles and a trial-lesson CTA.',
    palette: { primary: '#4a2545', secondary: '#e5a93c', accent: '#e5a93c', bg: '#fbf5e7', surface: '#fffdf7', text: '#3a2338', muted: '#82726f', line: '#ecdfc7' },
    fonts: { heading: P.bricolage, body: P.sans }, layout: 'organic', hero: 'centered', card: 'rounded', nav: 'center', image: img('music'), image2: img('education'), radius: '24px', tags: ['music', 'education', 'lessons'],
  }, {
    eyebrow: 'Music lessons for every age', headline: 'Find your note.', highlight: 'your note.',
    subheadline: 'Piano, guitar, voice and drums taught by working musicians. One-to-one lessons in a warm, unhurried studio.',
    primaryCta: 'Book a trial lesson', secondaryCta: 'Meet the teachers',
    aboutTitle: 'Music without the pressure.',
    aboutBody: 'Note is a neighborhood music school with eight teaching rooms and a small stage. We teach the music you want to play, at the pace that works for you.',
    features: [{ title: 'One-to-one', body: 'Private lessons built around your goals.' }, { title: 'Working musicians', body: 'Every teacher performs and teaches.' }, { title: 'Regular showcases', body: 'A welcoming stage, twice a year.' }],
    stats: [{ value: '8', label: 'Teaching rooms' }, { value: '14', label: 'Teachers' }, { value: '4–74', label: 'Ages taught' }],
    items: [
      item('Piano', 'Classical, jazz or pop — your choice.', 34, 'Instrument', { tag: 'Most popular', duration: '30 min' }),
      item('Guitar', 'Acoustic or electric, from first chords to solos.', 34, 'Instrument', { duration: '30 min' }),
      item('Singing', 'Technique, confidence and repertoire.', 38, 'Instrument', { duration: '30 min' }),
      item('Trial Lesson', 'A first session to meet your teacher.', 15, 'Trial', { duration: '30 min' }),
    ],
    gallery: [img('music'), img('education'), img('books')],
    testimonials: [review('My daughter has gone from nervous to performing on stage in a year. The teachers are wonderful.', 'Claire M.', 'Parent'), review('I started piano at 54 and have never looked forward to a Tuesday more.', 'Martin E.', 'Student')],
  }),
];
