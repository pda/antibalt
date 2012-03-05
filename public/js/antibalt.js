(function() {
  var AbstractGenerator, Building, BuildingGenerator, Color, DebugInfo, Escapee, EscapeeGenerator, GarbageCollector, PhysicalObject, Physics, Viewport, animation_loop, apply_platformability, objects, rr, rw, time_previous, view,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Physics = {
    GRAVITY: 9.80665,
    PPM: 16,
    apply_gravity: function(o, sec) {
      return o.velocity.y += Physics.GRAVITY * sec * Physics.PPM;
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
      return this.x > view.right_x();
    };

    Escapee.prototype.render = function(view) {
      return view.fillRect(this.x, this.y, this.width, this.height, this.color);
    };

    Escapee.prototype.jump = function() {
      return this.velocity.y = rr(-48, -24);
    };

    return Escapee;

  })(PhysicalObject);

  Building = (function(_super) {

    __extends(Building, _super);

    Building.prototype.platform = true;

    function Building(x, y, width) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.color = Color.gray(rr(64, 128));
    }

    Building.prototype.should_gc = function(view) {
      return this.right_x() < view.x;
    };

    Building.prototype.render = function(view) {
      return view.fillRect(this.x, this.y, this.width, view.height - this.y, this.color);
    };

    return Building;

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
      return this.objects.unshift(this.latest = new Building(0, view.height / 2, view.width / 2));
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
      return this.objects.unshift(this.latest = new Building(this.x(), this.y(), this.width()));
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

  apply_platformability = function(o, objects) {
    var distance_to_edge, other, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = objects.length; _i < _len; _i++) {
      other = objects[_i];
      if (!other.platform) continue;
      if (o.bottom_y() >= other.y) {
        if (o.x >= other.x && o.x <= other.right_x()) {
          o.velocity.y = 0;
          o.set_bottom_y(other.y);
        }
        distance_to_edge = other.right_x() - o.x;
        if (distance_to_edge >= 0 && distance_to_edge < 100) {
          _results.push(o.jump());
        } else {
          _results.push(void 0);
        }
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  view = new Viewport(1600, 600);

  objects = [];

  objects.push(new DebugInfo(view, objects));

  new EscapeeGenerator(view, objects).start();

  new BuildingGenerator(view, objects).start();

  new GarbageCollector(view, objects).start();

  time_previous = Date.now();

  animation_loop = function() {
    var i, o, seconds_elapsed, time_now, _len;
    time_now = Date.now();
    seconds_elapsed = (time_now - time_previous) / 1000;
    view.clear();
    Physics.apply_velocity(view, seconds_elapsed);
    for (i = 0, _len = objects.length; i < _len; i++) {
      o = objects[i];
      if (o.gravity) Physics.apply_gravity(o, seconds_elapsed);
      if (o.velocity) Physics.apply_y_velocity(o, seconds_elapsed);
      if (o.platformable) apply_platformability(o, objects);
      if (o.velocity) Physics.apply_x_velocity(o, seconds_elapsed);
      if (o.render) o.render(view);
    }
    webkitRequestAnimationFrame(animation_loop);
    return time_previous = time_now;
  };

  animation_loop();

}).call(this);
