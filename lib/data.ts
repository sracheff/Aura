export const STYLISTS = [
  { id: 's1', name: 'Mia Rodriguez',  color: '#BA7517', bg: '#FEF0D3', revenue: 9420, commission: 45, clients: 28, tips: 680, rating: 4.9 },
  { id: 's2', name: 'Kayla Jones',    color: '#085041', bg: '#D6F0E8', revenue: 6750, commission: 40, clients: 22, tips: 420, rating: 4.8 },
  { id: 's3', name: 'Taylor Park',    color: '#3C3489', bg: '#EEEDFE', revenue: 4900, commission: 38, clients: 16, tips: 310, rating: 4.7 },
  { id: 's4', name: 'Leah Martinez',  color: '#712B13', bg: '#FAECE7', revenue: 3600, commission: 35, clients: 12, tips: 195, rating: 4.6 },
]

export const APPOINTMENTS = [
  { id: 'a1',  col: 'Mia',   start: '9:00',  dur: 90,  client: 'Camille Torres', svc: 'Color + Cut',       price: 285, status: 'completed', loyalty: 340  },
  { id: 'a2',  col: 'Mia',   start: '10:30', dur: 120, client: 'Jordan Lee',     svc: 'Balayage',           price: 340, status: 'completed', loyalty: 510  },
  { id: 'a3',  col: 'Mia',   start: '1:00',  dur: 90,  client: 'Sofia Patel',    svc: 'Color Retouch',      price: 165, status: 'arrived',   loyalty: 248  },
  { id: 'a4',  col: 'Mia',   start: '2:45',  dur: 90,  client: 'Ava Mitchell',   svc: 'Full Highlights',    price: 265, status: 'confirmed', loyalty: 398  },
  { id: 'a5',  col: 'Mia',   start: '4:15',  dur: 105, client: 'Nina Castillo',  svc: 'Color + Treatment',  price: 310, status: 'confirmed', loyalty: 465  },
  { id: 'a6',  col: 'Kayla', start: '9:00',  dur: 60,  client: 'Marcus Webb',    svc: 'Cut + Style',        price: 85,  status: 'completed', loyalty: 128  },
  { id: 'a7',  col: 'Kayla', start: '10:15', dur: 60,  client: 'Emma Davis',     svc: 'Blowout',            price: 75,  status: 'completed', loyalty: 113  },
  { id: 'a8',  col: 'Kayla', start: '11:30', dur: 45,  client: 'Olivia Chen',    svc: 'Bang Trim',          price: 25,  status: 'completed', loyalty: 38   },
  { id: 'a9',  col: 'Kayla', start: '1:00',  dur: 75,  client: 'Priya Sharma',   svc: 'Cut + Blowout',      price: 120, status: 'arrived',   loyalty: 180  },
  { id: 'a10', col: 'Kayla', start: '3:00',  dur: 60,  client: 'Zoe Martinez',   svc: 'Partial Highlights', price: 175, status: 'confirmed', loyalty: 263  },
  { id: 'a11', col: 'Taylor',start: '9:30',  dur: 45,  client: 'Alex Kim',       svc: 'Haircut',            price: 65,  status: 'completed', loyalty: 98   },
  { id: 'a12', col: 'Taylor',start: '1:30',  dur: 60,  client: 'Aisha Johnson',  svc: 'Cut + Style',        price: 95,  status: 'arrived',   loyalty: 143  },
  { id: 'a13', col: 'Taylor',start: '3:30',  dur: 75,  client: 'Megan Cho',      svc: 'Keratin Treatment',  price: 290, status: 'confirmed', loyalty: 435  },
  { id: 'a14', col: 'Leah',  start: '10:00', dur: 60,  client: 'Isabella Wong',  svc: 'Blowout',            price: 75,  status: 'completed', loyalty: 113  },
  { id: 'a15', col: 'Leah',  start: '2:30',  dur: 90,  client: 'Yara Okafor',    svc: 'Color Gloss',        price: 85,  status: 'confirmed', loyalty: 128  },
]

