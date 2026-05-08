export const STYLISTS = [
  { id: 's1', name: 'Mia Rodriguez', initials: 'MR', color: '#BA7517', bg: '#FEF0D3', revenue: 9420, commission: 45, appointments: 28, tips: 680 },
  { id: 's2', name: 'Kayla Jones',   initials: 'KJ', color: '#085041', bg: '#D6F0E8', revenue: 6750, commission: 40, appointments: 22, tips: 420 },
  { id: 's3', name: 'Taylor Park',   initials: 'TP', color: '#3C3489', bg: '#EEEDFE', revenue: 4900, commission: 38, appointments: 16, tips: 310 },
  { id: 's4', name: 'Leah Martinez', initials: 'LM', color: '#712B13', bg: '#FAECE7', revenue: 3600, commission: 35, appointments: 12, tips: 195 },
]

export const APPOINTMENTS = [
  { id: 'a1', col: 0, start: 9,     dur: 1.5, client: 'Camille Torres', svc: 'Color + Cut',       price: 285, status: 'done',     loyalty: null   },
  { id: 'a2', col: 0, start: 10.5,  dur: 2,   client: 'Jordan Lee',     svc: 'Balayage',           price: 340, status: 'done',     loyalty: 'gold' },
  { id: 'a3', col: 0, start: 13,    dur: 1.5, client: 'Sofia Patel',    svc: 'Color Retouch',      price: 165, status: 'now',      loyalty: 'silver'},
  { id: 'a4', col: 0, start: 14.75, dur: 1.5, client: 'Ava Mitchell',   svc: 'Full Highlights',    price: 265, status: 'upcoming', loyalty: null   },
  { id: 'a5', col: 0, start: 16.25, dur: 1.75,client: 'Nina Castillo',  svc: 'Color + Treatment',  price: 310, status: 'upcoming', loyalty: 'gold' },
  { id: 'a6', col: 1, start: 9,     dur: 1,   client: 'Marcus Webb',    svc: 'Cut + Style',        price: 85,  status: 'done',     loyalty: null   },
  { id: 'a7', col: 1, start: 10.25, dur: 1,   client: 'Emma Davis',     svc: 'Blowout',            price: 75,  status: 'done',     loyalty: null   },
  { id: 'a8', col: 1, start: 11.5,  dur: 0.75,client: 'Olivia Chen',    svc: 'Bang Trim',          price: 25,  status: 'done',     loyalty: 'silver'},
  { id: 'a9', col: 1, start: 13,    dur: 1.25,client: 'Priya Sharma',   svc: 'Cut + Blowout',      price: 120, status: 'now',      loyalty: null   },
  { id:'a10', col: 1, start: 15,    dur: 1,   client: 'Zoe Martinez',   svc: 'Partial Highlights', price: 175, status: 'upcoming', loyalty: null   },
  { id:'a11', col: 2, start: 9.5,   dur: 0.75,client: 'Alex Kim',       svc: 'Haircut',            price: 65,  status: 'done',     loyalty: null   },
  { id:'a12', col: 2, start: 13.5,  dur: 1,   client: 'Aisha Johnson',  svc: 'Cut + Style',        price: 95,  status: 'now',      loyalty: 'gold' },
  { id:'a13', col: 2, start: 15.5,  dur: 1.25,client: 'Megan Cho',      svc: 'Keratin Treatment',  price: 290, status: 'upcoming', loyalty: null   },
  { id:'a14', col: 3, start: 10,    dur: 1,   client: 'Isabella Wong',  svc: 'Blowout',            price: 75,  status: 'done',     loyalty: null   },
  { id:'a15', col: 3, start: 14.5,  dur: 1.5, client: 'Yara Okafor',   svc: 'Color Gloss',        price: 85,  status: 'upcoming', loyalty: null   },
]

export const CLIENTS = [
  { id: 'c1',  name: 'Jordan Lee',     phone: '(404) 555-0181', email: 'jordan@email.com', lastVisit: 'Apr 28', spent: 4820, visits: 18, tier: 'gold',   points: 2840, status: 'member',  referrals: 8  },
  { id: 'c2',  name: 'Camille Torres', phone: '(404) 555-0182', email: 'cam@email.com',    lastVisit: 'May 2',  spent: 3640, visits: 14, tier: 'silver', points: 1240, status: 'member',  referrals: 6  },
  { id: 'c3',  name: 'Sofia Patel',    phone: '(404) 555-0183', email: 'sofia@email.com',  lastVisit: 'May 7',  spent: 2980, visits: 11, tier: 'silver', points:  890, status: 'member',  referrals: 4  },
  { id: 'c4',  name: 'Ava Mitchell',   phone: '(404) 555-0184', email: 'ava@email.com',    lastVisit: 'Apr 15', spent: 2240, visits:  9, tier: 'bronze', points:  620, status: 'active',  referrals: 3  },
  { id: 'c5',  name: 'Nina Castillo',  phone: '(404) 555-0185', email: 'nina@email.com',   lastVisit: 'Mar 30', spent: 3100, visits: 12, tier: 'gold',   points: 1850, status: 'member',  referrals: 2  },
  { id: 'c6',  name: 'Isabelle Wong',  phone: '(404) 555-0186', email: 'isa@email.com',    lastVisit: 'Apr 20', spent: 1880, visits:  7, tier: 'bronze', points:  480, status: 'active',  referrals: 1  },
  { id: 'c7',  name: 'Priya Sharma',   phone: '(404) 555-0187', email: 'priya@email.com',  lastVisit: 'May 7',  spent: 1440, visits:  6, tier: 'bronze', points:  320, status: 'active',  referrals: 0  },
  { id: 'c8',  name: 'Emma Davis',     phone: '(404) 555-0188', email: 'emma@email.com',   lastVisit: 'Feb 12', spent:  980, visits:  4, tier: null,     points:  120, status: 'atrisk',  referrals: 0  },
  { id: 'c9',  name: 'Lily Thompson',  phone: '(404) 555-0189', email: 'lily@email.com',   lastVisit: 'Jan 28', spent:  760, visits:  3, tier: null,     points:   80, status: 'atrisk',  referrals: 0  },
  { id:'c10',  name: 'Marcus Webb',    phone: '(404) 555-0190', email: 'marc@email.com',   lastVisit: 'Mar 5',  spent: 1120, visits:  5, tier: 'silver', points:  290, status: 'active',  referrals: 1  },
  { id:'c11',  name: 'Zoe Martinez',   phone: '(404) 555-0191', email: 'zoe@email.com',    lastVisit: 'Apr 8',  spent: 1660, visits:  7, tier: 'silver', points:  520, status: 'member',  referrals: 2  },
  { id:'c12',  name: 'Dana Roberts',   phone: '(404) 555-0192', email: 'dana@email.com',   lastVisit: 'Feb 2',  spent:  640, visits:  3, tier: null,     points:   60, status: 'atrisk',  referrals: 0  },
]

