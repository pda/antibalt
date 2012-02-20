(function() {
  var Building, Color, Escapee, Physics, animation_loop, building_previous, building_stream, canvas, context, escapee_stream, objects, rgb, rr, rw, time_previous;

  canvas = document.getElementById("antibalt");

  canvas.width = 800;

  canvas.height = 600;

  canvas.style.backgroundColor = "black";

  context = canvas.getContext("2d");

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
        x: 16,
        y: 0
      };
    }

    Escapee.prototype.render = function(context) {
      context.fillStyle = this.color;
      return context.fillRect(this.x, this.y, WIDTH, HEIGHT);
    };

    return Escapee;

  })();

  Building = (function() {

    function Building(x, y, width) {
      this.x = x;
      this.y = y;
      this.width = width;
    }

    Building.prototype.render = function(context) {
      context.fillStyle = rgb(32, 32, 32);
      return context.fillRect(this.x, this.y, this.width, canvas.height - this.y);
    };

    return Building;

  })();

  objects = [];

  (escapee_stream = function() {
    objects.push(new Escapee(0, rr(0, canvas.height / 2)));
    return setTimeout(escapee_stream, rw(500, 300));
  })();

  objects.push(building_previous = new Building(0, canvas.height / 2, canvas.width / 2));

  (building_stream = function() {
    var gap, x, y;
    gap = 100;
    x = building_previous.x + building_previous.width + gap;
    y = rw(building_previous.y, 100);
    objects.push(building_previous = new Building(x, y, canvas.width / 4));
    return setTimeout(building_stream, 1000);
  })();

  time_previous = Date.now();

  animation_loop = function() {
    var o, seconds_elapsed, time_now, _i, _len;
    time_now = Date.now();
    seconds_elapsed = (time_now - time_previous) / 1000;
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (_i = 0, _len = objects.length; _i < _len; _i++) {
      o = objects[_i];
      if (o.gravity) Physics.apply_gravity(o, seconds_elapsed);
      if (o.velocity) Physics.apply_velocity(o, seconds_elapsed);
      o.render(context);
    }
    webkitRequestAnimationFrame(animation_loop);
    return time_previous = time_now;
  };

  animation_loop();

}).call(this);
