import { ServerAPI } from "@signalk/server-api";

// Can this be inferred from the JSON schema?
export type Config = {
  path: (typeof DepthPaths)[number];
  sounder: {
    x: number;
    y: number;
    z: number;
    draft?: number;
    make?: string;
    model?: string;
    frequency?: number;
    transducer?: string;
  };
  gnss: {
    x: number;
    y: number;
    z: number;
    make?: string;
    model?: string;
  };
  sharing: {
    anonymous: boolean;
  };
};

export const DepthPaths = [
  "belowSurface",
  "belowTransducer",
  "belowKeel",
] as const;

export function schema(app: ServerAPI) {
  return {
    type: "object",
    description:
      "By enabling this plugin, you agree to share your position and depth data with the IHO data collection service under the terms of Creative Commons 1.0 Universal public domain dedication (CCO).",
    properties: {
      path: {
        type: "string",
        title: "Path",
        description:
          "The path to the depth data. (e.g. environment.depth.belowTransducer)",
        enum: DepthPaths,
        default: DepthPaths.find((path) =>
          app.getSelfPath(`environment.depth.${path}.value`),
        ),
      },
      sounder: {
        type: "object",
        title: "Depth Sounder",
        required: ["x", "y", "z"],
        properties: {
          y: {
            type: "number",
            title: "Distance of the transducer from the bow (meters)",
            minimum: 0,
            default: app.getSelfPath("sensors.depth.fromBow.value"),
          },
          x: {
            type: "number",
            title: "Distance of the transducer from the center (meters)",
            description: "+ve to starboard, -ve to port",
            default: app.getSelfPath("sensors.depth.fromCenter.value"),
          },
          z: {
            type: "number",
            title: "Distance of the transducer below the waterline (meters)",
            default: app.getSelfPath(
              "environment.depth.surfaceToTransducer.value",
            ),
          },
          draft: {
            type: "number",
            title: "Draft",
            description: "The draft of the vessel in meters.",
            default: app.getSelfPath("design.draft.value"),
          },
          make: {
            type: "string",
            title: "Make",
            description: "The manufacturer of the sounder. (e.g. Raymarine)",
          },
          model: {
            type: "string",
            title: "Model",
            description: "The model of the sounder. (e.g. ST60+)",
          },
          frequency: {
            type: "number",
            title: "Frequency",
            description: "The frequency of the sounder in Hz.",
          },
          transducer: {
            type: "string",
            title: "Transducer",
            description: "The transducer used by the sounder.",
          },
        },
      },
      gnss: {
        type: "object",
        title: "GPS Receiver",
        required: ["x", "y", "z"],
        properties: {
          y: {
            type: "number",
            title: "Distance of the antenna from the bow (meters)",
            minimum: 0,
            default: app.getSelfPath("sensors.gps.fromBow.value"),
          },
          x: {
            type: "number",
            title: "Distance of the antenna from the center (meters)",
            description: "+ve to starboard, -ve to port",
            default: app.getSelfPath("sensors.gps.fromCenter.value"),
          },
          z: {
            type: "number",
            title: "Distance of the antenna above the waterline (meters)",
          },
          make: {
            type: "string",
            title: "Make",
            description:
              "The manufacturer of the GPS receiver. (e.g. Kongsberg Maritime)",
          },
          model: {
            type: "string",
            title: "Model",
            description: "The model of the GPS Receiver. (e.g. Seapath 330+)",
          },
        },
      },
      sharing: {
        type: "object",
        title: "Data Sharing",
        properties: {
          anonymous: {
            type: "boolean",
            default: false,
            title: "Share data anonymously",
            description:
              "If you do not wish to share your vessel name and MMSI, you can share anonymously with a unique UUID instead.",
          },
        },
      },
    },
  };
}
