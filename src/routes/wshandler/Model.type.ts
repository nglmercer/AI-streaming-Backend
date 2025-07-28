export interface EmotionMap {
  [key: string]: number | string;
}


export interface TapMotionMap {
  [key: string]: MotionWeightMap;
}

export interface MotionWeightMap {
  [key: string]: number;
}
export interface ModelInfo {
  name?: string;
  description?: string;
  url: string;
  kScale: number;
  initialXshift: number;
  initialYshift: number;
  idleMotionGroupName?: string;
  defaultEmotion?: number | string;
  emotionMap: EmotionMap;
  pointerInteractive?: boolean;
  tapMotions?: TapMotionMap;
  scrollToResize?: boolean;
}