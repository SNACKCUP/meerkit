#!/usr/bin/env node
// npx create-meerkit my-app → @snackcup/meerkit 패키지의 init을 그대로 실행하는 얇은 입구
import { runInit } from "@snackcup/meerkit/init";

const code = await runInit(process.argv.slice(2));
process.exit(code);
