/**
 * Search result types
 */

export interface PersonRecord {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  drivers_license?: string;
  warrants: Warrant[];
  priors: Prior[];
  address?: string;
  phone?: string;
}

export interface Warrant {
  id: string;
  type: string;
  description: string;
  issue_date: string;
  jurisdiction: string;
}

export interface Prior {
  id: string;
  offense: string;
  date: string;
  disposition: string;
}

export interface VehicleRecord {
  id: string;
  plate_number: string;
  state: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  registered_owner?: string;
  flags: string[];
  registration_status?: string;
}

export interface SearchHistoryItem {
  id: string;
  type: 'person' | 'vehicle';
  query: string;
  result: PersonRecord | VehicleRecord | null;
  timestamp: number;
}

export interface ResultsState {
  currentResult: PersonRecord | VehicleRecord | null;
  searchHistory: SearchHistoryItem[];
  conversationHistory: TranscriptItem[];
}

export interface TranscriptItem {
  speaker: 'officer' | 'dispatcher';
  text: string;
  timestamp: number;
}
