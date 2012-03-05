(function() {
  var AbstractGenerator, Building, BuildingGenerator, Color, DebugInfo, Escapee, EscapeeGenerator, Explosion, GarbageCollector, Particle, PhysicalObject, Physics, Viewport, animation_loop, platform_detection, rr, rw, splat_detection, time_previous, view,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Physics = {
    GRAVITY: 9.80665,
    PPM: 16,
    apply_gravity: function(o, sec) {
      return o.velocity.y += Physics.GRAVITY * sec * o.weight * Physics.PPM;
    },
    apply_velocity: function(o, sec) {
      this.apply_x_velocity(o, sec);
      return this.apply_y_velocity(o, sec);
    },
    apply_x_velocity: function(o, sec) {
      return o.x += o.velocity.x * sec * Physics.PPM;
    },
    apply_y_velocity: function(o, sec) {
      return o.y += o.velocity.y * sec * Physics.PPM;
    }
  };

  Color = (function() {

    function Color(r, g, b, a) {
      this.r = r;
      this.g = g;
      this.b = b;
      this.a = a != null ? a : 1.0;
    }

    Color.prototype.toString = function() {
      return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
    };

    Color.string = function(r, g, b, a) {
      return new Color(r, g, b, a).toString();
    };

    Color.black = function(a) {
      return Color.string(0, 0, 0, a);
    };

    Color.white = function(a) {
      return Color.string(255, 255, 255, a);
    };

    Color.gray = function(v, a) {
      return Color.string(v, v, v, a);
    };

    return Color;

  })();

  PhysicalObject = (function() {

    function PhysicalObject() {}

    PhysicalObject.prototype.right_x = function() {
      return this.x + this.width;
    };

    PhysicalObject.prototype.bottom_y = function() {
      return this.y + this.height;
    };

    PhysicalObject.prototype.set_bottom_y = function(y) {
      return this.y = y - this.height;
    };

    PhysicalObject.prototype.x_intersecting = function(other) {
      return this.x < other.right_x() && this.right_x() > other.x;
    };

    PhysicalObject.prototype.y_intersecting = function(other) {
      return this.y < other.bottom_y() && this.bottom_y() > other.y;
    };

    PhysicalObject.prototype.intersecting = function(other) {
      return this.x_intersecting(other) && this.y_intersecting(other);
    };

    PhysicalObject.prototype.weight = 1;

    return PhysicalObject;

  })();

  Escapee = (function(_super) {

    __extends(Escapee, _super);

    Escapee.prototype.gravity = true;

    Escapee.prototype.platformable = true;

    function Escapee(x, y) {
      var _ref;
      this.x = x;
      this.y = y;
      this.color = Color.string(64, 64, rr(192, 255));
      this.velocity = {
        x: rw(32, 8),
        y: 0
      };
      _ref = [16, 32], this.width = _ref[0], this.height = _ref[1];
    }

    Escapee.prototype.should_gc = function(view) {
      return this.x > view.right_x() || this.y > view.height;
    };

    Escapee.prototype.render = function(view) {
      return view.fillRect(this.x, this.y, this.width, this.height, this.color);
    };

    Escapee.prototype.jump = function() {
      this.gravity = true;
      return this.velocity.y = rr(-48, -24);
    };

    Escapee.prototype.splat = function(objects) {
      this.dead = true;
      this.gravity = true;
      this.weight = 0.4;
      this.velocity = {
        x: 0,
        y: 0
      };
      return new Explosion(objects, this.x, this.y).bang();
    };

    Escapee.prototype.walk_on_platform = function(p) {
      this.gravity = false;
      this.velocity.y = 0;
      return this.set_bottom_y(p.y);
    };

    Escapee.prototype.fall = function() {
      return this.gravity = true;
    };

    return Escapee;

  })(PhysicalObject);

  Building = (function(_super) {

    __extends(Building, _super);

    Building.prototype.platform = true;

    function Building(x, y, width, view_height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.color = Color.gray(rr(64, 128));
      this.height = view_height - this.y;
    }

    Building.prototype.should_gc = function(view) {
      return this.right_x() < view.x;
    };

    Building.prototype.render = function(view) {
      return view.fillRect(this.x, this.y, this.width, view.height - this.y, this.color);
    };

    return Building;

  })(PhysicalObject);

  Explosion = (function() {

    function Explosion(objects, x, y) {
      this.objects = objects;
      this.x = x;
      this.y = y;
    }

    Explosion.prototype.bang = function() {
      var _this = this;
      return _(32).times(function() {
        var c, p, v;
        v = {
          x: rr(4, 16),
          y: rr(-32, 16)
        };
        c = Color.string(rr(196, 255), 0, 0);
        p = new Particle(_this.x, _this.y, 8, 8, v, 0.6, c);
        return _this.objects.push(p);
      });
    };

    return Explosion;

  })();

  Particle = (function(_super) {

    __extends(Particle, _super);

    Particle.prototype.particle = true;

    Particle.prototype.gravity = true;

    function Particle(x, y, width, height, velocity, weight, color) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.velocity = velocity;
      this.weight = weight;
      this.color = color;
      this.expiry = Date.now() + 1000;
    }

    Particle.prototype.render = function(view) {
      return view.fillRect(this.x, this.y, this.width, this.height, this.color);
    };

    Particle.prototype.should_gc = function(view) {
      return Date.now() >= this.expiry;
    };

    return Particle;

  })(PhysicalObject);

  AbstractGenerator = (function() {

    function AbstractGenerator(view, objects) {
      this.view = view;
      this.objects = objects;
      this.keep_generating = __bind(this.keep_generating, this);
    }

    AbstractGenerator.prototype.start = function() {
      if (this.generate_first) this.generate_first();
      return this.keep_generating();
    };

    AbstractGenerator.prototype.keep_generating = function() {
      this.generate();
      return _.delay(this.keep_generating, this.delay());
    };

    return AbstractGenerator;

  })();

  EscapeeGenerator = (function(_super) {

    __extends(EscapeeGenerator, _super);

    function EscapeeGenerator() {
      EscapeeGenerator.__super__.constructor.apply(this, arguments);
    }

    EscapeeGenerator.prototype.delay = function() {
      return rw(500, 300);
    };

    EscapeeGenerator.prototype.generate = function() {
      return objects.unshift(new Escapee(this.view.x, rr(0, this.view.height / 2)));
    };

    return EscapeeGenerator;

  })(AbstractGenerator);

  BuildingGenerator = (function(_super) {

    __extends(BuildingGenerator, _super);

    function BuildingGenerator() {
      BuildingGenerator.__super__.constructor.apply(this, arguments);
    }

    BuildingGenerator.prototype.delay = function() {
      return 500;
    };

    BuildingGenerator.prototype.generate_first = function() {
      return this.objects.unshift(this.latest = new Building(0, view.height / 2, view.width / 2, this.view.height));
    };

    BuildingGenerator.prototype.generate = function() {
      var _results;
      _results = [];
      while (this.latest.right_x() < this.view.right_x() + 100) {
        _results.push(this.build());
      }
      return _results;
    };

    BuildingGenerator.prototype.build = function() {
      return this.objects.unshift(this.latest = new Building(this.x(), this.y(), this.width(), this.view.height));
    };

    BuildingGenerator.prototype.gap = function() {
      return rr(10, 100);
    };

    BuildingGenerator.prototype.width = function() {
      return rr(100, this.view.width / 2);
    };

    BuildingGenerator.prototype.x = function() {
      return this.latest.right_x() + this.gap();
    };

    BuildingGenerator.prototype.y = function() {
      return this.bounded(rr(this.latest.y - 64, this.latest.y + 64), 100, this.view.height - 100);
    };

    BuildingGenerator.prototype.bounded = function(i, min, max) {
      return _.max([_.min([i, max]), min]);
    };

    return BuildingGenerator;

  })(AbstractGenerator);

  DebugInfo = (function() {

    DebugInfo.prototype.width = 200;

    DebugInfo.prototype.height = 100;

    DebugInfo.prototype.margin = 10;

    DebugInfo.prototype.padding = 10;

    DebugInfo.prototype.lineHeight = 16;

    function DebugInfo(view, objects) {
      this.view = view;
      this.objects = objects;
      this.x = this.view.width - this.width - this.margin;
      this.y = this.view.height - this.height - this.margin;
    }

    DebugInfo.prototype.write = function(view, lines) {
      var i, line, _len, _results;
      view.context.font = "12px Menlo";
      view.context.fillStyle = Color.black();
      _results = [];
      for (i = 0, _len = lines.length; i < _len; i++) {
        line = lines[i];
        _results.push(view.context.fillText(line, this.x + this.padding, this.y + this.padding + this.lineHeight + i * this.lineHeight));
      }
      return _results;
    };

    DebugInfo.prototype.render = function(view) {
      view.context.fillStyle = Color.white(0.5);
      view.context.fillRect(this.x, this.y, this.width, this.height);
      return this.write(view, [
        "objects: " + objects.length, "platforms: " + _(objects).filter(function(o) {
          return o.platform;
        }).length, "gravitables: " + _(objects).filter(function(o) {
          return o.gravity;
        }).length, "particles: " + _(objects).filter(function(o) {
          return o.particle;
        }).length
      ]);
    };

    return DebugInfo;

  })();

  Viewport = (function() {

    function Viewport(width, height) {
      var _ref, _ref2;
      this.width = width;
      this.height = height;
      this.canvas = document.getElementById("antibalt");
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.canvas.style.backgroundColor = "black";
      this.context = this.canvas.getContext("2d");
      _ref = [this.canvas.width, this.canvas.height], this.width = _ref[0], this.height = _ref[1];
      _ref2 = [0, 0], this.x = _ref2[0], this.y = _ref2[1];
      this.velocity = {
        x: 16,
        y: 0
      };
    }

    Viewport.prototype.right_x = function() {
      return this.x + this.width;
    };

    Viewport.prototype.clear = function() {
      return this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };

    Viewport.prototype.fillRect = function(x, y, width, height, fillStyle) {
      this.context.fillStyle = fillStyle;
      return this.context.fillRect(x - this.x, y - this.y, width, height);
    };

    return Viewport;

  })();

  GarbageCollector = (function() {

    function GarbageCollector(view, objects) {
      this.view = view;
      this.objects = objects;
      this.keep_collecting = __bind(this.keep_collecting, this);
    }

    GarbageCollector.prototype.start = function() {
      return this.keep_collecting();
    };

    GarbageCollector.prototype.keep_collecting = function() {
      try {
        this.collect();
      } catch (e) {
        console.log("GC caught %o", e);
      }
      return _.delay(this.keep_collecting, 100);
    };

    GarbageCollector.prototype.collect = function() {
      var i, indices, o, _i, _len, _len2, _ref, _results;
      indices = [];
      _ref = this.objects;
      for (i = 0, _len = _ref.length; i < _len; i++) {
        o = _ref[i];
        if (o.should_gc && o.should_gc(this.view)) indices.push(i);
      }
      _results = [];
      for (_i = 0, _len2 = indices.length; _i < _len2; _i++) {
        i = indices[_i];
        if (this.objects[i].should_gc) {
          _results.push(this.objects.splice(i, 1));
        } else {
          throw "Illegal GC";
        }
      }
      return _results;
    };

    return GarbageCollector;

  })();

  rr = function(from, to) {
    return from + Math.floor(Math.random() * (to - from));
  };

  rw = function(mid, radius) {
    return rr(mid - radius, mid + radius);
  };

  splat_detection = function(o, objects) {
    var platform;
    if (o.dead) return;
    platform = _(objects).detect(function(other) {
      return other.platform && other.x_intersecting(o);
    });
    if (platform && platform.intersecting(o)) return o.splat(objects);
  };

  platform_detection = function(o, objects) {
    var distance_to_edge, platform;
    if (o.dead) return;
    platform = _(objects).detect(function(other) {
      return other.platform && other.x_intersecting(o);
    });
    if (platform && o.gravity) {
      if (o.bottom_y() >= platform.y) o.walk_on_platform(platform);
    }
    if (platform && !o.gravity) {
      distance_to_edge = platform.right_x() - o.x;
      if (distance_to_edge >= 0 && distance_to_edge < 100) o.jump();
    }
    if (!platform && !o.gravity) return o.fall();
  };

  view = new Viewport(1200, 600);

  window.objects = [];

  objects.push(new DebugInfo(view, objects));

  new EscapeeGenerator(view, objects).start();

  new BuildingGenerator(view, objects).start();

  new GarbageCollector(view, objects).start();

  time_previous = Date.now();

  animation_loop = function() {
    var i, o, seconds_elapsed, time_now, _len;
    time_now = Date.now();
    seconds_elapsed = (time_now - time_previous) / 1000;
    time_previous = time_now;
    view.clear();
    Physics.apply_velocity(view, seconds_elapsed);
    for (i = 0, _len = objects.length; i < _len; i++) {
      o = objects[i];
      if (o.velocity) Physics.apply_x_velocity(o, seconds_elapsed);
      if (o.platformable) splat_detection(o, objects);
      if (o.gravity) Physics.apply_gravity(o, seconds_elapsed);
      if (o.velocity) Physics.apply_y_velocity(o, seconds_elapsed);
      if (o.platformable) platform_detection(o, objects);
      if (o.render) o.render(view);
    }
    return webkitRequestAnimationFrame(animation_loop);
  };

  animation_loop();

}).call(this);
