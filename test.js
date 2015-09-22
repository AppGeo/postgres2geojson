'use strict';
var fromPostgres = require('./');
var test = require('tape');
var foo = require('./foo.json');

test('compare', function (t) {
  t.plan(1);
  var data = [];
  fromPostgres({
      database: 'pg2cartodb'
  }, 'foo', 'geom').on('data', function (d) {
    data.push(d);
  }).on('end', function () {
    t.deepEquals(foo, data);
  });
});
