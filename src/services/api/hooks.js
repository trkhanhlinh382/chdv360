import useSWR from 'swr';
import { api } from './index';

export function useDashboardSummary() {
  return useSWR('dashboard-summary', api.getDashboardSummary);
}

export function useBuildings() {
  return useSWR('buildings', api.getBuildings);
}

export function useApartments() {
  return useSWR('apartments', api.getApartments);
}

export function useBuilding(id) {
  return useSWR(id ? `building-${id}` : null, () => api.getBuildingById(id));
}

export function useApartmentsByBuilding(buildingId) {
  return useSWR(
    buildingId ? `apartments-${buildingId}` : null,
    () => api.getApartmentsByBuilding(buildingId)
  );
}

export function useApartment(id) {
  return useSWR(id ? `apartment-${id}` : null, () => api.getApartmentById(id));
}
