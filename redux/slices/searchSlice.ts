import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SearchResultItem } from "../../types/search";

interface SearchState {
  requestKey: string | null;
  loading: boolean;
  error: string | null;
  results: SearchResultItem[];
  total: number;
}

const initialState: SearchState = {
  requestKey: null,
  loading: false,
  error: null,
  results: [],
  total: 0,
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    searchPending: (state, action: PayloadAction<{ requestKey: string }>) => {
      state.requestKey = action.payload.requestKey;
      state.loading = true;
      state.error = null;
    },
    searchSuccess: (
      state,
      action: PayloadAction<{
        requestKey: string;
        results: SearchResultItem[];
        total: number;
      }>
    ) => {
      if (state.requestKey !== action.payload.requestKey) {
        return;
      }
      state.results = action.payload.results;
      state.total = action.payload.total;
      state.loading = false;
      state.error = null;
    },
    searchFailure: (
      state,
      action: PayloadAction<{ requestKey: string; error: string }>
    ) => {
      if (state.requestKey !== action.payload.requestKey) {
        return;
      }
      state.loading = false;
      state.error = action.payload.error;
    },
    clearSearch: (state) => {
      state.requestKey = null;
      state.loading = false;
      state.error = null;
      state.results = [];
      state.total = 0;
    },
  },
});

export const {
  searchPending,
  searchSuccess,
  searchFailure,
  clearSearch,
} = searchSlice.actions;

export default searchSlice.reducer;
