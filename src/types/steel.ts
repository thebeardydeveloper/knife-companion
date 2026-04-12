export interface Composition {
  C: number;
  Mn?: number;
  Si?: number;
  Cr?: number;
  Mo?: number;
  V?: number;
  W?: number;
  Co?: number;
  Ni?: number;
  P?: number;
  S?: number;
  N?: number;
  Cu?: number;
  Nb?: number;
}

export interface Properties {
  hardnessMin: number; // HRC
  hardnessMax: number; // HRC
  toughness: number; // 1–10
  edgeRetention: number; // 1–10
  corrosionResistance: number; // 1–10
  sharpenability: number; // 1–10
}

export type HeatTreatStepType =
  | 'normalize'
  | 'anneal'
  | 'stress_relief'
  | 'harden'
  | 'quench'
  | 'cryo'
  | 'temper';

export type QuenchMedia =
  | 'oil'
  | 'water'
  | 'air'
  | 'brine'
  | 'plates'
  | 'interrupted';

export interface HeatTreatStep {
  type: HeatTreatStepType;
  tempC?: { minC: number; maxC: number };
  durationMin?: number;
  quenchMedia?: QuenchMedia[];
  notes?: string; // clave i18n
}

export interface TemperCycle {
  tempC: { minC: number; maxC: number };
  durationMin: number;
  cycles: number;
  notes?: string; // clave i18n
}

export type SteelCategory =
  | 'carbon'
  | 'spring'
  | 'bearing'
  | 'alloy'
  | 'tool_oil'
  | 'tool_water'
  | 'tool_air'
  | 'tool_german'
  | 'stainless'
  | 'semi_stainless'
  | 'pm';

export interface Steel {
  id: string;
  name: string;
  aliases: string[];
  category: SteelCategory;
  composition: Composition;
  properties: Properties;
  heatTreatment: {
    steps: HeatTreatStep[];
    temperCycles: TemperCycle[];
    notes?: string;
  };
  // prose bilingüe — viene directo de la API
  originEn: string;
  originEs: string;
  characteristicsEn: string;
  characteristicsEs: string;
}
