import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// 패키지 안에 함께 들어 있는 템플릿 폴더 (scripts/sync-template.mjs가 만든다)
export const TEMPLATE_DIR = join(here, "..", "template");
export const PACKAGE_JSON = join(here, "..", "package.json");
