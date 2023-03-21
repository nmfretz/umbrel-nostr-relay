// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import fs from "fs";

import { defaultSettings } from "@/config";

const filePath = "data/settings.json";

let settings = defaultSettings;

try {
  settings = JSON.parse(fs.readFileSync(filePath, "utf8"));
} catch (error) {
  // Not settings saved yet, do nothing
}

export default function handler(req, res) {
  if (req.method === "POST") {
    const newSettings = JSON.parse(req.body);

    // Simple shallow merge with existing settings for simplicity
    settings = { ...settings, ...newSettings };

    try {
      fs.writeFileSync(filePath, JSON.stringify(settings));
    } catch (err) {
      return res.status(500).json({ error: "Error writing to file" });
    }
  }

  return res.status(200).json(settings);
}
