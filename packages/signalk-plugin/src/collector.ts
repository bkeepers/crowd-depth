import { pipeline } from "stream/promises";
import { createLiveStream, toPrecision } from "./streams/index.js";
import { ServerAPI } from "@signalk/server-api";
import { Config } from "./config.js";
import { transform } from "stream-transform";
import { Writable } from "stream";

export interface CollectorOptions {
  app: ServerAPI;
  config: Config;
  writer: Writable;
  signal: AbortSignal;
}

export function createCollector({
  app,
  config,
  writer,
  signal,
}: CollectorOptions) {
  return pipeline(
    createLiveStream(app, config),
    transform(toPrecision()),
    writer,
    { signal },
  );
}
