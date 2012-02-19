(function() {
  var Color, Escapee, animation_loop, canvas, context, escapee, render, rgb;

  canvas = document.getElementById("antibalt");

  canvas.width = 800;

  canvas.height = 600;

  canvas.style.backgroundColor = "black";

  context = canvas.getContext("2d");

  rgb = function(r, g, b) {
    return (new Color(r, g, b)).toString();
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
    var HEIGHT, WIDTH;

    WIDTH = 8;

    HEIGHT = 16;

    function Escapee(x, y) {
      this.x = x;
      this.y = y;
      this.color = rgb(64, 64, 255);
    }

    Escapee.prototype.render = function(context) {
      context.fillStyle = this.color;
      return context.fillRect(this.x, this.y, WIDTH, HEIGHT);
    };

    return Escapee;

  })();

  escapee = new Escapee(100, 100);

  render = function() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    return escapee.render(context);
  };

  animation_loop = function() {
    render();
    return webkitRequestAnimationFrame(animation_loop);
  };

  animation_loop();

}).call(this);
