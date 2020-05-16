function scalar(x, y) {
  return (x[0] * y[0] + x[1] * y[1]);
}

function det(x, y) {
  return (x[0] * y[1] - x[1] * y[0]);
}

function circular(l, i) {
  if ((i > 0) && (i <= l - 2)) {
    return ([i - 1, i + 1]);
  } else if (i === 0) {
    return ([l - 2, 1]);
  } else if (i === l - 1) {
    return ([l - 2, 1]);
  }
}

function unit(v) {
  var sr = Math.sqrt(scalar(v, v));
  return ([v[0] / sr, v[1] / sr]);
}

function vector(x, y) {
  return ([y[0] - x[0], y[1] - x[1]]);
}

function sum(a, b) {
  return ([a[0] + b[0], a[1] + b[1]]);
}

function vct_max(jad, point, p, saver) {
  var s;
  var tsd = scalar(vector(point, p), vector(point, p));
  saver[0] = vector(jad[0][0], jad[0][1]);
  var masafa = scalar(saver[0], saver[0]);
  var pid = 1;
  var vs = [0, 0];
  for (var i = 1; i < jad[0].length - 1; i++) {
    vs = sum(vs, saver[i - 1]);
    saver[saver.length] = vector(jad[0][i], jad[0][i + 1]);
    s = scalar(vs, vs);
    if (s > masafa) {
      pid = i;
      masafa = s;
    }
  }
  if (tsd <= masafa) {
    return pid;
  } else {
    return -1;
  }
}

function filter(jad, point, p, saver) {
  let b;
  let s;
  let tsd = scalar(vector(point, p), vector(point, jad[0][1]));
  saver[0] = vector(jad[0][0], jad[0][1]);
  // var masafa = scalar(saver[0], saver[0]);
  let vs = [0, 0];
  for (var i = 1; i < jad[0].length - 1; i++) {
    vs = sum(vs, saver[i - 1]);
    saver[saver.length] = vector(jad[0][i], jad[0][i + 1]);
    s = scalar(vector(point, p), unit(vs));
    if (s > tsd) {
      tsd = s;
      if (scalar(vector(point, p), vs) <= scalar(vs, vs)) {
        b = true;
      } else {
        b = false;
      }
    }
  }
  return b;
}

function distance(jad, p) {
  const v = vector(jad, p);
  return scalar(v, v);
}

function sort_feacher(GeoJSON, p) {
  const sorted = [];
  for (let i = 0; i < GeoJSON.features.length; i++) {
    sorted[i] = {distance: get_distance(GeoJSON.features[i].geometry, p), id: i};
  }
  return sorted.sort(function (a, b) {
    return (a.distance - b.distance);
  });
}

function get_distance(geometry, p) {
  if (geometry.type === 'Polygon') {
    return distance(geometry.coordinates[0][0], p);
  } else if (geometry.type === 'GeometryCollection') {
    return get_distance(geometry.geometries[0], p);
  } else {
    return distance(geometry.coordinates[0][0][0], p);
  }
}

function normal_ref_vector(jad, mix) {
  var n = unit(vector(jad[0][mix], jad[0][circular(jad[0].length, mix)[1]]));
  if (scalar([n[1], -n[0]], vector(jad[0][mix], jad[0][circular(jad[0].length, mix)[0]])) <= 0) {
    return ([n[1], -n[0]]);
  } else {
    return ([-n[1], n[0]]);
  }
}

function normal(v) {
  return [-v[1], v[0]];
}

function delation(v, k) {
  return [v[0] * k, v[1] * k]
}

function normal_vector(jad, i, mx, mix) {
  var d = vector(jad[0][mix], jad[0][circular(jad[0].length, mix)[1]]);
  var f = vector(jad[0][i], jad[0][circular(jad[0].length, i)[1]]);
  var cosine = scalar(d, f);
  var sine = det(d, f);
  var r = [(mx[0] * cosine - mx[1] * sine), (mx[0] * sine + mx[1] * cosine)];
  return r;
}

