import type {ModelInfo} from './Model.type.js'
export interface Actions {
  expressions?: string[] | number [];
  pictures?: string[];
  sounds?: string[];
}
export interface DisplayText {
  text: string;
  name: string;
  avatar: string;
}
export interface BackgroundFile {
  name: string;
  url: string;
}
export interface Message {
  id: string;
  content: string;
  role: "ai" | "human";
  timestamp: string;
  name?: string;
  avatar?: string;
}
interface BaseEvent {
  type: string;
}

export interface HistoryInfo {
  uid: string;
  latest_message: latest_message | null;
  timestamp: string | null;
}
export interface latest_message{
    role: 'human' | 'ai' | string;
    timestamp: string | number;
    content: string;
}
export interface ConfigFile {
  filename: string;
  name: string;
}
export interface MessageEvent {
  type: string;
  audio?: string;
  volumes?: number[];
  slice_length?: number;
  files?: BackgroundFile[];
  actions?: Actions;
  text?: string;
  model_info?: ModelInfo;
  conf_name?: string;
  conf_uid?: string;
  uids?: string[];
  messages?: Message[];
  history_uid?: string;
  success?: boolean;
  histories?: HistoryInfo[];
  configs?: ConfigFile[];
  message?: string;
  members?: string[];
  is_owner?: boolean;
  client_uid?: string;
  forwarded?: boolean;
  display_text?: DisplayText;
}
export interface audioEvent extends BaseEvent {
  audio?: string;
  actions?: Actions;
  display_text?: DisplayText;
  forwarded?: boolean;
  slice_length?: number;
  volumes?: number[];
}
export interface fulltextEvent extends BaseEvent {
    text: string;
}
export interface controlEvent extends BaseEvent {
    text: string;
}
export interface sendInputEvent extends BaseEvent {
    text: string;
    images?: string[] | any[]
}