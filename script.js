import { lookupCollection, lookupCollections } from "@iconify/json";
import {
  defaultIconProps,
  getIconCSS,
  iconToHTML,
  iconToSVG,
  mergeIconData,
  parseIconSetAsync,
  replaceIDs,
  svgToData,
} from "@iconify/utils";
import { sampleSize } from "es-toolkit";
import json2md from "json2md";
import fs from "node:fs";

fs.defaultOptions = {
  recursive: true,
};

const isDev = false;

if (fs.existsSync("data")) fs.rmSync("data", fs.defaultOptions);

(async () => {
  const iconSetPrefixes = Object.keys(await lookupCollections());

  await Promise.all(
    (
      await Promise.all(
        (isDev ? sampleSize(iconSetPrefixes, 3) : iconSetPrefixes).map(
          lookupCollection
        )
      )
    ).map((iconSet) => {
      const path = `data/${iconSet.prefix}`;

      const folders = {
        json: `${path}/json`,
        css: `${path}/css`,
        svg: `${path}/svg`,
        txt: `${path}/txt`,
      };

      for (const path of Object.values(folders))
        fs.mkdirSync(path, fs.defaultOptions);

      parseIconSetAsync(iconSet, async (name, data) => {
        data = mergeIconData(defaultIconProps, data);

        const svg = iconToSVG(data);
        const html = iconToHTML(replaceIDs(svg.body), svg.attributes);

        await Promise.all([
          fs.promises.writeFile(
            `${folders.json}/${name}.json`,
            JSON.stringify(data)
          ),
          fs.promises.writeFile(
            `${folders.css}/${name}.css`,
            getIconCSS(data, svg.attributes)
          ),
          fs.promises.writeFile(`${folders.svg}/${name}.svg`, html),
          fs.promises.writeFile(`${folders.txt}/${name}.txt`, svgToData(html)),
        ]);
      });

      fs.writeFileSync(
        `${path}/readme.md`,
        json2md({
          h1: iconSet.info.name,
          ul: [
            `Number of icons: ${iconSet.info.total}`,
            `Author: ${iconSet.info.author.name}`,
            `URL: ${iconSet.info.author.url}`,
            `License: ${iconSet.info.license.title}`,
            `License URL: ${iconSet.info.license.url}`,
            `Version: ${iconSet.info.version}`,
            `Palette: ${iconSet.info.palette ? "Colorful" : "Colorless"}`,
            `Icon set prefix: \`${iconSet.prefix}\``,
          ],
        })
      );
    })
  );
})();
