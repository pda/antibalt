(function() {
  var Color, Escapee, Physics, animation_loop, canvas, context, escapee, render, rgb, rr, rw, time_previous;

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

    function Escapee(x, y) {
      this.x = x;
      this.y = y;
      this.color = rgb(64, 64, 255);
      this.velocity = {
        x: 0,
        y: 0
      };
    }

    Escapee.prototype.render = function(context) {
      context.fillStyle = this.color;
      return context.fillRect(this.x, this.y, WIDTH, HEIGHT);
    };

    return Escapee;

  })();

  escapee = new Escapee(100, 100);

  time_previous = Date.now();

  render = function() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    return escapee.render(context);
  };

  animation_loop = function() {
    var seconds_elapsed, time_now;
    time_now = Date.now();
    seconds_elapsed = (time_now - time_previous) / 1000;
    Physics.apply_gravity(escapee, seconds_elapsed);
    Physics.apply_velocity(escapee, seconds_elapsed);
    render();
    webkitRequestAnimationFrame(animation_loop);
    return time_previous = time_now;
  };

  animation_loop();

}).call(this);
