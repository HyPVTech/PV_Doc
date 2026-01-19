import { postgresAdapter } from "@payloadcms/db-postgres";
// NOTE: import-export plugin disabled due to PostgreSQL enum bug in v3.72.0
// See: https://github.com/payloadcms/payload/issues - creates empty enum values for imports collection
// import { importExportPlugin } from "@payloadcms/plugin-import-export";
import { mcpPlugin } from "@payloadcms/plugin-mcp";
import { searchPlugin } from "@payloadcms/plugin-search";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig, databaseKVAdapter } from "payload";
import sharp from "sharp";
import { Categories } from "./collections/Categories";
import { Docs } from "./collections/Docs";
import { Media } from "./collections/Media";
import { Users } from "./collections/Users";

const filenameToPath = fileURLToPath(import.meta.url);
const dirname = path.dirname(filenameToPath);

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: " | Payload CMS Admin",
      description:
        "Admin panel for documentation - Manage your documentation and content.",
      defaultOGImageType: "dynamic",
      icons: [
        {
          rel: "icon",
          type: "image/x-icon",
          url: "/favicon.ico",
        },
        {
          rel: "apple-touch-icon",
          type: "image/x-icon",
          url: "/favicon.ico",
        },
      ],
      robots: "noindex, nofollow",
    },
    theme: "light",
    components: {
      afterNavLinks: ["@/components/home-nav-link#HomeNavLink"],
    },
  },
  collections: [Users, Media, Categories, Docs],
  cors: {
    origins: [process.env.NEXT_PUBLIC_APP_URL as string],
  },
  csrf: [process.env.NEXT_PUBLIC_APP_URL as string],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.PAYLOAD_DATABASE_URI || "",
      // Limit connections for serverless environments (Neon, Supabase, etc.)
      max: 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    },
  }),
  editor: lexicalEditor(),
  graphQL: {
    disable: false,
  },
  kv: databaseKVAdapter(),
  plugins: [
    // NOTE: importExportPlugin disabled - causes PostgreSQL enum bug in v3.72.0
    // importExportPlugin({
    //   collections: ["docs", "categories"],
    // }),
    mcpPlugin({
      collections: {
        docs: {
          enabled: true,
          description: "View and manage your documentation.",
        },
      },
    }),
    searchPlugin({
      collections: ["docs"],
      defaultPriorities: {
        docs: 10,
      },
      searchOverrides: {
        fields: ({ defaultFields }) => [
          ...defaultFields,
          {
            name: "description",
            type: "textarea",
            admin: {
              position: "sidebar",
            },
          },
        ],
      },
    }),
    vercelBlobStorage({
      collections: {
        media: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || "",
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || "",
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
