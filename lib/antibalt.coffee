##
# Classes

Physics =
  GRAVITY: 9.80665 # acceleration: m/s^2
  PPM: 16 # pixels per meter
  apply_gravity: (o, sec) ->
    o.velocity.y += Physics.GRAVITY * sec * o.weight * Physics.PPM
  apply_velocity: (o, sec) ->
    @apply_x_velocity(o, sec)
    @apply_y_velocity(o, sec)
  apply_x_velocity: (o, sec) ->
    o.x += o.velocity.x * sec * Physics.PPM
  apply_y_velocity: (o, sec) ->
    o.y += o.velocity.y * sec * Physics.PPM

class Color
  constructor: (@r, @g, @b, @a = 1.0) ->
  toString: -> "rgba(#{@r},#{@g},#{@b},#{@a})"
  @string: (r, g, b, a) -> new Color(r, g, b, a).toString()
  @black: (a) -> Color.string(0, 0, 0, a)
  @white: (a) -> Color.string(255, 255, 255, a)
  @gray: (v, a) -> Color.string(v, v, v, a)

class PhysicalObject
  right_x: -> @x + @width
  bottom_y: -> @y + @height
  set_bottom_y: (y) -> @y = y - @height
  x_intersecting: (other) ->
    @x < other.right_x() && @right_x() > other.x
  y_intersecting: (other) ->
    @y < other.bottom_y() && @bottom_y() > other.y
  intersecting: (other) ->
    @x_intersecting(other) && @y_intersecting(other)
  weight: 1

class Escapee extends PhysicalObject
  gravity: true
  platformable: true
  constructor: (@x, @y) ->
    @color = Color.string(64, 64, rr(192, 255))
    @velocity = { x: rw(32, 8), y: 0 }
    [ @width, @height ] = [ 16, 32 ]
  should_gc: (view) -> @x > view.right_x() || @y > view.height
  render: (view) ->
    view.fillRect(@x, @y, @width, @height, @color)
  jump: ->
    @gravity = true
    @velocity.y = rr(-48, -24)
  splat: (objects) ->
    @dead = true
    @gravity = true
    @weight = 0.4
    @velocity = { x: 0, y: 0 }
    new Explosion(objects, @x, @y).bang()
  walk_on_platform: (p) ->
    @gravity = false
    @velocity.y = 0
    @set_bottom_y(p.y)
  fall: ->
    @gravity = true

class Building extends PhysicalObject
  platform: true
  constructor: (@x, @y, @width, view_height) ->
    @color = Color.gray rr 64, 128
    @height = view_height - @y
  should_gc: (view) -> @right_x() < view.x
  render: (view) ->
    view.fillRect(@x, @y, @width, view.height - @y, @color)

class Explosion
  constructor: (@objects, @x, @y) ->
  bang: ->
    _(32).times =>
      v = { x: rr(4, 16), y: rr(-32, 16) }
      c = Color.string(rr(196,255), 0, 0)
      p = new Particle(@x, @y, 8, 8, v, 0.6, c)
      @objects.push p

class Particle extends PhysicalObject
  particle: true
  gravity: true
  constructor: (@x, @y, @width, @height, @velocity, @weight, @color) ->
    @expiry = Date.now() + 1000 # evil global
  render: (view) -> view.fillRect(@x, @y, @width, @height, @color)
  should_gc: (view) -> Date.now() >= @expiry

class AbstractGenerator
  constructor: (@view, @objects) ->
  start: ->
    @generate_first() if @generate_first
    @keep_generating()
  keep_generating: =>
    @generate()
    _.delay @keep_generating, @delay()

class EscapeeGenerator extends AbstractGenerator
  delay: -> rw(500, 300)
  generate: -> objects.unshift new Escapee(@view.x, rr(0, @view.height / 2))

class BuildingGenerator extends AbstractGenerator
  delay: -> 500
  generate_first: ->
    @objects.unshift @latest = new Building(0, view.height / 2, view.width / 2, @view.height)
  generate: -> @build() while @latest.right_x() < @view.right_x() + 100
  build: -> @objects.unshift @latest = new Building(@x(), @y(), @width(), @view.height)
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
      "particles: " + _(objects).filter((o) -> o.particle).length
    ]

class Viewport
  constructor: (@width, @height) ->
    @canvas = document.getElementById("antibalt")
    @canvas.width = @width
    @canvas.height = @height
    @canvas.style.backgroundColor = "black"
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

class GarbageCollector
  constructor: (@view, @objects) ->
  start: -> @keep_collecting()
  keep_collecting: =>
    try
      @collect()
    catch e
      console.log "GC caught %o", e
    _.delay @keep_collecting, 100
  collect: ->
    # buggy; indices may change between mark and sweep!
    indices = []
    for o, i in @objects
      indices.push i if o.should_gc && o.should_gc(@view)
    for i in indices
      if @objects[i].should_gc
        @objects.splice(i, 1)
      else
        throw "Illegal GC"

##
# Helper functions

# random ranged
rr = (from, to) -> from + Math.floor(Math.random() * (to - from))

# random within
rw = (mid, radius) -> rr(mid - radius, mid + radius)

##
# Random stuff to refactor

splat_detection = (o, objects) ->
  return if o.dead
  platform = _(objects).detect (other) ->
    other.platform && other.x_intersecting(o)
  if platform && platform.intersecting(o)
      o.splat(objects)

platform_detection = (o, objects) ->
  return if o.dead
  platform = _(objects).detect (other) ->
    other.platform && other.x_intersecting(o)
  if platform && o.gravity
    if o.bottom_y() >= platform.y
      o.walk_on_platform(platform)
  if platform && !o.gravity
    distance_to_edge = platform.right_x() - o.x
    if distance_to_edge >= 0 && distance_to_edge < 100
      o.jump()
  if !platform && !o.gravity
    o.fall()

view = new Viewport(1200, 600)
window.objects = []

objects.push new DebugInfo(view, objects)

new EscapeeGenerator(view, objects).start()
new BuildingGenerator(view, objects).start()
new GarbageCollector(view, objects).start()

time_previous = Date.now() # milliseconds

animation_loop = ->
  time_now = Date.now()
  seconds_elapsed = (time_now - time_previous) / 1000
  time_previous = time_now
  view.clear()
  Physics.apply_velocity(view, seconds_elapsed)
  for o, i in objects
    Physics.apply_x_velocity(o, seconds_elapsed) if o.velocity
    splat_detection(o, objects) if o.platformable
    Physics.apply_gravity(o, seconds_elapsed) if o.gravity
    Physics.apply_y_velocity(o, seconds_elapsed) if o.velocity
    platform_detection(o, objects) if o.platformable
    o.render(view) if o.render
  webkitRequestAnimationFrame(animation_loop)

##
# The game!

animation_loop()
