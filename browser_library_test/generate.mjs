import * as fs from 'fs';

import {Generator} from '@jspm/generator';

const generator = new Generator({
  mapUrl: './lib/build/',
  defaultProvider: 'nodemodules',
  env: ['production', 'browser', 'module'],
  // Work around jspm/generator#259
  commonJS: true,
});

await generator.install('./cli-pkg-test');

const map = generator.getMap();

// Add ./packages/cli_pkg_test/build/ so that URLs can be resolved in the URL
// scheme generated by the test package.
const prefix = './packages/cli_pkg_test/build/';
function addPrefixToValues(map) {
  for (const [key, value] of Object.entries(map)) {
    map[key] = prefix + value;
  }
}

addPrefixToValues(map['imports']);

for (const [scope, imports] of Object.entries(map['scopes'])) {
  delete map['scopes'][scope];
  map['scopes'][prefix + scope] = imports;
  addPrefixToValues(imports);
}

fs.writeFileSync('test/jspm_test.html', `
<!doctype html>
<html>
  <head>
    <title>JSPM Test</title>
    <link rel="x-dart-test" href="jspm_test.dart">
    <script src="packages/test/dart.js"></script>
    <script type="importmap">${JSON.stringify(map)}</script>
    <script src="packages/cli_pkg_test/import.js" type="module"></script>
  </head>
  <body>
  </body>
</html>
`);
