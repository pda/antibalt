(function() {
  var Animator, Building, BuildingGenerator, Bullet, Color, Crosshair, DebugInfo, Escapee, EscapeeGenerator, Explosion, GarbageCollector, IntervalCommand, Particle, PhysicalObject, Physics, Viewport, animator, click_listener, crosshair, interval_commands, mouse_move_listener, platform_detection, platform_x_intersecting, rr, rw, shootables_hit, splat_detection, ticker, view,
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
      return this.string(0, 0, 0, a);
    };

    Color.white = function(a) {
      return this.string(255, 255, 255, a);
    };

    Color.gray = function(v, a) {
      return this.string(v, v, v, a);
    };

    Color.fader = function(r, g, b, seconds, initial) {
      var start;
      if (initial == null) initial = 1;
      start = Date.now();
      return function() {
        var alpha, elapsed;
        elapsed = (Date.now() - start) / 1000;
        alpha = Math.max(0, initial - elapsed / seconds * initial);
        return Color.string(r, g, b, alpha);
      };
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

  Crosshair = (function(_super) {

    __extends(Crosshair, _super);

    function Crosshair(view) {
      var bullet, _ref;
      this.aim({
        x: view.width / 2,
        y: view.height / 2
      });
      bullet = new Bullet(0, 0);
      _ref = [bullet.width, bullet.height], this.width = _ref[0], this.height = _ref[1];
      this.color = Color.string(255, 255, 0, 0.1);
      this.color_dot = Color.black();
    }

    Crosshair.prototype.aim = function(point) {
      this.center = point;
      this.x = point.x - this.width / 2;
      return this.y = point.y - this.height / 2;
    };

    Crosshair.prototype.render = function(view) {
      view.context.fillStyle = this.color;
      view.context.fillRect(this.x, this.y, this.width, this.height);
      view.context.fillStyle = this.color_dot;
      return view.context.fillRect(this.center.x, this.center.y, 4, 4);
    };

    return Crosshair;

  })(PhysicalObject);

  Bullet = (function(_super) {

    __extends(Bullet, _super);

    function Bullet(x, y) {
      this.width = this.size;
      this.height = this.size;
      this.x = x - this.width / 2;
      this.y = y - this.height / 2;
      this.created_at = Date.now();
    }

    Bullet.prototype.size = 64;

    return Bullet;

  })(PhysicalObject);

  Escapee = (function(_super) {

    __extends(Escapee, _super);

    Escapee.prototype.gravity = true;

    Escapee.prototype.platformable = true;

    Escapee.prototype.shootable = true;

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
      var time;
      time = Date.now();
      return this.drawRunning(view, time);
    };

    Escapee.prototype.drawRunning = function(view, time) {
      var base, phase;
      phase = Math.sin(time * 0.03);
      base = view.world_to_view(this.x, this.y);
      view.context.save();
      view.context.translate(base.x, base.y);
      view.context.save();
      view.context.fillStyle = this.color;
      view.context.rotate(phase * 0.2);
      view.context.fillRect(0, 0, 16, 16);
      view.context.fillStyle = Color.string(32, 32, 128);
      view.context.fillRect(12, 4, 4, 4);
      view.context.fillRect(8, 10, 8, 4);
      view.context.restore();
      view.context.translate(4, 16);
      view.context.rotate(phase * 0.5 + 0.1);
      view.context.fillStyle = this.color;
      view.context.fillRect(0, 0, 8, 16);
      view.context.rotate(phase * -1);
      view.context.fillStyle = this.color;
      view.context.fillRect(0, 0, 8, 16);
      return view.context.restore();
    };

    Escapee.prototype.jump = function() {
      this.gravity = true;
      return this.velocity.y = rr(-48, -24);
    };

    Escapee.prototype.die = function() {
      this.dead = true;
      this.gravity = true;
      this.weight = 0.4;
      return this.velocity = {
        x: 0,
        y: 0
      };
    };

    Escapee.prototype.splat = function(objects) {
      this.die();
      return new Explosion(objects, this.x, this.y).splat();
    };

    Escapee.prototype.bang = function(objects) {
      this.die();
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
      this.color = Color.gray(rw(64, 16));
      this.height = view_height - this.y;
      this.calculate_windows();
    }

    Building.prototype.should_gc = function(view) {
      return this.right_x() < view.x;
    };

    Building.prototype.render = function(view) {
      view.fillRect(this.x, this.y, this.width, this.height, this.color);
      return this.draw_windows();
    };

    Building.prototype.calculate_windows = function() {
      var min_width, mx, my, per_row;
      min_width = rw(48, 16);
      this.window_height = rw(32, 8);
      this.window_margin_x = mx = rr(4, 8);
      this.window_margin_y = my = rr(16, 24);
      this.windows_per_row = per_row = Math.floor((this.width - mx) / (min_width + mx));
      this.window_width = (this.width - mx - (per_row * mx)) / per_row;
      this.window_rows = Math.ceil(this.height / (this.window_height + my));
      return this.window_color = Color.gray(16);
    };

    Building.prototype.nth_window_x = function(col) {
      var mx;
      mx = this.window_margin_x;
      return this.x + mx + (col * (mx + this.window_width));
    };

    Building.prototype.nth_window_y = function(row) {
      var my;
      my = this.window_margin_y;
      return this.y + my + (row * (my + this.window_height));
    };

    Building.prototype.draw_windows = function() {
      var _this = this;
      return _(this.window_rows).times(function(row) {
        return _this.draw_window_row(row);
      });
    };

    Building.prototype.draw_window_row = function(row) {
      var y,
        _this = this;
      y = this.nth_window_y(row);
      return _(this.windows_per_row).times(function(n) {
        return view.fillRect(_this.nth_window_x(n), y, _this.window_width, _this.window_height, _this.window_color);
      });
    };

    return Building;

  })(PhysicalObject);

  Explosion = (function() {

    function Explosion(objects, x, y) {
      this.objects = objects;
      this.x = x;
      this.y = y;
    }

    Explosion.prototype.splat = function() {
      var _this = this;
      return _(32).times(function() {
        var c, p, v;
        v = {
          x: rr(4, 16),
          y: rr(-32, 16)
        };
        c = Color.string(rr(128, 255), 0, 0);
        p = new Particle(_this.x, _this.y, v, 0.6, c);
        return _this.objects.push(p);
      });
    };

    Explosion.prototype.bang = function() {
      var _this = this;
      return _(32).times(function() {
        var c, p, v;
        v = {
          x: rr(-16, 16),
          y: rr(-32, 16)
        };
        c = Color.string(rr(128, 255), 0, 0);
        p = new Particle(_this.x, _this.y, v, 0.6, c);
        return _this.objects.push(p);
      });
    };

    Explosion.prototype.bullet = function() {
      var _this = this;
      return _(32).times(function() {
        var c, gray, p, v;
        v = {
          x: rr(0, 4),
          y: rr(-16, -8)
        };
        gray = rw(128, 64);
        c = Color.fader(gray, gray, gray, 1, 0.5);
        p = new Particle(_this.x + rw(0, 16), _this.y + rw(0, 16), v, 0.05, c);
        return _this.objects.push(p);
      });
    };

    return Explosion;

  })();

  Particle = (function(_super) {

    __extends(Particle, _super);

    Particle.prototype.particle = true;

    Particle.prototype.gravity = true;

    function Particle(x, y, velocity, weight, color) {
      this.x = x;
      this.y = y;
      this.velocity = velocity;
      this.weight = weight;
      this.color = color;
      this.expiry = Date.now() + 1000;
    }

    Particle.prototype.width = 8;

    Particle.prototype.height = 8;

    Particle.prototype.render = function(view) {
      var c;
      c = typeof this.color === "function" ? this.color() : this.color;
      return view.fillRect(this.x, this.y, this.width, this.height, c);
    };

    Particle.prototype.should_gc = function(view) {
      return Date.now() >= this.expiry;
    };

    return Particle;

  })(PhysicalObject);

  IntervalCommand = (function() {

    function IntervalCommand(view, objects) {
      this.view = view;
      this.objects = objects;
      this.keep_running = __bind(this.keep_running, this);
    }

    IntervalCommand.prototype.start = function() {
      if (this.execute_first) this.execute_first();
      this.keep_running();
      return this;
    };

    IntervalCommand.prototype.pause = function() {
      return this.paused = true;
    };

    IntervalCommand.prototype.unpause = function() {
      if (this.paused) {
        this.paused = false;
        return this.keep_running();
      }
    };

    IntervalCommand.prototype.pause_when = function(fn) {
      return this.pause_when_fn = fn;
    };

    IntervalCommand.prototype.keep_running = function() {
      if (this.paused) return;
      if (typeof this.pause_when_fn === "function" ? this.pause_when_fn() : void 0) {
        return this.pause();
      } else {
        this.execute();
        return _.delay(this.keep_running, this.delay());
      }
    };

    return IntervalCommand;

  })();

  EscapeeGenerator = (function(_super) {

    __extends(EscapeeGenerator, _super);

    function EscapeeGenerator() {
      EscapeeGenerator.__super__.constructor.apply(this, arguments);
    }

    EscapeeGenerator.prototype.delay = function() {
      return rw(500, 300);
    };

    EscapeeGenerator.prototype.execute = function() {
      return objects.unshift(new Escapee(this.view.x, rr(0, this.view.height / 4)));
    };

    return EscapeeGenerator;

  })(IntervalCommand);

  BuildingGenerator = (function(_super) {

    __extends(BuildingGenerator, _super);

    function BuildingGenerator() {
      BuildingGenerator.__super__.constructor.apply(this, arguments);
    }

    BuildingGenerator.prototype.delay = function() {
      return 500;
    };

    BuildingGenerator.prototype.execute_first = function() {
      return this.objects.unshift(this.latest = new Building(0, view.height / 2, view.width / 2, this.view.height));
    };

    BuildingGenerator.prototype.execute = function() {
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
      return rr(200, 400);
    };

    BuildingGenerator.prototype.x = function() {
      return this.latest.right_x() + this.gap();
    };

    BuildingGenerator.prototype.y = function() {
      var quarter, r, tenth;
      r = rr(this.latest.y - 64, this.latest.y + 64);
      quarter = this.view.height / 4;
      tenth = this.view.height / 10;
      return this.bounded(r, quarter, this.view.height - tenth);
    };

    BuildingGenerator.prototype.bounded = function(i, min, max) {
      return _.max([_.min([i, max]), min]);
    };

    return BuildingGenerator;

  })(IntervalCommand);

  GarbageCollector = (function(_super) {

    __extends(GarbageCollector, _super);

    function GarbageCollector() {
      GarbageCollector.__super__.constructor.apply(this, arguments);
    }

    GarbageCollector.prototype.delay = function() {
      return 100;
    };

    GarbageCollector.prototype.execute = function() {
      var _this = this;
      return _.chain(this.objects).map(function(o, i) {
        if (o.should_gc && o.should_gc(_this.view)) return i;
      }).filter(function(i) {
        return i != null;
      }).reverse().each(function(i) {
        return _this.objects.splice(i, 1);
      });
    };

    return GarbageCollector;

  })(IntervalCommand);

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
      this.canvas.style.cursor = "none";
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

    Viewport.prototype.view_to_world = function(x, y) {
      return {
        x: x + this.x,
        y: y + this.y
      };
    };

    Viewport.prototype.world_to_view = function(x, y) {
      return {
        x: x - this.x,
        y: y - this.y
      };
    };

    Viewport.prototype.clear = function() {
      return this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };

    Viewport.prototype.fillRect = function(x, y, width, height, fillStyle) {
      var base;
      base = this.world_to_view(x, y);
      this.context.fillStyle = fillStyle;
      return this.context.fillRect(base.x, base.y, width, height);
    };

    return Viewport;

  })();

  Animator = (function() {

    function Animator(ticker, interval_commands) {
      var _this = this;
      this.ticker = ticker;
      this.interval_commands = interval_commands;
      this.keep_animating = __bind(this.keep_animating, this);
      _(this.interval_commands).each(function(c) {
        return c.pause_when(function() {
          return _this.seconds_elapsed(Date.now()) > _this.pause_threshold * 2;
        });
      });
    }

    Animator.prototype.start = function() {
      this.time_previous = Date.now();
      _(this.interval_commands).each(function(c) {
        return c.start();
      });
      return this.keep_animating();
    };

    Animator.prototype.keep_animating = function() {
      var now, seconds_elapsed;
      seconds_elapsed = this.seconds_elapsed(now = Date.now());
      this.time_previous = now;
      if (seconds_elapsed > this.pause_threshold) {
        _(this.interval_commands).each(function(ic) {
          return ic.unpause();
        });
      } else {
        this.ticker(seconds_elapsed);
      }
      return webkitRequestAnimationFrame(this.keep_animating);
    };

    Animator.prototype.pause_threshold = 0.2;

    Animator.prototype.seconds_elapsed = function(now) {
      return (now - this.time_previous) / 1000;
    };

    return Animator;

  })();

  rr = function(from, to) {
    return from + Math.floor(Math.random() * (to - from));
  };

  rw = function(mid, radius) {
    return rr(mid - radius, mid + radius);
  };

  platform_x_intersecting = function(o, objects) {
    return _(objects).detect(function(other) {
      return other.platform && other.x_intersecting(o);
    });
  };

  splat_detection = function(o, objects) {
    var platform;
    if (o.dead) return;
    platform = platform_x_intersecting(o, objects);
    if (platform && platform.intersecting(o)) return o.splat(objects);
  };

  platform_detection = function(o, objects) {
    var distance_to_edge, platform;
    if (o.dead) return;
    platform = platform_x_intersecting(o, objects);
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

  objects.push(crosshair = new Crosshair(view));

  interval_commands = [new EscapeeGenerator(view, objects), new BuildingGenerator(view, objects), new GarbageCollector(view, objects)];

  ticker = function(seconds_elapsed) {
    var i, o, _len, _results;
    view.clear();
    Physics.apply_velocity(view, seconds_elapsed);
    _results = [];
    for (i = 0, _len = objects.length; i < _len; i++) {
      o = objects[i];
      if (o.velocity) Physics.apply_x_velocity(o, seconds_elapsed);
      if (o.platformable) splat_detection(o, objects);
      if (o.gravity) Physics.apply_gravity(o, seconds_elapsed);
      if (o.velocity) Physics.apply_y_velocity(o, seconds_elapsed);
      if (o.platformable) platform_detection(o, objects);
      if (o.render) {
        _results.push(o.render(view));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  animator = new Animator(ticker, interval_commands);

  shootables_hit = function(objects, bullet) {
    return _(objects).select(function(o) {
      return o.shootable && (o.intersecting(bullet) || bullet.intersecting(o));
    });
  };

  click_listener = function(event) {
    var bullet, point, shootables;
    point = view.view_to_world(event.offsetX, event.offsetY);
    new Explosion(objects, point.x, point.y).bullet();
    bullet = new Bullet(point.x, point.y);
    shootables = shootables_hit(objects, bullet);
    return _(shootables).each(function(o) {
      return o.bang(objects);
    });
  };

  mouse_move_listener = function(event) {
    var point;
    point = {
      x: event.offsetX,
      y: event.offsetY
    };
    return crosshair.aim(point);
  };

  view.canvas.addEventListener("click", click_listener);

  view.canvas.addEventListener("mousemove", mouse_move_listener);

  animator.start();

}).call(this);
