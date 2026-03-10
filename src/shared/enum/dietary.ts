export enum Dietary {
  VEG = 'VEG',
  NON_VEG = 'NON_VEG',
  EGG = 'EGG'
}

export const DIETARIES = Object.values(Dietary) as readonly Dietary[];

export type DietaryType = (typeof DIETARIES)[number];
