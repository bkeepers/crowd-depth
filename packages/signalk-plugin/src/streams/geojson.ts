import { Transform, TransformOptions } from "stream";
import { BathymetryData } from "../types.js";
import * as GeoJSON from "geojson";

export class ToGeoJSON extends Transform {
  started = false;

  constructor(options: TransformOptions = {}) {
    super({
      ...options,
      readableObjectMode: false,
      writableObjectMode: true,
    });
  }

  _transform(
    data: BathymetryData,
    encoding: string,
    callback: (error?: Error | null) => void,
  ) {
    this.push(this.started ? "," : '{"type": "FeatureCollection","features":[');
    this.started = true;
    this.push(JSON.stringify(toFeature(data)));
    callback();
  }

  _flush(callback: (error?: Error | null) => void) {
    this.push("]}");
    callback();
  }
}

/** Converts a Bathymetry data point to a GeoJSON Feature */
export function toFeature({
  latitude,
  longitude,
  depth,
  timestamp,
}: BathymetryData): GeoJSON.Feature {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    properties: {
      depth: depth,
      time: timestamp.toISOString(),
    },
  };
}
