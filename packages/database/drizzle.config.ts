import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment variables from multiple possible locations
dotenv.config();
dotenv.config({ path: "../../.env" });
dotenv.config({ path: "../../apps/server/.env" });
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in the environment variables.");
}
export default defineConfig({
  schema: "./src/schema/*",
  dialect: "postgresql",
  out: "./src/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
