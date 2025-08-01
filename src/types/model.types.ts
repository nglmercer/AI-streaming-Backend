/* -------------------------------------------------------------------------- */
/*                               TYPES                                        */
/* -------------------------------------------------------------------------- */

export type MotionFile   = string;
export type TextureFile  = string;
export type PhysicsFile  = string;
export type PoseFile     = string;
export type ExpressionFile = string;

export interface MotionEntry {
  file: MotionFile;
  fade_in?: number;
  fade_out?: number;
}

export interface ExpressionEntry {
  name: string;
  file: ExpressionFile;
}

export interface HitAreaEntry {
  name: string;
  id: string;
}

/** Estructura esperada para modelos v2 (model.json) */
export interface Live2DModelSettingV2 {
  type: 'Live2D Model Setting';
  name: string;
  model: string;
  textures: TextureFile[];
  physics?: PhysicsFile;
  pose?: PoseFile;
  expressions?: ExpressionEntry[];
  hit_areas?: HitAreaEntry[];
  motions: Record<string, MotionEntry[]>;
}

/** Estructura esperada para modelos v3 (model3.json) */
export interface Live2DModelSettingV3 {
  Version: number;
  FileReferences: {
    Moc: string;
    Textures: TextureFile[];
    Physics?: string;
    Pose?: string;
    DisplayInfo?: string;
    Expressions: { Name: string; File: string }[];
    Motions: Record<string, { File: string }[]>;
  };
  Groups?: Array<{
    Target: 'Parameter' | 'PartOpacity';
    Name: string;
    Ids: string[];
  }>;
  HitAreas?: Array<{ Id: string; Name: string }>;
}

export type Live2DModelSetting = Live2DModelSettingV2 | Live2DModelSettingV3;