export const SERVICES = [
  { id: 'sv1', name: 'Balayage',         category: 'Color',    duration: 150, price: 340, commission: 45 },
  { id: 'sv2', name: 'Full Highlights',  category: 'Color',    duration: 120, price: 265, commission: 45 },
  { id: 'sv3', name: 'Color + Cut',      category: 'Color',    duration: 120, price: 285, commission: 45 },
  { id: 'sv4', name: 'Color Retouch',    category: 'Color',    duration:  90, price: 165, commission: 45 },
  { id: 'sv5', name: 'Blowout',          category: 'Styling',  duration:  45, price:  75, commission: 40 },
  { id: 'sv6', name: 'Haircut',          category: 'Cut',      duration:  45, price:  95, commission: 40 },
  { id: 'sv7', name: 'Keratin Treatment',category: 'Treatment',duration: 150, price: 290, commission: 42 },
  { id: 'sv8', name: 'Bang Trim',        category: 'Cut',      duration:  15, price:  25, commission: 40 },
  { id: 'sv9', name: 'Color Gloss',      category: 'Color',    duration:  45, price:  85, commission: 42 },
]

export const PRODUCTS = [
  { id:'p1', name:'Redken All Soft Shampoo',    category:'Haircare',  type:'retail',  qty:24, reorder:8,  cost:12, price:28, margin:57 },
  { id:'p2', name:'Olaplex No.3',               category:'Treatment', type:'retail',  qty:18, reorder:6,  cost:14, price:30, margin:53 },
  { id:'p3', name:'Wella SP Hydrate Mask',      category:'Treatment', type:'retail',  qty: 3, reorder:6,  cost:16, price:34, margin:53 },
  { id:'p4', name:'Kenra Platinum Silkening',   category:'Styling',   type:'retail',  qty:15, reorder:5,  cost:10, price:26, margin:62 },
  { id:'p5', name:'Redken Color Extend Shampoo',category:'Color Care',type:'retail',  qty: 2, reorder:8,  cost:11, price:25, margin:56 },
  { id:'p6', name:'Wella Koleston 8/0',         category:'Color',     type:'backbar', qty:12, reorder:5,  cost: 8, price: 0, margin: 0 },
  { id:'p7', name:'Wella Koleston 6/0',         category:'Color',     type:'backbar', qty: 9, reorder:5,  cost: 8, price: 0, margin: 0 },
  { id:'p8', name:'Olaplex No.1 Bond Multiplier',category:'Treatment',type:'backbar', qty: 1, reorder:3,  cost:60, price: 0, margin: 0 },
  { id:'p9', name:'Redken Shades EQ 8N',        category:'Color',     type:'backbar', qty:14, reorder:5,  cost: 7, price: 0, margin: 0 },
]

export const REVENUE_MONTHLY = [
  { month:'Jan', revenue:38200, expenses:16200, profit:22000 },
  { month:'Feb', revenue:40100, expenses:15800, profit:24300 },
  { month:'Mar', revenue:44800, expenses:17400, profit:27400 },
  { month:'Apr', revenue:46200, expenses:17400, profit:28800 },
  { month:'May', revenue:52780, expenses:18450, profit:34330 },
]

export const REVENUE_WEEKLY = [
  { week:'Mar 24', revenue:27800 },
  { week:'Mar 31', revenue:30200 },
  { week:'Apr 7',  revenue:28900 },
  { week:'Apr 14', revenue:34100 },
  { week:'Apr 21', revenue:36800 },
  { week:'Apr 28', revenue:39400 },
  { week:'May 5',  revenue:42180 },
]

export const EXPENSES = [
  { id:'e1', date:'May 6', vendor:'Redken',            category:'Supplies',  amount:1240, taxDeductible:true  },
  { id:'e2', date:'May 5', vendor:'Salon Lofts Rent',  category:'Rent',      amount:3800, taxDeductible:true  },
  { id:'e3', date:'May 4', vendor:'Square Footage Ins',category:'Insurance', amount: 420, taxDeductible:true  },
  { id:'e4', date:'May 3', vendor:'Costco Business',   category:'Supplies',  amount: 380, taxDeductible:true  },
  { id:'e5', date:'May 2', vendor:'Wella Pro',         category:'Color',     amount: 960, taxDeductible:true  },
]
