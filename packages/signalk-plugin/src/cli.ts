#!/usr/bin/env node

import { ToGeoJSON } from "./streams/geojson.js";
import { fromXyz } from "./streams/xyz.js";
import { pipeline } from "stream/promises";
import { transform } from "stream-transform";
import { correctForSensorPosition, toPrecision } from "./streams/transforms.js";
import { BathymetryData } from "./index.js";
import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const { configuration } = JSON.parse(
  readFileSync(
    join(homedir(), ".signalk", "plugin-config-data", "bathymetry.json"),
  ).toString(),
);

export async function xyzToGeoJSON({
  input = process.stdin,
  output = process.stdout,
} = {}) {
  return pipeline(
    input,
    fromXyz(),
    transform(toPrecision()),
    transform(correctForSensorPosition(configuration)),
    // My sounder outputs 42949672.9 if it can't read data. Maximum known ocean depth is <11000m
    transform((data: BathymetryData) => (data.depth < 11000 ? data : null)),
    new ToGeoJSON(),
    output,
  );
}

export async function xyzToGpx({
  input = process.stdin,
  output = process.stdout,
} = {}) {
  return pipeline(
    input,
    fromXyz(),
    transform(toPrecision()),
    transform(correctForSensorPosition(configuration)),
    // My sounder outputs 42949672.9 if it can't read data. Maximum known ocean depth is <11000m
    transform((data: BathymetryData) => (data.depth < 11000 ? data : null)),
    new ToGeoJSON(),
    output,
  );
}
