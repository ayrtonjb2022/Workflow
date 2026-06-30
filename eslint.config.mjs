import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ["apps/api/src/**"],
    ignores: ["apps/api/src/lib/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@prisma/client"],
              message:
                "Use lib/prisma.ts instead of importing PrismaClient directly",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/.turbo/**"],
  },
);
