import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config();
export default defineConfig({
    schema: "./src/db/schema/*",
    dialect: "postgresql",
    out: "./src/db/migrations",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    verbose: true,
    strict: true,
})