import { apartments, buildings } from './mockData';

import axios from 'axios';
import SparkMD5 from 'spark-md5';

const API_DELAY_MS = 500;
const RESIDENT_API_BASE_URL = 'https://api.resident.vn';
const TOKEN_STORAGE_KEY = 'resident-api-token';
const PASSWORD_MODE = (
  process.env.REACT_APP_RESIDENT_PASSWORD_MODE || 'sha256'
).toLowerCase();

let residentTokenPromise = null;

function getStorageItem(key) {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(key);
}

function setStorageItem(key, value) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, value);
}

function removeStorageItem(key) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(key);
}

function resolveTokenFromPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return (
    payload.token ||
    payload.accessToken ||
    payload.jwtToken ||
    payload.data?.token ||
    payload.data?.accessToken ||
    payload.data?.jwtToken ||
    null
  );
}

function maskSensitiveFields(payload) {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => maskSensitiveFields(item));
  }

  const sensitiveKeys = ['token', 'accessToken', 'jwtToken', 'refreshToken'];

  return Object.keys(payload).reduce((result, key) => {
    if (sensitiveKeys.includes(key)) {
      result[key] = '***masked***';
      return result;
    }

    result[key] = maskSensitiveFields(payload[key]);
    return result;
  }, {});
}

function createResidentHttpClient(token) {
  return axios.create({
    baseURL: RESIDENT_API_BASE_URL,
    headers: token
      ? {
          Authorization: `Bearer ${token}`
        }
      : undefined
  });
}

function unwrapResidentResponse(response) {
  const payload = response?.data;

  if (!payload) {
    throw new Error('Resident API returned an empty response');
  }

  if (payload.status === 0 || payload.statusCode >= 400) {
    const message =
      payload.message ||
      payload.errors?.message ||
      payload.errors?.[0]?.message ||
      'Resident API request failed';
    throw new Error(message);
  }

  return payload.data;
}

function buildResidentLoginPayload(credentials) {
  if (credentials) {
    const phone = credentials.phone || credentials.username;

    if (!phone || !credentials.password) {
      throw new Error('Resident login requires phone and password');
    }

    return {
      phone,
      password: credentials.password
    };
  }

  const phone =
    process.env.REACT_APP_RESIDENT_PHONE || process.env.REACT_APP_RESIDENT_USERNAME;
  const password = process.env.REACT_APP_RESIDENT_PASSWORD;

  if (!phone || !password) {
    throw new Error(
      'Missing Resident login credentials. Set REACT_APP_RESIDENT_PHONE (or REACT_APP_RESIDENT_USERNAME) and REACT_APP_RESIDENT_PASSWORD.'
    );
  }

  return { phone, password };
}

async function toSha256Hex(value) {
  const cryptoApi = typeof window !== 'undefined' ? window.crypto : null;

  if (!cryptoApi?.subtle) {
    throw new Error('SHA-256 is not supported in this runtime');
  }

  const data = new TextEncoder().encode(value);
  const hashBuffer = await cryptoApi.subtle.digest('SHA-256', data);
  const hashBytes = Array.from(new Uint8Array(hashBuffer));
  return hashBytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function toBase64(value) {
  if (typeof btoa === 'function') {
    return btoa(unescape(encodeURIComponent(value)));
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf8').toString('base64');
  }

  throw new Error('Base64 encoding is not supported in this runtime');
}

async function transformResidentPassword(password) {
  if (PASSWORD_MODE === 'plain') {
    return password;
  }

  if (PASSWORD_MODE === 'md5') {
    return SparkMD5.hash(password);
  }

  if (PASSWORD_MODE === 'base64') {
    return toBase64(password);
  }

  if (PASSWORD_MODE === 'sha256') {
    return toSha256Hex(password);
  }

  throw new Error(
    `Invalid REACT_APP_RESIDENT_PASSWORD_MODE: ${PASSWORD_MODE}. Use plain, md5, base64, or sha256.`
  );
}

export async function residentLogin(credentials) {
  const payload = buildResidentLoginPayload(credentials);
  const transformedPassword = await transformResidentPassword(payload.password);
  const loginPayload = {
    ...payload,
    password: transformedPassword
  };
  const client = createResidentHttpClient();
  let response;

  try {
    response = await client.post('/v1/auth/login', loginPayload);

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.info('[Resident API] POST /v1/auth/login response:', maskSensitiveFields(response.data));
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(
        '[Resident API] POST /v1/auth/login error:',
        maskSensitiveFields(error?.response?.data || { message: error.message })
      );
    }

    const message =
      error?.response?.data?.message ||
      'Resident login failed. Please check phone/password.';
    throw new Error(message);
  }

  const token = resolveTokenFromPayload(response.data);

  if (!token) {
    throw new Error('Resident login succeeded but no token was returned');
  }

  setStorageItem(TOKEN_STORAGE_KEY, token);
  return token;
}

