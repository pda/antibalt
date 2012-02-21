(function() {
  var Building, BuildingGenerator, Color, DebugInfo, Escapee, EscapeeGenerator, Physics, Viewport, animation_loop, apply_platformability, canvas, objects, rr, rw, time_previous, view,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  canvas = document.getElementById("antibalt");

  canvas.width = 1600;

  canvas.height = 600;

  canvas.style.backgroundColor = "black";

  Physics = {
    GRAVITY: 9.80665,
    PPM: 16,
    apply_gravity: function(o, sec) {
      return o.velocity.y += Physics.GRAVITY * sec * Physics.PPM;
    },
    apply_velocity: function(o, sec) {
      o.x += o.velocity.x * sec * Physics.PPM;
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

  Escapee = (function() {

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

  })();

  Building = (function() {

    Building.prototype.platform = true;

    function Building(x, y, width) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.color = Color.gray(rr(64, 128));
    }

    Building.prototype.right_x = function() {
      return this.x + this.width;
    };

    Building.prototype.should_gc = function(view) {
      return this.right_x() < view.x;
    };

    Building.prototype.render = function(view) {
      return view.fillRect(this.x, this.y, this.width, canvas.height - this.y, this.color);
    };

    return Building;

  })();

  EscapeeGenerator = (function() {

    function EscapeeGenerator(view, objects) {
      this.view = view;
      this.objects = objects;
      this.keep_escaping = __bind(this.keep_escaping, this);
    }

    EscapeeGenerator.prototype.start = function() {
      return this.keep_escaping();
    };

    EscapeeGenerator.prototype.keep_escaping = function() {
      objects.unshift(new Escapee(this.view.x, rr(0, this.view.height / 2)));
      return _.delay(this.keep_escaping, rw(500, 300));
    };

    return EscapeeGenerator;

  })();

  BuildingGenerator = (function() {

    function BuildingGenerator(view, objects) {
      this.view = view;
      this.objects = objects;
      this.keep_building = __bind(this.keep_building, this);
    }

    BuildingGenerator.prototype.start = function() {
      this.objects.unshift(this.latest = new Building(0, view.height / 2, view.width / 2));
      return this.keep_building();
    };

    BuildingGenerator.prototype.keep_building = function() {
      this.fill_screen();
      return _.delay(this.keep_building, 500);
    };

    BuildingGenerator.prototype.fill_screen = function() {
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

  })();

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

    function Viewport(canvas) {
      var _ref, _ref2;
      this.canvas = canvas;
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
      if ((o.y + o.height) >= other.y) {
        if (o.x >= other.x && o.x <= (other.x + other.width)) {
          o.velocity.y = 0;
          o.y = other.y - o.height;
        }
        distance_to_edge = other.x + other.width - o.x;
        if (distance_to_edge >= 0 && distance_to_edge < 64) {
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

  view = new Viewport(canvas);

  objects = [];

  objects.push(new DebugInfo(view, objects));

  new EscapeeGenerator(view, objects).start();

  new BuildingGenerator(view, objects).start();

  time_previous = Date.now();

  animation_loop = function() {
    var gc, i, o, seconds_elapsed, time_now, _i, _len, _len2;
    time_now = Date.now();
    seconds_elapsed = (time_now - time_previous) / 1000;
    view.clear();
    Physics.apply_velocity(view, seconds_elapsed);
    gc = [];
    for (i = 0, _len = objects.length; i < _len; i++) {
      o = objects[i];
      if (o.gravity) Physics.apply_gravity(o, seconds_elapsed);
      if (o.velocity) Physics.apply_velocity(o, seconds_elapsed);
      if (o.platformable) apply_platformability(o, objects);
      if (o.render) o.render(view);
      if (o.should_gc && o.should_gc(view)) gc.push(i);
    }
    for (_i = 0, _len2 = gc.length; _i < _len2; _i++) {
      i = gc[_i];
      objects.splice(i, 1);
    }
    webkitRequestAnimationFrame(animation_loop);
    return time_previous = time_now;
  };

  animation_loop();

}).call(this);
