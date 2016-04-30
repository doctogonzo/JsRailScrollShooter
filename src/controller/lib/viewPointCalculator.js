(function() {
    "use strict";

    function normalizeVector(v) {
        var len = Math.abs(v.x) + Math.abs(v.y) + Math.abs(v.z);
        v.x /= len;
        v.y /= len;
        v.z /= len;
        return v;
    }

    var toRad = Math.PI / 180;

    function getVector(pos) {
        var a = pos.alpha * toRad,
            b = pos.beta * toRad,
            g = pos.gamma * toRad;

        var cb = Math.cos(b);
        return {
            x: Math.cos(a)*cb,
            y: Math.sin(a)*cb,
            z: Math.sin(b)
        };
    }

    var EPS = 1e-9;

    function getIntersection3d(a1, a2, b2) {
        var p1 = a2.x - b2.x,
            q1 = a2.y - b2.y,
            r1 = a2.z - b2.z;
        var p = a1.x,
            q = a1.y,
            r = a1.z;
        var i = (q*p1-q1*p),
            j = (p*q1-p1*q),
            k = (q*r1-q1*r);
        if ((Math.abs(i) < EPS) || (Math.abs(j) < EPS) || (Math.abs(k) < EPS))
            return;
        return {
            x: (a2.y*p*p1-a2.x*q1*p)/i,
            y: (a2.x*q*q1-a2.y*p1*q)/j,
            z: (a2.y*r*r1-a2.z*q1*r)/k
        };
    }

    function getVectorProjection(v, v2, v3) {
        var a = v2.y*v3.z-v2.z*v3.y,
            b = v2.z*v3.x-v2.x*v3.z,
            c = v2.x*v3.y-v2.y*v3.x;
        var t = -(a*v.x+b*v.y+c*v.z)/(a*a+b*b+c*c);
        return {
            x: v.x+a*t,
            y: v.y+b*t,
            z: v.z+c*t
        };
    }

    //function pointProjection(a, b, s){
    //    var xa = a.x,
    //        ya = a.y,
    //        za = a.z,
    //        xb = b.x,
    //        yb = b.y,
    //        zb = b.z,
    //        xs = s.x,
    //        ys = s.y,
    //        zs = s.z;
    //    var xv = xb-xa,
    //        yv = yb-ya,
    //        zv = zb-za;
    //    var p1 = ((xs - xa) * xv + (ys - ya) * yv + (zs - za) * zv),
    //        p2 = (xv * xv + yv * yv + zv * zv);
    //
    //    return {
    //        x: xa + xv * p1 / p2,
    //        y: ya + yv * p1 / p2,
    //        z: za + zv * p1 / p2
    //    };
    //}
    //pointProjection({x:0,y:0,z:0},{x:2,y:0,z:0},{x:1,y:1,z:1});

    function get3dDist(nv1, nv2) {
        return Math.pow(Math.pow(nv1.x - nv2.x, 2)
            + Math.pow(nv1.y - nv2.y, 2)
            + Math.pow(nv1.z - nv2.z, 2), 0.5);
    }


    function isPosS(a, b, s) {
        return ((((b.x - a.x > EPS) === (s.x - a.x > EPS)) || (Math.abs(b.x - a.x) < EPS))
        && (((b.y - a.y > EPS) === (s.y - a.y > EPS)) || (Math.abs(b.y - a.y) < EPS))
        && (((b.z - a.z > EPS) === (s.z - a.z > EPS)) || (Math.abs(b.z - a.z) < EPS))) ? 1 : -1;
    }

    function get2dFrom3d(a, a2d, b, b2d, s) {
        //var sp = pointProjection(a, b, s);
        var sp = getIntersection3d(getVectorProjection(s, a, b), a, b);
        if (!sp)
            return;
        var part = isPosS(a, b, sp)*get3dDist(a, sp)/get3dDist(a, b);
        return {
            x: a2d.x+(b2d.x-a2d.x)*part,
            y: a2d.y+(b2d.y-a2d.y)*part
        }
    }

    function get2dLine(a2d, b2d) {
        return {
            a: a2d.y-b2d.y,
            b: b2d.x-a2d.x,
            c: a2d.x*b2d.y-b2d.x*a2d.y
        };
    }

    function get2dProj3d(a, a2d, b, b2d, s) {
        var pt = get2dFrom3d(a, a2d, b, b2d, s);
        if (!pt)
            return;
        var m = get2dLine(a2d, b2d);
        return {
            a: -m.b,
            b: m.a,
            c: m.b*pt.x-m.a*pt.y
        }
    }

    function det(a, b, c, d) {
        return a * d - b * c;
    }

    function getIntersection(m, n) {
        var zn = det (m.a, m.b, n.a, n.b);
        if (Math.abs(zn) < EPS)
            return null;
        return {
            x: - det (m.c, m.b, n.c, n.b) / zn,
            y: - det (m.a, m.c, n.a, n.c) / zn
        };
    }

    //getIntersection({a:0, b: 1, c:-1},{a:-1, b: 0, c:0})

    function getMassCenterPoint(pts) {
        var x = 0,
            y = 0;
        if (pts.length === 0)
            return;
        for (var i = 0; i < pts.length; i++) {
            var pt = pts[i];
            x += pt.x;
            y += pt.y;
        }
        return {
            x: x/pts.length,
            y: y/pts.length
        };
    }

    var viewPointCalculator = window.viewPointCalculator = function() {
        this.clearCalibration();
    };

    viewPointCalculator.prototype = {
        addCalibration: function(x,y,pos) {
            this._calibrations.push({
                v: getVector(pos),
                pt: {
                    x: x,
                    y: y
                }
            });
        },
        clearCalibration: function() {
            this._calibrations = [];
        },
        getPoint: function(pos) {
            return this.getPointFromVector(getVector(pos));
        },
        getPointFromVector: function(v) {
            var lines = [];
            for (var i = 0; i < this._calibrations.length; i++) {
                var calA = this._calibrations[i];
                for (var j = i + 1; j < this._calibrations.length; j++) {
                    var calB = this._calibrations[j];
                    var proj = get2dProj3d(calA.v, calA.pt, calB.v, calB.pt, v);
                    if (!proj) {
                        return;
                    }
                    lines.push(proj);
                }
            }
            //check zero division
            var pts = [];
            for (var k = 0; k < lines.length; k++) {
                for (var n = k + 1; n < lines.length; n++) {
                    var pt = getIntersection(lines[k], lines[n]);
                    if (pt)
                        pts.push(pt);
                }
            }
            return getMassCenterPoint(pts);
        },
        getVector: function(pos) {
            return getVector(pos);
        }
    };

    //var pointCalculator = new viewPointCalculator();
    //pointCalculator._calibrations.push({
    //    v: normalizeVector({
    //        x: 0,
    //        y: -1,
    //        z: 0
    //    }),
    //    pt: {
    //        x: 0,
    //        y: 0
    //    }
    //});
    //pointCalculator._calibrations.push({
    //    v: normalizeVector({
    //        x: 1,
    //        y: -1,
    //        z: 0
    //    }),
    //    pt: {
    //        x: 1,
    //        y: 0
    //    }
    //});
    //pointCalculator._calibrations.push({
    //    v: normalizeVector({
    //        x: 0,
    //        y: -1,
    //        z: 1
    //    }),
    //    pt: {
    //        x: 0,
    //        y: 1
    //    }
    //});
    //console.log(pointCalculator.getPointFromVector(normalizeVector({
    //    x: -1,
    //    y: -1,
    //    z: -1
    //})));
})();