export const CLIENTS = [
  { id: 'c1',  name: 'Jordan Lee',     phone: '(404) 555-0181', email: 'jordan@email.com',  lastVisit: 'Apr 28', totalSpend: 4820, visits: 18, tier: 'Diamond', points: 2840, referrals: 8  },
  { id: 'c2',  name: 'Camille Torres', phone: '(404) 555-0182', email: 'cam@email.com',      lastVisit: 'May 2',  totalSpend: 3640, visits: 14, tier: 'Gold',    points: 1240, referrals: 6  },
  { id: 'c3',  name: 'Sofia Patel',    phone: '(404) 555-0183', email: 'sofia@email.com',    lastVisit: 'May 7',  totalSpend: 2980, visits: 11, tier: 'Gold',    points:  890, referrals: 4  },
  { id: 'c4',  name: 'Ava Mitchell',   phone: '(404) 555-0184', email: 'ava@email.com',      lastVisit: 'Apr 15', totalSpend: 2240, visits:  9, tier: 'Silver',  points:  620, referrals: 3  },
  { id: 'c5',  name: 'Nina Castillo',  phone: '(404) 555-0185', email: 'nina@email.com',     lastVisit: 'Mar 30', totalSpend: 3100, visits: 12, tier: 'Gold',    points: 1850, referrals: 2  },
  { id: 'c6',  name: 'Isabelle Wong',  phone: '(404) 555-0186', email: 'isa@email.com',      lastVisit: 'Apr 20', totalSpend: 1880, visits:  7, tier: 'Silver',  points:  480, referrals: 1  },
  { id: 'c7',  name: 'Priya Sharma',   phone: '(404) 555-0187', email: 'priya@email.com',    lastVisit: 'May 7',  totalSpend: 1440, visits:  6, tier: 'Bronze',  points:  320, referrals: 0  },
  { id: 'c8',  name: 'Emma Davis',     phone: '(404) 555-0188', email: 'emma@email.com',     lastVisit: 'Feb 12', totalSpend:  980, visits:  4, tier: 'Bronze',  points:  120, referrals: 0  },
  { id: 'c9',  name: 'Lily Thompson',  phone: '(404) 555-0189', email: 'lily@email.com',     lastVisit: 'Jan 28', totalSpend:  760, visits:  3, tier: 'Bronze',  points:   80, referrals: 0  },
  { id: 'c10', name: 'Marcus Webb',    phone: '(404) 555-0190', email: 'marc@email.com',     lastVisit: 'Mar 5',  totalSpend: 1120, visits:  5, tier: 'Silver',  points:  290, referrals: 1  },
  { id: 'c11', name: 'Zoe Martinez',   phone: '(404) 555-0191', email: 'zoe@email.com',      lastVisit: 'Apr 8',  totalSpend: 1660, visits:  7, tier: 'Silver',  points:  520, referrals: 2  },
  { id: 'c12', name: 'Dana Roberts',   phone: '(404) 555-0192', email: 'dana@email.com',     lastVisit: 'Feb 2',  totalSpend:  640, visits:  3, tier: 'Bronze',  points:   60, referrals: 0  },
]

export const SERVICES = [
  { id: 'sv1', name: 'Haircut & Style',    price: 85,  duration: 60,  commission: 45 },
  { id: 'sv2', name: 'Blowout',            price: 75,  duration: 45,  commission: 40 },
  { id: 'sv3', name: 'Color + Cut',        price: 285, duration: 120, commission: 45 },
  { id: 'sv4', name: 'Balayage',           price: 340, duration: 180, commission: 45 },
  { id: 'sv5', name: 'Full Highlights',    price: 265, duration: 150, commission: 45 },
  { id: 'sv6', name: 'Partial Highlights', price: 175, duration: 90,  commission: 40 },
  { id: 'sv7', name: 'Keratin Treatment',  price: 290, duration: 120, commission: 42 },
  { id: 'sv8', name: 'Color Gloss',        price: 85,  duration: 60,  commission: 40 },
  { id: 'sv9', name: 'Bang Trim',          price: 25,  duration: 15,  commission: 35 },
]

