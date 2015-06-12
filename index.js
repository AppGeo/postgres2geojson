'use strict';
var knex = require('knex');
var Transform = require('readable-stream').Transform;
var noms = require('noms').obj;
var debug = require('debug')('fromPostgres');
module.exports = fromPostgres;

function fromPostgres(connection, table, geom, primary, offset, limit) {
  var nogeom = (geom === false);

  geom = geom || 'shape';
  primary = primary || 'objectid';
  var db = knex({
    client: 'pg',
    connection: connection
  });
  var query;
  if (limit) {
    query = noms(function (done) {
      var self = this;
      db(table)
       .select(nogeom ? '*' : db.raw('*, st_asgeojson(ST_Transform("' + geom + '", 4326)) as __geom__')).where(primary, '<=', limit).then(function (resp) {
        resp.forEach(function (item) {
          this.push(item);
        }, self);
        done(null, null);
      }).catch(done);
    });
  } else {
    query = makeStream(db(table)
      .select(nogeom ? '*' : db.raw('*, st_asgeojson(ST_Transform("' + geom + '", 4326)) as __geom__')), primary, offset);
  }
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
  return query.on('error', function (e) {
    out.emit('error', e);
  }).pipe(out);
}


function makeStream(_query, primary, offset) {
  offset = offset || 0;
  var unit = 600;
  return noms(function (done) {
    var self = this;
    var query = _query.clone();
    debug(offset);
    query.where(primary, '>', offset).orderBy(primary).limit(unit).then(function (resp) {

      if (!resp.length) {
        self.push(null);
        return done();
      }
      resp.forEach(function (item) {
        offset = Math.max(item[primary], offset);
        this.push(item);
      }, self);
      done();
    }).catch(done);
  });
}
