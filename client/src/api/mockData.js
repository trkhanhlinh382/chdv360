export const buildings = [
  {
    id: 'b1',
    name: 'Sunrise Residence',
    address: '12 Nguyen Huu Canh, Binh Thanh, HCM',
    coordinates: {
      lat: 10.7931,
      lng: 106.7216
    },
    images: [
      'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1400&q=80'
    ],
    amenities: ['Elevator', 'Parking', 'Security camera', 'Gym']
  },
  {
    id: 'b2',
    name: 'River View Loft',
    address: '88 Ben Van Don, District 4, HCM',
    coordinates: {
      lat: 10.7648,
      lng: 106.7059
    },
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1400&q=80'
    ],
    amenities: ['Rooftop', 'Laundry', '24/7 access', 'Cleaning service']
  },
  {
    id: 'b3',
    name: 'Downtown Studio Hub',
    address: '204 Vo Van Kiet, District 1, HCM',
    coordinates: {
      lat: 10.7699,
      lng: 106.6961
    },
    images: [
      'https://images.unsplash.com/photo-1472220625704-91e1462799b2?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1430285561322-7808604715df?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1400&q=80'
    ],
    amenities: ['Smart lock', 'Pet friendly', 'Mini mart nearby']
  }
];

export const apartments = [
  {
    id: 'a1',
    buildingId: 'b1',
    title: 'Studio Deluxe - High Floor',
    area: 28,
    price: {
      base: 6800000,
      electric: 3800,
      water: 120000,
      service: 250000
    },
    amenities: ['Balcony', 'Full furniture', 'Window', 'Air conditioner'],
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1400&q=80'
    ],
    contact: {
      phone: '0901234567',
      zalo: 'https://zalo.me/0901234567'
    }
  },
  {
    id: 'a2',
    buildingId: 'b1',
    title: '1BR Premium - Corner Unit',
    area: 42,
    price: {
      base: 10200000,
      electric: 3800,
      water: 120000,
      service: 350000
    },
    amenities: ['Sofa', 'Kitchen', 'Large wardrobe', 'Two windows'],
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1400&q=80'
    ],
    contact: {
      phone: '0901234567',
      zalo: 'https://zalo.me/0901234567'
    }
  },
  {
    id: 'a3',
    buildingId: 'b2',
    title: 'Studio Cozy - River View',
    area: 25,
    price: {
      base: 6200000,
      electric: 4000,
      water: 110000,
      service: 200000
    },
    amenities: ['River view', 'Queen bed', 'Smart TV'],
    images: [
      'https://images.unsplash.com/photo-1523755231516-e43fd2e8dca5?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1464146072230-91cabc968266?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1400&q=80'
    ],
    contact: {
      phone: '0908881122',
      zalo: 'https://zalo.me/0908881122'
    }
  },
  {
    id: 'a4',
    buildingId: 'b2',
    title: 'Loft Duplex',
    area: 55,
    price: {
      base: 12800000,
      electric: 4000,
      water: 110000,
      service: 390000
    },
    amenities: ['Loft floor', 'Bathtub', 'Island kitchen', 'Private workspace'],
    images: [
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80'
    ],
    contact: {
      phone: '0908881122',
      zalo: 'https://zalo.me/0908881122'
    }
  },
  {
    id: 'a5',
    buildingId: 'b3',
    title: 'Compact Smart Studio',
    area: 22,
    price: {
      base: 5600000,
      electric: 4200,
      water: 100000,
      service: 180000
    },
    amenities: ['Fingerprint lock', 'Work desk', 'Compact kitchen'],
    images: [
      'https://images.unsplash.com/photo-1499916078039-922301b0eb84?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80'
    ],
    contact: {
      phone: '0917123456'
    }
  }
];
