import { Config } from "../config.js";
import cjsStreamJSON from "stream-json";
import cjsPick from "stream-json/filters/Pick.js";
import cjsStreamArray from "stream-json/streamers/StreamArray.js";
import { chain } from "stream-chain";
import { Readable } from "stream";
import { BathymetrySource, Timeframe } from "../types.js";
import { ServerAPI } from "@signalk/server-api";

// Workaround for stream-json ESM/CJS interop
const { parser } = cjsStreamJSON;
const { streamArray } = cjsStreamArray;
const { pick } = cjsPick;

const DEFAULT_HOST = process.env.SIGNALK_HOST ?? "http://localhost:3000";

export function createHistorySource(
  app: ServerAPI,
  config: Config,
  options: HistorySourceOptions = {},
): BathymetrySource {
  const { host = DEFAULT_HOST } = options;

  return {
    // History providers handle the recording of data themselves
    createWriter: undefined,

    createReader({ from, to }) {
      return createHistoryReader({ from, to, host, depthPath: config.path });
    },
  };
}

export interface HistoryReaderOptions extends Timeframe {
  host: string;
  depthPath: string;
  resolution?: string; // in seconds, defaults to "1"
  context?: string;
}

export async function createHistoryReader(options: HistoryReaderOptions) {
  const {
    from,
    to,
    host,
    depthPath,
    resolution = "1",
    context = undefined,
  } = options;

  const stream = await get({
    from: from.toISOString(),
    to: to.toISOString(),
    paths: [
      "navigation.position",
      `environment.depth.${depthPath}`,
      "navigation.headingTrue",
    ].join(","),
    resolution,
    context: context ?? "",
  });

  return Readable.from(
    chain([
      stream,
      ({ value }: { value: HistoryData }) => {
        const [timestamp, position, depth, heading] = value;

        if (depth !== null && position[0] !== null && position[1] !== null) {
          return {
            timestamp: new Date(timestamp),
            longitude: position?.[0],
            latitude: position?.[1],
            depth,
            heading,
          };
        }
      },
    ]),
  );

  async function get(query: Record<string, string>) {
    const url = new URL(`${host}/signalk/v1/history/values`);
    url.search = new URLSearchParams(query).toString();

    const response = await fetch(url);

    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch history: ${response.statusText}`);
    }

    return chain([
      response.body,
      parser(),
      pick({ filter: "data" }),
      streamArray(),
    ]);
  }
}

type HistoryData = [
  /** timestamp */
  string,
  /** position */
  [number | null, number | null],
  (
    /** depth */
    number | null
  ),
  (
    /** heading */
    number | null
  ),
];

export interface HistorySourceOptions {
  host?: string;
}

export type HistoryStreamOptions = {
  from: string;
  to: string;
};
