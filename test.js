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
      t.deepEquals(item, foo[i], 'check item ' + i);
    });
    t.end();
  });
});
