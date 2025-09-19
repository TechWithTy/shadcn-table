import type { Config } from "drizzle-kit";
import { env } from "./src/env";

import { databasePrefix } from "./src/lib/constants";

export default {
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  out: "./drizzle",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  tablesFilter: [`${databasePrefix}_*`],
} satisfies Config;