function normalv(jad, i, mx, mix) {
  var cosine = scalar(unit(mix), unit(i));
  var sine = det(unit(mix), unit(i));
  return ([(mx[0] * cosine - mx[1] * sine), (mx[0] * sine + mx[1] * cosine)]);
}

function sort_vector(jad, p, saver) {
  const srt = [];
  let v = [];
  let d = [];
  let viv;
  let bln = true;
  let u = 1000000;
  srt[0] = [u, -1];
  for (let i = 0; i < jad[0].length - 1; i++) {
    d = saver[i];
    v = vector(jad[0][i], p);
    if (scalar(v, d) >= 0) {
      // var ti = (new Date()).getTime();
      if (scalar(v, d) <= scalar(d, d)) {
        f = det(v, unit(d));
        if (Math.pow(f, 2) <= srt[0][0]) {
          srt[0][0] = Math.pow(f, 2);
          srt[0][1] = i;
        }
        bln = false;
      } else {
        bln = true;
      }
    } else {
      if (bln) {
        if (scalar(v, v) <= u) {
          u = scalar(v, v);
          viv = i;
        }
      }
    }
  }
  srt[1] = [];
  srt[1][0] = u;
  srt[1][1] = viv;
  return srt;
}

function polygon(jad, p) {
  let intern = false;
  const saver = [];
  const threshold = vct_max(jad, jad[0][0], p, saver);
  if (threshold !== -1) {
    const mx = normal_ref_vector(jad, threshold);
    // var ti = (new Date()).getTime();
    const tbs = sort_vector(jad, p, saver);
    if (tbs[0][0] <= tbs[1][0]) {
      if (tbs[0][0] <= tbs[1][0]) {
        if (scalar(normal_vector(jad, tbs[0][1], mx, threshold), vector(jad[0][tbs[0][1]], p)) <= 0) {
          intern = true;
        }
      }
    } else {
      const v = vector(jad[0][tbs[1][1]], p);
      if (Math.abs(det(v, unit(saver[tbs[1][1]]))) > Math.abs(det(v, unit(saver[((tbs[1][1] > 0) ? tbs[1][1] - 1 : saver.length - 1)])))) {
        if (scalar(normal_vector(jad, tbs[1][1], mx, threshold), v) <= 0) {
          intern = true;
        }
      } else {
        if (scalar(normal_vector(jad, circular(jad[0].length, tbs[1][1])[0], mx, threshold), v) <= 0) {
          intern = true;
        }
      }
    }
  }
  return intern;
}

function feature(GeoJSON, p) {
  const a = [];
  const sort = sort_feacher(GeoJSON, p);
  for (let i = 0; i < sort.length; i++) {
    const res = checkInsidePolygon(GeoJSON.features[sort[i].id].geometry, p);
    if (res) {
      a.push({
        id: sort[i].id,
        properties: GeoJSON.features[sort[i].id].properties,
        ...res
      });
    }
  }
  return a;
}

function checkInsidePolygon(geometry, p) {
  if (geometry.type === 'Polygon') {
    if (polygon(geometry.coordinates, p)) {
      return {type: 'Polygon'};
    }
  } else if (geometry.type === 'GeometryCollection') {
    for (const g of geometry.geometries) {
      const res = checkInsidePolygon(g, p);
      if (res) {
        res.subType = res.type;
        res.type = 'GeometryCollection';
        return res;
      }
    }
  } else if (geometry.type === 'MultiPolygon') {
    for (let j = 0; j < geometry.coordinates.length; j++) {
      if (this.polygon(geometry.coordinates[j], p)) {
        return {
          type: 'MultiPolygon',
          polygon: j
        };
      }
    }
  } else {
    throw new Error(`Type '${geometry.type}' is not supported`);
  }
  return undefined;
}

module.exports = {polygon, feature};

