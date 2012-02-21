canvas = document.getElementById("antibalt")

canvas.width = 1600
canvas.height = 600
canvas.style.backgroundColor = "black"

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
  constructor: (@r, @g, @b, @a = 1.0) ->
  toString: -> "rgba(#{@r},#{@g},#{@b},#{@a})"
  @string: (r, g, b, a) -> new Color(r, g, b, a).toString()
  @black: (a) -> Color.string(0, 0, 0, a)
  @white: (a) -> Color.string(255, 255, 255, a)
  @gray: (v, a) -> Color.string(v, v, v, a)

class Escapee
  gravity: true
  platformable: true
  constructor: (@x, @y) ->
    @color = Color.string(64, 64, 255)
    @velocity = { x: rw(32, 8), y: 0 }
    [ @width, @height ] = [ 16, 32 ]
  should_gc: (view) -> @x > view.right_x()
  render: (view) ->
    view.fillRect(@x, @y, @width, @height, @color)
  jump: -> @velocity.y = rr(-48, -24)

class Building
  platform: true
  constructor: (@x, @y, @width) ->
  right_x: -> @x + @width
  should_gc: (view) -> @right_x() < view.x
  render: (view) ->
    view.fillRect(@x, @y, @width, canvas.height - @y, Color.gray(64))

class EscapeeGenerator
  constructor: (@view, @objects) ->
  start: -> @keep_escaping()
  keep_escaping: =>
    objects.unshift new Escapee(@view.x, rr(0, @view.height / 2))
    _.delay @keep_escaping, rw(500, 300)

class BuildingGenerator
  constructor: (@view, @objects) ->
  start: ->
    @objects.unshift @latest = new Building(0, view.height / 2, view.width / 2)
    @keep_building()
  keep_building: =>
    @fill_screen()
    _.delay @keep_building, 500
  fill_screen: -> @build() while @latest.right_x() < @view.right_x() + 100
  build: -> @objects.unshift @latest = new Building(@x(), @y(), @width())
  gap: -> rr 10, 100
  width: -> rr 100, @view.width / 2
  x: -> @latest.right_x() + @gap()
  y: -> @bounded rr(@latest.y - 64, @latest.y + 64), 100, @view.height - 100
  bounded: (i, min, max) -> _.max([ _.min([ i, max ]), min])

class DebugInfo
  width: 200
  height: 100
  margin: 10
  padding: 10
  lineHeight: 16
  constructor: (@view, @objects) ->
    @x = @view.width - @width - @margin
    @y = @view.height - @height - @margin
  write: (view, lines) ->
    view.context.font = "12px Menlo"
    view.context.fillStyle = Color.black()
    for line, i in lines
      view.context.fillText line, @x + @padding, @y + @padding + @lineHeight + i * @lineHeight
  render: (view) ->
    view.context.fillStyle = Color.white(0.5)
    view.context.fillRect @x, @y, @width, @height
    this.write view, [
      "objects: #{objects.length}"
      "platforms: " + _(objects).filter((o) -> o.platform).length
      "gravitables: " + _(objects).filter((o) -> o.gravity).length
    ]

class Viewport
  constructor: (@canvas) ->
    @context = @canvas.getContext("2d")
    [ @width, @height ] = [ @canvas.width, @canvas.height ]
    [ @x, @y ] = [ 0, 0 ]
    @velocity = { x: 16, y: 0 }
  right_x: -> @x + @width
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

objects.push new DebugInfo(view, objects)

new EscapeeGenerator(view, objects).start()
new BuildingGenerator(view, objects).start()

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
    gc.push(i) if o.should_gc && o.should_gc(view)
  objects.splice(i, 1) for i in gc
  webkitRequestAnimationFrame(animation_loop)
  time_previous = time_now

animation_loop()
