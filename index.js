'use strict';
var knex = require('knex');
var Transform = require('readable-stream').Transform;

module.exports = fromPostgres;

function fromPostgres(connection, table, geom, offset, limit) {
  var nogeom = (geom === false);

  geom = geom || 'shape';
  var db = knex({
    client: 'pg',
    connection: connection
  });
  var query = db(table)
   .select(nogeom ? '*' : db.raw('*, st_asgeojson(ST_Transform("' + geom + '", 4326)) as __geom__'));
  var out = new Transform({
      objectMode: true,
      transform: function (chunk, _, next) {
        var geo;
        if (chunk.__geom__) {
          try {
            geo = JSON.parse(chunk.__geom__);
          } catch (e) {
            return next(e);
          }
          delete chunk.__geom__;
          delete chunk[geom];
        }
        this.push({
          type: 'feature',
          properties: chunk,
          geometry: geo
        });
        next();
      },
      flush: function (done) {
        db.destroy(function (err) {
          done(err);
        });
      }
    });
  return query.stream().on('error', function (e) {
    out.emit('error', e);
  }).pipe(out);
}
