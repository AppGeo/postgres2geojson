'use strict';
var fromPostgres = require('./');
var test = require('tape');
var foo = require('./fixtures/foo.json');

test('compare', function (t) {
  var data = [];
  fromPostgres({
      database: 'pg2cartodb'
  }, 'foo', 'geom').on('data', function (d) {
    data.push(d);
  }).on('end', function () {
    t.equals(data.length, foo.length, 'correct length');
    data.forEach(function (item, i) {
      t.ok(Math.abs(item.geometry.coordinates[0] - foo[i].geometry.coordinates[0]) < Number.EPSILON, 'equal longatudes');
      t.ok(Math.abs(item.geometry.coordinates[1] - foo[i].geometry.coordinates[1]) < Number.EPSILON, 'equal latatudes');
      t.deepEquals(item.properties, foo[i].properties, 'check properties ' + i);
    });
    t.end();
  });
});
