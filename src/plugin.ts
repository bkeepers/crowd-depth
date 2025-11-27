import { ServerAPI, Plugin } from "@signalk/server-api";
import { schema, Config } from "./config.js";
import { createCollector } from "./collector.js";
import { createReporter } from "./reporters/index.js";
import { createSqliteSource } from "./sources/sqlite.js";
import { getVesselInfo } from "./metadata.js";
import { NODE_ENV } from "./constants.js";

export default function createPlugin(app: ServerAPI): Plugin {
  // FIXME: types
  let collector: ReturnType<typeof createCollector> | undefined = undefined;
  let reporter: ReturnType<typeof createReporter> | undefined = undefined;

  return {
    id: "crowd-depth",
    name: "Crowd Depth",
    description: "Collect and share depth data",

    async start(config: Config) {
      app.debug("Starting (NODE_ENV=%s)", NODE_ENV);
      const vessel = await getVesselInfo(app);
      const source = createSqliteSource(app);

      collector = createCollector(app, config, source);
      reporter = createReporter(app, config, vessel, source);

      collector.start().catch((err) => {
        // TODO: what is the right behavior on collector error? Restart?
        app.error("Collector failed");
        app.error(err);
      });

      reporter.start();
    },

    stop() {
      collector?.stop();
    },

    schema() {
      return schema(app);
    },
  };
}
