'use strict';
var fromPostgres = require('./');
var test = require('tape');
var foo = require('./fixtures/foo.json');
var min = 1e-10;
test('compare', function (t) {
  var data = [];
  fromPostgres({
      database: 'pg2cartodb'
  }, 'foo', 'geom').on('data', function (d) {
    data.push(d);
  }).on('end', function () {
    t.equals(data.length, foo.length, 'correct length');
    data.forEach(function (item, i) {
      t.ok(Math.abs(item.geometry.coordinates[0] - foo[i].geometry.coordinates[0]) < min, `equal lons ${item.geometry.coordinates[0]} vs ${foo[i].geometry.coordinates[0]}`);
      t.ok(Math.abs(item.geometry.coordinates[1] - foo[i].geometry.coordinates[1]) < min, `equal lats ${item.geometry.coordinates[1]} vs ${foo[i].geometry.coordinates[1]}`);
      t.deepEquals(item.properties, foo[i].properties, 'check properties ' + i);
    });
    t.end();
  });
});
