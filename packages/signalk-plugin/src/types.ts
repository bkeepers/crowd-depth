import { Readable, Writable } from "stream";

export type Timeframe = { from: Date; to: Date };

export type BathymetryData = {
  latitude: number;
  longitude: number;
  depth: number;
  timestamp: Date;
  heading?: number;
};

export interface BathymetrySource {
  createWriter?: () => Writable;
  createReader: (options: Timeframe) => Readable | Promise<Readable>;
  logReport?(timeframe: Timeframe): void;
  lastReport?: Date;
}
