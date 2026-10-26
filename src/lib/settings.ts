import "server-only";
import { cache } from "react";
import { prisma } from "./db";

import { SETTING_FIELDS } from "./settings-fields";
export { SETTING_FIELDS };

export type SettingKey = (typeof SETTING_FIELDS)[number]["key"];

export const getSettings = cache(async (): Promise<Record<SettingKey, string>> => {
  const rows = await prisma.siteSetting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const out = {} as Record<SettingKey, string>;
  for (const f of SETTING_FIELDS) out[f.key] = map.get(f.key) ?? f.def;
  return out;
});