export const PRODUCTS = [
  { id: 'p1',  name: 'Olaplex No. 3',          brand: 'Olaplex',   type: 'retail',  qty: 24, reorder: 5,  cost: 12, price: 28,  margin: 57 },
  { id: 'p2',  name: 'Moroccanoil Treatment',   brand: 'Moroccanoil', type: 'retail', qty: 18, reorder: 4, cost: 18, price: 44,  margin: 59 },
  { id: 'p3',  name: 'Redken All Soft Shampoo', brand: 'Redken',    type: 'retail',  qty: 15, reorder: 4,  cost: 9,  price: 22,  margin: 59 },
  { id: 'p4',  name: 'Kerastase Masque',        brand: 'Kerastase', type: 'retail',  qty: 8,  reorder: 3,  cost: 22, price: 52,  margin: 58 },
  { id: 'p5',  name: 'Living Proof Dry Shampoo',brand: 'Living Proof', type: 'retail', qty: 3, reorder: 5, cost: 11, price: 26,  margin: 58 },
  { id: 'p6',  name: 'Wella Color 6/0',         brand: 'Wella',     type: 'backbar', qty: 42, reorder: 10, cost: 4,  price: 0,   margin: 0  },
  { id: 'p7',  name: 'Olaplex No. 1 Bond',      brand: 'Olaplex',   type: 'backbar', qty: 6,  reorder: 8,  cost: 28, price: 0,   margin: 0  },
  { id: 'p8',  name: 'Redken Shades EQ',        brand: 'Redken',    type: 'backbar', qty: 28, reorder: 8,  cost: 6,  price: 0,   margin: 0  },
  { id: 'p9',  name: 'Pravana Color 7N',        brand: 'Pravana',   type: 'backbar', qty: 2,  reorder: 6,  cost: 5,  price: 0,   margin: 0  },
]

export const REVENUE_MONTHLY = [
  { month: 'Jan', revenue: 18400, expenses: 11200, profit: 7200 },
  { month: 'Feb', revenue: 21200, expenses: 12100, profit: 9100 },
  { month: 'Mar', revenue: 23800, expenses: 12800, profit: 11000 },
  { month: 'Apr', revenue: 26100, expenses: 13400, profit: 12700 },
  { month: 'May', revenue: 28300, expenses: 14100, profit: 14200 },
]

export const REVENUE_WEEKLY = [
  { week: 'Wk 1', services: 5200, retail: 680 },
  { week: 'Wk 2', services: 5800, retail: 720 },
  { week: 'Wk 3', services: 6100, retail: 810 },
  { week: 'Wk 4', services: 5600, retail: 740 },
  { week: 'Wk 5', services: 6400, retail: 890 },
  { week: 'Wk 6', services: 6800, retail: 920 },
  { week: 'Wk 7', services: 7100, retail: 960 },
]

export const EXPENSES = [
  { id: 'e1', category: 'Rent',      vendor: 'Ocean Drive Properties', amount: 4800, type: 'fixed'    },
  { id: 'e2', category: 'Payroll',   vendor: 'ADP Payroll Services',    amount: 6200, type: 'variable' },
  { id: 'e3', category: 'Supplies',  vendor: 'Beauty Systems Group',    amount: 1400, type: 'variable' },
  { id: 'e4', category: 'Software',  vendor: 'Various SaaS Tools',      amount: 380,  type: 'fixed'    },
  { id: 'e5', category: 'Marketing', vendor: 'Meta / Google Ads',       amount: 620,  type: 'variable' },
]
