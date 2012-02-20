(function() {
  var Building, Color, Escapee, Physics, Viewport, animation_loop, building_previous, building_stream, canvas, escapee_stream, objects, rgb, rr, rw, time_previous, view;

  canvas = document.getElementById("antibalt");

  canvas.width = 800;

  canvas.height = 600;

  canvas.style.backgroundColor = "black";

  rgb = function(r, g, b) {
    return (new Color(r, g, b)).toString();
  };

  rr = function(from, to) {
    return from + Math.floor(Math.random() * (to - from));
  };

  rw = function(mid, radius) {
    return rr(mid - radius, mid + radius);
  };

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

    function Color(r, g, b) {
      this.r = r;
      this.g = g;
      this.b = b;
    }

    Color.prototype.toString = function() {
      return "rgb(" + this.r + "," + this.g + "," + this.b + ")";
    };

    return Color;

  })();

  Escapee = (function() {
    var HEIGHT, WIDTH, _ref;

    _ref = [8, 16], WIDTH = _ref[0], HEIGHT = _ref[1];

    Escapee.prototype.gravity = true;

    function Escapee(x, y) {
      this.x = x;
      this.y = y;
      this.color = rgb(64, 64, 255);
      this.velocity = {
        x: 32,
        y: 0
      };
    }

    Escapee.prototype.render = function(view) {
      return view.fillRect(this.x, this.y, WIDTH, HEIGHT, this.color);
    };

    return Escapee;

  })();

  Building = (function() {

    function Building(x, y, width) {
      this.x = x;
      this.y = y;
      this.width = width;
    }

    Building.prototype.render = function(view) {
      return view.fillRect(this.x, this.y, this.width, canvas.height - this.y, rgb(32, 32, 32));
    };

    return Building;

  })();

  Viewport = (function() {

    function Viewport(canvas) {
      var _ref, _ref2;
      this.canvas = canvas;
      this.context = this.canvas.getContext("2d");
      _ref = [this.canvas.width, this.canvas.height], this.width = _ref[0], this.height = _ref[1];
      _ref2 = [0, 0], this.x = _ref2[0], this.y = _ref2[1];
      this.velocity = {
        x: 8,
        y: 0
      };
    }

    Viewport.prototype.clear = function() {
      return this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };

    Viewport.prototype.fillRect = function(x, y, width, height, fillStyle) {
      this.context.fillStyle = fillStyle;
      return this.context.fillRect(x - this.x, y - this.y, width, height);
    };

    return Viewport;

  })();

  view = new Viewport(canvas);

  objects = [];

  (escapee_stream = function() {
    objects.push(new Escapee(view.x, rr(0, view.height / 2)));
    return setTimeout(escapee_stream, rw(500, 300));
  })();

  objects.push(building_previous = new Building(0, view.height / 2, view.width / 2));

  (building_stream = function() {
    var gap, x, y;
    gap = rr(10, 100);
    x = building_previous.x + building_previous.width + gap;
    y = rr(building_previous.y - 32, building_previous.y + 128);
    objects.push(building_previous = new Building(x, y, rr(100, view.width / 2)));
    return setTimeout(building_stream, 1000);
  })();

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
      if (o.velocity) Physics.apply_velocity(o, seconds_elapsed);
      if (o.render) o.render(view);
    }
    webkitRequestAnimationFrame(animation_loop);
    return time_previous = time_now;
  };

  animation_loop();

}).call(this);
