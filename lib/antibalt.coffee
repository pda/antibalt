canvas = document.getElementById("antibalt")

canvas.width = 1600
canvas.height = 600
canvas.style.backgroundColor = "black"

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
  gravity: true
  platformable: true
  constructor: (@x, @y) ->
    @color = rgb(64, 64, 255)
    @velocity = { x: rw(32, 8), y: 0 }
    [ @width, @height ] = [ 16, 32 ]
  render: (view) ->
    view.fillRect(@x, @y, @width, @height, @color)
  jump: -> @velocity.y = rr(-48, -24)

class Building
  platform: true
  constructor: (@x, @y, @width) ->
  render: (view) ->
    view.fillRect(@x, @y, @width, canvas.height - @y, rgb(32,32,32))

class Viewport
  constructor: (@canvas) ->
    @context = @canvas.getContext("2d")
    [ @width, @height ] = [ @canvas.width, @canvas.height ]
    [ @x, @y ] = [ 0, 0 ]
    @velocity = { x: 16, y: 0 }
  clear: ->
    @context.clearRect(0, 0, @canvas.width, @canvas.height)
  fillRect: (x, y, width, height, fillStyle) ->
    @context.fillStyle = fillStyle
    @context.fillRect x - @x, y - @y, width, height

apply_platformability = (o, objects) ->
  for other in objects
    continue unless other.platform
    if (o.y + o.height) >= other.y
      if o.x >= other.x && o.x <= (other.x + other.width)
        o.velocity.y = 0
        o.y = other.y - o.height
      distance_to_edge = other.x + other.width - o.x
      if distance_to_edge >= 0 && distance_to_edge < 64
        o.jump()

view = new Viewport(canvas)
objects = []

(escapee_stream = ->
  objects.push new Escapee(view.x, rr(0, view.height / 2))
  setTimeout escapee_stream, rw(500, 300)
)()

objects.push(building_previous = new Building(0, view.height / 2, view.width / 2))
(building_stream = ->
  gap = rr(10, 100)
  x = building_previous.x + building_previous.width + gap
  y = rr(building_previous.y - 64, building_previous.y + 64)
  y = view.height + 100 if y > view.height + 100
  y = 100 if y < 100
  width = rr(100, view.width / 2)
  objects.push(building_previous = new Building(x, y, width))
  setTimeout building_stream, 1000
)()

time_previous = Date.now() # milliseconds

animation_loop = ->
  time_now = Date.now()
  seconds_elapsed = (time_now - time_previous) / 1000
  view.clear()
  Physics.apply_velocity(view, seconds_elapsed)
  gc = []
  for o, i in objects
    Physics.apply_gravity(o, seconds_elapsed) if o.gravity
    Physics.apply_velocity(o, seconds_elapsed) if o.velocity
    apply_platformability o, objects if o.platformable
    o.render(view) if o.render
    gc.push(i) if o.y > view.height
  objects.splice(i, 1) for i in gc
  webkitRequestAnimationFrame(animation_loop)
  time_previous = time_now

animation_loop()
