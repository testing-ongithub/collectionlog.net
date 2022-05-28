import { CollectionLogAPI } from 'src/api/CollectionLogAPI';
import { AppDispatch } from '../store';
import { setActiveEntry, setActiveTab, setData, setError, setIsLoading, setNonFatalError, setRecentItems } from './slice';


export const fetchCollectionLog = (username: string, entry?: string) => {
  return async(dispatch: AppDispatch, getState: any) => {
    if (entry) {
      dispatch(setActiveEntry(entry));
    }

    dispatch(setIsLoading(true));

    const api = new CollectionLogAPI();
    const res = await api.getCollectionLog(username);

    if (!res) {
      dispatch(setError('Error connection to collection log API'));
      return;
    }

    if (res.data.error) {
      dispatch(setError(res.data.error));
      return;
    }

    dispatch(setData(res.data.collection_log));
  }
}

export const fetchRecentItems = (username: string) => {
  return async(dispatch: AppDispatch, getState: any) => {
    const api = new CollectionLogAPI();
    const res = await api.getRecentItems(username);

    if (!res) {
      dispatch(setError('Error connecting to collection log API'));
      return;
    }

    if (res.data.error) {
      dispatch(setNonFatalError(res.data.error));
      return;
    }

    console.log(res);

    dispatch(setRecentItems(res.data.items));
  }
}

export const updateActiveTab = (tabName: string, entryName: string) => {
  return async(dispatch: AppDispatch, getState: any) => {
    dispatch(setActiveTab(tabName));
    dispatch(setActiveEntry(entryName));
  }
}