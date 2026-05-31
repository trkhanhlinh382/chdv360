import useSWR from 'swr';
import { api } from './index';

export function useDashboardSummary() {
  return useSWR('dashboard-summary', api.getDashboardSummary);
}

export function useBuildings(params) {
  const key = params ? ['buildings', JSON.stringify(params)] : 'buildings';
  const { data, error, isLoading, mutate } = useSWR(key, () => api.getBuildings(params));
  return {
    data: data?.data || [], // Backward compatibility
    buildings: data?.data || [],
    total: data?.total || 0,
    error,
    isLoading,
    mutate
  };
}

export function useApartments(params) {
  const key = params ? ['apartments', JSON.stringify(params)] : 'apartments';
  const { data, error, isLoading, mutate } = useSWR(key, () => api.getApartments(params));
  return {
    data: data?.data || [], // Backward compatibility
    apartments: data?.data || [],
    total: data?.total || 0,
    error,
    isLoading,
    mutate
  };
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
