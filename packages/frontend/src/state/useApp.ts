import { useReducer } from 'react';
import { appReducer, initialState, type AppState, type AppAction } from './appReducer.js';

export interface UseAppReturn {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export function useApp(): UseAppReturn {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return { state, dispatch };
}
