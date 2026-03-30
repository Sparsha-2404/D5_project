/**
 * D5 Image Library
 * All images are from Unsplash (free, no attribution required for web use)
 * To replace any image, just change the URL to your own image URL or local path
 *
 * LOCAL IMAGE USAGE:
 *   1. Put your image in /frontend/src/assets/images/
 *   2. Import it: import myImg from '../assets/images/my-image.jpg'
 *   3. Replace the URL below with the imported variable
 */

// ── HERO / BANNER ──────────────────────────────────────────────
export const IMAGES = {

  // Login page left panel hero background
  heroBg: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1200&q=80',
  // Purple vegetables flat lay (matches client design exactly)

  // Home page hero banner background
  homeBanner: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1400&q=80',
  // Colorful vegetables on purple background

  // ── TOP PICKS (matches client design: kale, strawberries, carrots) ──
  topPicks: [
    {
      name: 'Fresh Green Kale',
      category: 'grocery',
      price: 8,
      color: '#5A9E3A',
      image: 'https://images.unsplash.com/photo-1556801712-76c379e31a2f?w=300&q=80',
    },
    {
      name: 'Ripe Strawberries',
      category: 'grocery',
      price: 12,
      color: '#C8355A',
      image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&q=80',
    },
    {
      name: 'Purple Heirloom Carrots',
      category: 'grocery',
      price: 10,
      color: '#6B4F8A',
      image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300&q=80',
    },
    {
      name: 'Organic Blueberries',
      category: 'grocery',
      price: 15,
      color: '#3A2E8A',
      image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=300&q=80',
    },
    {
      name: 'House Cleaning',
      category: 'housekeeping',
      price: 120,
      color: '#6B4F8A',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80',
    },
    {
      name: 'Full Body Massage',
      category: 'spa_wellness',
      price: 350,
      color: '#8A2E6A',
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&q=80',
    },
  ],

  // ── SERVICE CATEGORIES (with real photos) ──
  categories: {
    grocery:      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
    housekeeping: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
    maintenance:  'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&q=80',
    utility:      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    spa_wellness: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400&q=80',
    facilities:   'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&q=80',
  },

  // ── FACILITY IMAGES ──
  facilities: {
    gym:        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80',
    pool:       'https://images.unsplash.com/photo-1570824104453-508955ab713e?w=600&q=80',
    clubhouse:  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80',
    other:      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
  },

  // ── SERVICE DETAIL BANNERS ──
  serviceBanners: {
    grocery:      'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&q=80',
    housekeeping: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80',
    maintenance:  'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200&q=80',
    utility:      'https://images.unsplash.com/photo-1604762524889-3e2fcc145683?w=1200&q=80',
    spa_wellness: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80',
    facilities:   'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&q=80',
  },
};

export default IMAGES;
