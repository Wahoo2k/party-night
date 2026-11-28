// node tools/worldmap.mjs 50m js/games/worldmap.js 0.8
// Builds js/games/worldmap.js: the world's land and country borders as SVG path data on a plain 1000 x 500
// latitude/longitude grid (x = lon + 180, y = 90 - lat, scaled). Source: Natural Earth (public domain) through the
// world-atlas package.
import fs from 'node:fs';
import { feature, mesh } from 'topojson-client';
const W = 1000, H = 500, px = ([lon, lat]) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];
const MIN = +(process.argv[4] || 0);   // drop points closer than this (map units) to the last one kept; tiny islands under 3 points go
const ringPath = ring => { const pts = []; ring.forEach((p, i) => { const q = px(p), l = pts[pts.length - 1]; if (!l || i === ring.length - 1 || Math.hypot(q[0] - l[0], q[1] - l[1]) >= MIN) pts.push(q); }); if (MIN && pts.length < 4) return '';
  // A shape that crosses the 180° line jumps from one edge of the map to the other. Each side becomes its own
  // piece, so no line is drawn across the whole map.
  const parts = [[]]; pts.forEach((q, i) => { if (i && Math.abs(q[0] - pts[i - 1][0]) > W / 2) parts.push([]); parts[parts.length - 1].push(q); });
  if (parts.length > 1 && CLOSING) { parts[0] = parts.pop().concat(parts[0]); }   // the ring's start and end belong to the same side
  return parts.filter(p => p.length > 1).map(p => p.map(([x, y], i) => (i ? 'L' : 'M') + (+x.toFixed(1)) + ' ' + (+y.toFixed(1))).join('')).join(CLOSING ? 'Z' : ''); };
let CLOSING = false;
const geomPath = (g, close) => { const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : g.type === 'MultiLineString' ? g.coordinates.map(l => [l]) : [[g.coordinates]]; return polys.map(rings => rings.map(r => { CLOSING = close; const d = ringPath(r); return d ? d + (close ? 'Z' : '') : ''; }).join('')).join(''); };
const ATLAS = process.env.ATLAS || 'node_modules/world-atlas', DETAIL = process.argv[2] || '50m';   // npm i world-atlas topojson-client
const land = JSON.parse(fs.readFileSync(`${ATLAS}/land-${DETAIL}.json`));
const countries = JSON.parse(fs.readFileSync(`${ATLAS}/countries-${DETAIL}.json`));
const LAND = feature(land, land.objects.land).features.map(f => geomPath(f.geometry, true)).join('');
const BORDERS = geomPath(mesh(countries, countries.objects.countries, (a, b) => a !== b), false);
fs.writeFileSync(process.argv[3], `// World map for Pin Drop: land and country borders as SVG paths on a 1000 x 500 latitude/longitude grid\n// (x = (lon + 180) / 360 * 1000, y = (90 - lat) / 180 * 500). Made by tools/worldmap.mjs from Natural Earth data\n// (public domain) via the world-atlas package. Do not edit by hand.\nexport const MAP_W = ${W}, MAP_H = ${H};\nexport const LAND = '${LAND}';\nexport const BORDERS = '${BORDERS}';\n`);
console.log('land', LAND.length, 'borders', BORDERS.length);
