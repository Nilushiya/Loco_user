import apiClient from "../api/client";

export interface TrainOption {
  id: number;
  name: string;
  mname?: string;
  type?: string;
  [key: string]: any;
}

export interface StationOption {
  id: number;
  name: string;
  [key: string]: any;
}

export const trainService = {
  async fetchTrains(): Promise<TrainOption[]> {
    const response = await apiClient.get("/train/get");
    return response.data?.data ?? response.data ?? [];
  },
  async fetchStations(): Promise<StationOption[]> {
    const response = await apiClient.get("/station/get");
    return response.data?.data ?? response.data ?? [];
  },
};
