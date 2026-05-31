import {
  getResidentEntityList,
  getResidentBuildings,
  getResidentApartmentById,
  getResidentDashboardReport,
  getResidentRoomById,
  getResidentRoomsByApartment,
  residentLogin,
  mockRequest,
  shouldUseResidentApi,
  shouldUseCustomServer,
  customServerRequest
} from '../../api/client';

const BUILDING_PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1472220625704-91e1462799b2?auto=format&fit=crop&w=1400&q=80'
];

const ROOM_PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1400&q=80'
];

function formatCurrencyValue(value) {
  return Number.isFinite(value) ? value : 0;
}

function buildCoordinatesFromId(id) {
  const numericId = Number(id) || 0;
  const lat = 10.75 + (numericId % 20) * 0.004;
  const lng = 106.62 + (numericId % 20) * 0.005;
  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6))
  };
}

function buildGoogleMapsSearchUrl(address) {
  if (!address) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function buildResidentBuildingAddress(item) {
  const baseAddress = (item.fullAddress || item.address || '').trim();
  const region = (item.location?.name || '').trim();

  if (!region) {
    return baseAddress || item.name;
  }

  if (baseAddress && baseAddress.includes(region)) {
    return baseAddress;
  }

  if (!baseAddress) {
    return `Khu vực : ${region}`;
  }

  return `${baseAddress} - Khu vực : ${region}`;
}

function buildBuildingAmenities(item) {
  const amenities = [];

  if (item.numberRooms) {
    amenities.push(`${item.numberRooms} phong`);
  }

  if (item.paymentDay) {
    amenities.push(`Thanh toan ngay ${item.paymentDay}`);
  }

  amenities.push(item.active ? 'Dang hoat dong' : 'Tam ngung');
  return amenities;
}

function buildRoomAmenities(item) {
  return [item.type?.name, item.floor?.name, item.status?.title, `${item.maxTenants || 0} người`]
    .filter(Boolean);
}

function extractRoomImages(item, fallbackImage) {
  const attachmentImages = (item.attachments || [])
    .map((attachment) => attachment.location)
    .filter(Boolean);

  if (attachmentImages.length > 0) {
    return attachmentImages;
  }

  if (item.images?.length) {
    return item.images;
  }

  return [fallbackImage];
}

function extractBuildingImages(item) {
  const attachmentImages = (item.attachments || [])
    .map((attachment) => attachment.location)
    .filter(Boolean);

  if (attachmentImages.length > 0) {
    return attachmentImages;
  }

  if (item.images?.length) {
    return item.images;
  }

  return [
    BUILDING_PLACEHOLDER_IMAGES[item.id % BUILDING_PLACEHOLDER_IMAGES.length]
  ];
}

function mapResidentBuilding(item) {
  const region = (item.location?.name || '').trim();
  const address = buildResidentBuildingAddress(item);
  const fees = (item.fees || []).map((f) => ({
    id: f.id,
    name: f.name,
    price: f.price,
    unit: f.unit
  }));
  return {
    id: String(item.id),
    code: item.code,
    name: item.name,
    region,
    address,
    mapsSearchUrl: buildGoogleMapsSearchUrl(address || item.name),
    images: extractBuildingImages(item),
    fees,
    amenities: fees.length ? fees.map((f) => f.name) : buildBuildingAmenities(item),
    coordinates: item.coordinates || buildCoordinatesFromId(item.id),
    numberRooms: item.numberRooms || 0,
    ownerId: item.ownerId,
    paymentDay: item.paymentDay,
    active: item.active
  };
}

function mapResidentRoom(item) {
  const placeholderImage = ROOM_PLACEHOLDER_IMAGES[item.id % ROOM_PLACEHOLDER_IMAGES.length];

  return {
    id: String(item.id),
    buildingId: String(item.apartmentId),
    title: item.type?.name ? `${item.name} - ${item.type.name}` : item.name,
    code: item.code,
    area: item.size || 0,
    maxTenants: item.maxTenants || 0,
    deposit: formatCurrencyValue(item.deposit),
    status: item.status,
    floor: item.floor,
    type: item.type,
    apartment: item.apartment,
    attachments: item.attachments || [],
    assets: item.assets || [],
    beds: item.beds || [],
    numberActiveBeds: item.numberActiveBeds || 0,
    numberBeds: item.numberBeds || 0,
    price: {
      base: formatCurrencyValue(item.price),
      electric: 0,
      water: 0,
      service: 0
    },
    updatedAt: item.updated_at || null,
    amenities: item.amenities?.length ? item.amenities : buildRoomAmenities(item),
    images: extractRoomImages(item, placeholderImage),
    contact: {
      phone: process.env.REACT_APP_DEFAULT_CONTACT_PHONE || '0901234567',
      zalo: process.env.REACT_APP_DEFAULT_CONTACT_ZALO || ''
    }
  };
}

async function getResidentBuildingsForClient() {
  const result = await getResidentBuildings();
  const listItems = result.items || [];
  const detailItems = await Promise.all(
    listItems.map((item) => getResidentApartmentById(item.id))
  );
  return detailItems.map(mapResidentBuilding);
}

async function getResidentBuildingByIdForClient(id) {
  const item = await getResidentApartmentById(Number(id));
  return mapResidentBuilding(item);
}

async function getResidentApartmentsByBuildingForClient(buildingId) {
  const result = await getResidentRoomsByApartment(Number(buildingId));
  return (result.items || []).map(mapResidentRoom);
}

async function getResidentApartmentByIdForClient(id) {
  const room = await getResidentRoomById(Number(id));
  return mapResidentRoom(room);
}

async function getResidentDashboardSummary() {
  const report = await getResidentDashboardReport();
  return {
    totalBuildings: report.totalActiveApartments || 0,
    totalApartments: report.totalActiveRooms || 0,
    totalBeds: report.totalActiveBeds || 0,
    occupancyRate: report.occupancyRate || 0
  };
}

export const api = {
  getDashboardSummary: () =>
    shouldUseCustomServer()
      ? customServerRequest('/dashboard-summary')
      : shouldUseResidentApi()
      ? getResidentDashboardSummary()
      : mockRequest('/dashboard-summary'),
  getBuildings: (params) =>
    shouldUseCustomServer()
      ? customServerRequest('/buildings', params)
      : shouldUseResidentApi()
      ? getResidentBuildingsForClient()
      : mockRequest('/buildings'),
  getBuildingById: (id) =>
    shouldUseCustomServer()
      ? customServerRequest(`/buildings/${id}`)
      : shouldUseResidentApi()
      ? getResidentBuildingByIdForClient(id)
      : mockRequest(`/buildings/${id}`),
  getApartments: (params) =>
    shouldUseCustomServer()
      ? customServerRequest('/apartments', params)
      : shouldUseResidentApi()
      ? getResidentBuildingsForClient().then(async (buildings) => {
          const apartmentGroups = await Promise.all(
            buildings.map((building) =>
              getResidentApartmentsByBuildingForClient(building.id)
            )
          );
          return apartmentGroups.flat();
        })
      : mockRequest('/apartments'),
  getApartmentsByBuilding: (buildingId) =>
    shouldUseCustomServer()
      ? customServerRequest('/apartments', { buildingId })
      : shouldUseResidentApi()
      ? getResidentApartmentsByBuildingForClient(buildingId)
      : mockRequest(`/apartments?building_id=${buildingId}`),
  getApartmentById: (id) =>
    shouldUseCustomServer()
      ? customServerRequest(`/apartments/${id}`)
      : shouldUseResidentApi()
      ? getResidentApartmentByIdForClient(id)
      : mockRequest(`/apartments/${id}`),
  loginResident: residentLogin,
  getResidentDashboardReport,
  getResidentBuildings,
  getResidentRoomsByApartment,
  getResidentRoomById,
  getResidentApartmentById,
  getResidentCollection: getResidentEntityList
};
