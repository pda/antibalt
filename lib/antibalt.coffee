canvas = document.getElementById("antibalt")

canvas.width = 800
canvas.height = 600
canvas.style.backgroundColor = "black"

context = canvas.getContext("2d")

# RGB color string, e.g. "rgb(128,128,255)"
rgb = (r, g, b) -> (new Color(r, g, b)).toString()

# random ranged
rr = (from, to) -> from + Math.floor(Math.random() * (to - from))

# random within
rw = (mid, radius) -> rr(mid - radius, mid + radius)

Physics =
  GRAVITY: 9.80665 # acceleration: m/s^2
  PPM: 16 # pixels per meter
  apply_gravity: (o, sec) ->
    o.velocity.y += Physics.GRAVITY * sec * Physics.PPM
  apply_velocity: (o, sec) ->
    o.x += o.velocity.x * sec * Physics.PPM
    o.y += o.velocity.y * sec * Physics.PPM

class Color
  constructor: (@r, @g, @b) ->
  toString: -> "rgb(#{@r},#{@g},#{@b})"

class Escapee
  [ WIDTH, HEIGHT ] = [ 8, 16 ]
  gravity: true
  constructor: (@x, @y) ->
    @color = rgb(64, 64, 255)
    @velocity = { x: 0, y: 0 }
  render: (context) ->
    context.fillStyle = @color
    context.fillRect(@x, @y, WIDTH, HEIGHT)

objects = []

objects.push new Escapee(100, 100)


time_previous = Date.now() # milliseconds

animation_loop = ->
  time_now = Date.now()
  seconds_elapsed = (time_now - time_previous) / 1000
  context.clearRect(0, 0, canvas.width, canvas.height)
  for o in objects
    Physics.apply_gravity(o, seconds_elapsed) if o.gravity
    Physics.apply_velocity(o, seconds_elapsed) if o.velocity
    o.render(context)
  webkitRequestAnimationFrame(animation_loop)
  time_previous = time_now

animation_loop()
