export type DensityResult = {
  term: string;
  count: number;
  density: number;
  words: number;
};

export type DensityResponse = {
  url: string;
  title: string;
  totalWords: number;
  results: DensityResult[];
};