export async function getResidentAccessToken(options = {}) {
  const { forceRefresh = false, credentials } = options;

  if (!forceRefresh) {
    const cachedToken = getStorageItem(TOKEN_STORAGE_KEY);
    if (cachedToken) {
      return cachedToken;
    }
  }

  if (!residentTokenPromise || forceRefresh) {
    residentTokenPromise = residentLogin(credentials).finally(() => {
      residentTokenPromise = null;
    });
  }

  return residentTokenPromise;
}

export function clearResidentAccessToken() {
  residentTokenPromise = null;
  removeStorageItem(TOKEN_STORAGE_KEY);
}

export async function residentRequest(path, options = {}) {
  const {
    method = 'get',
    data,
    params,
    forceRefreshToken = false,
    credentials,
    headers
  } = options;

  let token = await getResidentAccessToken({
    forceRefresh: forceRefreshToken,
    credentials
  });

  try {
    const client = createResidentHttpClient(token);
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.info(`[Resident API] ${method.toUpperCase()} ${path}`);
    }
    const response = await client.request({
      url: path,
      method,
      data,
      params,
      headers
    });
    return unwrapResidentResponse(response);
  } catch (error) {
    const status = error?.response?.status;

    if (status === 401 && !forceRefreshToken) {
      clearResidentAccessToken();
      token = await getResidentAccessToken({ forceRefresh: true, credentials });
      const retryClient = createResidentHttpClient(token);
      const retryResponse = await retryClient.request({
        url: path,
        method,
        data,
        params,
        headers
      });
      return unwrapResidentResponse(retryResponse);
    }

    const message =
      error?.response?.data?.message ||
      error?.response?.data?.errors?.message ||
      error.message ||
      'Resident API request failed';
    throw new Error(`Resident API error at ${path}: ${message}`);
  }
}

export async function getResidentDashboardReport() {
  return residentRequest('/v1/dashboard/real-estate-report');
}

export async function getResidentBuildings(params = {}) {
  return residentRequest('/v2/apartment', {
    params: {
      page: 1,
      perPage: 10,
      searchTerm: '',
      filter: '{}',
      ...params
    }
  });
}

export async function getResidentRooms(params = {}) {
  return residentRequest('/v2/room', {
    params: {
      page: 1,
      perPage: 10,
      searchTerm: '',
      filter: '{}',
      ...params
    }
  });
}

export async function getResidentRoomsByApartment(apartmentId, params = {}) {
  const mergedFilter = {
    ...(params.filter || {}),
    apartmentId
  };

  return getResidentRooms({
    ...params,
    filter: JSON.stringify(mergedFilter)
  });
}

export async function getResidentRoomById(roomId) {
  return residentRequest(`/v1/room/${roomId}`);
}

export async function getResidentApartmentById(apartmentId) {
  return residentRequest(`/v1/apartment/${apartmentId}`);
}

export async function getResidentEntityList(resourcePath, params = {}) {
  return residentRequest(resourcePath, {
    params: {
      page: 1,
      perPage: 10,
      searchTerm: '',
      filter: '{}',
      ...params
    }
  });
}

export function shouldUseResidentApi() {
  return process.env.REACT_APP_USE_RESIDENT_API === 'true';
}

export function shouldUseCustomServer() {
  return process.env.REACT_APP_USE_CUSTOM_SERVER === 'true';
}

const CUSTOM_SERVER_URL = process.env.REACT_APP_CUSTOM_SERVER_URL || 'http://localhost:5000/api/public';

export async function customServerRequest(path, params = {}) {
  const res = await axios.get(`${CUSTOM_SERVER_URL}${path}`, { params });
  return res.data.data;
}

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const parsePath = (url) => {
  const [pathname, query] = url.split('?');
  return { pathname, query: new URLSearchParams(query || '') };
};

export const mockRequest = async (url) => {
  await sleep(API_DELAY_MS);

  const { pathname, query } = parsePath(url);

  if (pathname === '/dashboard-summary') {
    const occupiedApartments = apartments.filter((item) => item.status?.id !== '1').length;
    return {
      totalBuildings: buildings.length,
      totalApartments: apartments.length,
      totalBeds: apartments.reduce(
        (total, item) => total + (item.numberActiveBeds || 0),
        0
      ),
      occupancyRate: apartments.length
        ? Math.round((occupiedApartments / apartments.length) * 100)
        : 0
    };
  }

  if (pathname === '/buildings') {
    return buildings;
  }

  if (pathname.startsWith('/buildings/')) {
    const id = pathname.replace('/buildings/', '');
    const building = buildings.find((item) => item.id === id);
    if (!building) {
      throw new Error('Building not found');
    }
    return building;
  }

  if (pathname === '/apartments') {
    const buildingId = query.get('building_id');
    if (!buildingId) {
      return apartments;
    }
    return apartments.filter((item) => item.buildingId === buildingId);
  }

  if (pathname.startsWith('/apartments/')) {
    const id = pathname.replace('/apartments/', '');
    const apartment = apartments.find((item) => item.id === id);
    if (!apartment) {
      throw new Error('Apartment not found');
    }
    return apartment;
  }

  throw new Error('Endpoint not found');
};
