// ─── Prisma v7 Configuration (forward-reference) ──────────────────────────────
//
// This file is used by Prisma v7+ where the `url` field is removed from
// schema.prisma and connection URLs are configured here instead.
//
// CURRENTLY INACTIVE: the project pins to Prisma v6 (see package.json).
// In v6, connection URLs live in prisma/schema.prisma via `url = env("DATABASE_URL")`.
//
// When you are ready to migrate to v7:
//   1. Run: npm install prisma@latest @prisma/client@latest
//   2. Remove `url = env("DATABASE_URL")` from prisma/schema.prisma
//   3. This file becomes active automatically.
//
// Reference: https://www.prisma.io/docs/orm/reference/prisma-config-reference

import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  datasourceUrl: process.env.DATABASE_URL,
});
