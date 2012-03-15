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
  @black: (a) -> @string(0, 0, 0, a)
  @white: (a) -> @string(255, 255, 255, a)
  @gray: (v, a) -> @string(v, v, v, a)
  @fader: (r, g, b, seconds, initial = 1) ->
    start = Date.now()
    ->
      elapsed = (Date.now() - start) / 1000
      alpha = Math.max(0, initial - elapsed / seconds * initial)
      Color.string(r, g, b, alpha)

class PhysicalObject
  right_x: -> @x + @width
  bottom_y: -> @y + @height
  set_bottom_y: (y) -> @y = y - @height
  x_intersecting: (other) ->
    @x < other.right_x() && @right_x() > other.x
  y_intersecting: (other) ->
    @y < other.bottom_y() && @bottom_y() > other.y
  # does not currently detect if this is entirely within other
  intersecting: (other) ->
    @x_intersecting(other) && @y_intersecting(other)
  weight: 1

class Crosshair extends PhysicalObject
  constructor: (view) ->
    @aim( x: view.width / 2, y: view.height / 2 )
    bullet = new Bullet(0,0)
    [ @width, @height ] = [ bullet.width, bullet.height ]
    @color = Color.string(255, 255, 0, 0.1)
    @color_dot = Color.black()
  aim: (point) ->
    @center = point
    @x = point.x - @width / 2
    @y = point.y - @height / 2
  render: (view) ->
    view.context.fillStyle = @color
    view.context.fillRect(@x, @y, @width, @height)
    view.context.fillStyle = @color_dot
    view.context.fillRect(@center.x, @center.y, 4, 4)

class Bullet extends PhysicalObject
  constructor: (x, y) ->
    @width = @size
    @height = @size
    @x = x - @width / 2
    @y = y - @height / 2
    @created_at = Date.now() # evil global
  size: 64

class Escapee extends PhysicalObject
  gravity: true
  platformable: true
  shootable: true
  constructor: (@x, @y) ->
    @color = Color.string(64, 64, rr(192, 255))
    @velocity = { x: rw(32, 8), y: 0 }
    [ @width, @height ] = [ 16, 32 ]
  should_gc: (view) -> @x > view.right_x() || @y > view.height
  render: (view) ->
    time = Date.now()
    @drawRunning(view, time)
  drawRunning: (view, time) ->
    phase = Math.sin(time * 0.03)
    base = view.world_to_view(@x, @y)
    view.context.save()
    view.context.translate(base.x, base.y)

    # head
    view.context.save()
    view.context.fillStyle = @color
    view.context.rotate(phase * 0.2)
    view.context.fillRect(0, 0, 16, 16)
    view.context.fillStyle = Color.string(32, 32, 128)
    view.context.fillRect(12, 4, 4, 4)
    view.context.fillRect(8, 10, 8, 4)
    view.context.restore()

    # legs
    view.context.translate(4, 16)

    view.context.rotate(phase * 0.5 + 0.1)
    view.context.fillStyle = @color
    view.context.fillRect(0, 0, 8, 16)

    view.context.rotate(phase * -1)
    view.context.fillStyle = @color
    view.context.fillRect(0, 0, 8, 16)

    view.context.restore()
  jump: ->
    @gravity = true
    @velocity.y = rr(-48, -24)
  die: ->
    @dead = true
    @gravity = true
    @weight = 0.4
    @velocity = { x: 0, y: 0 }
  splat: (objects) ->
    @die()
    new Explosion(objects, @x, @y).splat()
  bang: (objects) ->
    @die()
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
    @color = Color.gray(rw(64, 16))
    @height = view_height - @y
    @calculate_windows()
  should_gc: (view) -> @right_x() < view.x
  render: (view) ->
    view.fillRect(@x, @y, @width, @height, @color)
    @draw_windows()
  calculate_windows: ->
    min_width = rw(48, 16)
    @window_height = rw(32, 8)
    @window_margin_x = mx = rr(4, 8)
    @window_margin_y = my = rr(16, 24)
    @windows_per_row = per_row = Math.floor((@width - mx) / (min_width + mx))
    @window_width = (@width - mx - (per_row * mx)) / per_row
    @window_rows = Math.ceil(@height / (@window_height + my))
    @window_color = Color.gray(16)
  nth_window_x: (col) ->
    mx = @window_margin_x
    @x + mx + (col * (mx + @window_width))
  nth_window_y: (row) ->
    my = @window_margin_y
    @y + my + (row * (my + @window_height))
  draw_windows: ->
    _(@window_rows).times (row) => @draw_window_row(row)
  draw_window_row: (row) ->
    y = @nth_window_y(row)
    _(@windows_per_row).times (n) =>
      view.fillRect(@nth_window_x(n), y, @window_width, @window_height, @window_color)

class Explosion
  constructor: (@objects, @x, @y) ->
  splat: ->
    _(32).times =>
      v = { x: rr(4, 16), y: rr(-32, 16) }
      c = Color.string(rr(128, 255), 0, 0)
      p = new Particle(@x, @y, v, 0.6, c)
      @objects.push p
  bang: ->
    _(32).times =>
      v = { x: rr(-16, 16), y: rr(-32, 16) }
      c = Color.string(rr(128, 255), 0, 0)
      p = new Particle(@x, @y, v, 0.6, c)
      @objects.push p
  bullet: ->
    _(32).times =>
      v = { x: rr(0, 4), y: rr(-16, -8) }
      gray = rw(128, 64)
      c = Color.fader(gray, gray, gray, 1, 0.5)
      p = new Particle(@x + rw(0, 16), @y + rw(0, 16), v, 0.05, c)
      @objects.push p

class Particle extends PhysicalObject
  particle: true
  gravity: true
  constructor: (@x, @y, @velocity, @weight, @color) ->
    @expiry = Date.now() + 1000 # evil global
  width: 8
  height: 8
  render: (view) ->
    c = if typeof @color == "function" then @color() else @color
    view.fillRect(@x, @y, @width, @height, c)
  should_gc: (view) -> Date.now() >= @expiry

class IntervalCommand
  constructor: (@view, @objects) ->
  start: ->
    @execute_first() if @execute_first
    @keep_running()
    this
  keep_running: =>
    @execute()
    _.delay @keep_running, @delay()

class EscapeeGenerator extends IntervalCommand
  delay: -> rw(500, 300)
  execute: -> objects.unshift new Escapee(@view.x, rr(0, @view.height / 4))

class BuildingGenerator extends IntervalCommand
  delay: -> 500
  execute_first: ->
    @objects.unshift @latest = new Building(0, view.height / 2, view.width / 2, @view.height)
  execute: -> @build() while @latest.right_x() < @view.right_x() + 100
  build: -> @objects.unshift @latest = new Building(@x(), @y(), @width(), @view.height)
  gap: -> rr 10, 100
  width: -> rr 200, 400
  x: -> @latest.right_x() + @gap()
  y: ->
    r = rr(@latest.y - 64, @latest.y + 64)
    quarter = @view.height / 4 # Space for EscapeeGenerator.
    tenth = @view.height / 10  # Minimum height.
    @bounded(r, quarter, @view.height - tenth)
  bounded: (i, min, max) -> _.max([ _.min([ i, max ]), min])

class GarbageCollector extends IntervalCommand
  delay: -> 100
  execute: ->
    _.chain(@objects).
      map((o, i) => i if o.should_gc && o.should_gc(@view)).
      filter((i) -> i?).
      reverse().
      each((i) => @objects.splice(i, 1))

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
    @canvas.style.cursor = "none"
    @context = @canvas.getContext("2d")
    [ @width, @height ] = [ @canvas.width, @canvas.height ]
    [ @x, @y ] = [ 0, 0 ]
    @velocity = { x: 16, y: 0 }
  right_x: -> @x + @width
  view_to_world: (x, y) -> { x: x + @x, y: y + @y }
  world_to_view: (x, y) -> { x: x - @x, y: y - @y }
  clear: ->
    @context.clearRect(0, 0, @canvas.width, @canvas.height)
  fillRect: (x, y, width, height, fillStyle) ->
    base = @world_to_view(x, y)
    @context.fillStyle = fillStyle
    @context.fillRect base.x, base.y, width, height

##
# Helper functions

# random ranged
rr = (from, to) -> from + Math.floor(Math.random() * (to - from))

# random within
rw = (mid, radius) -> rr(mid - radius, mid + radius)

##
# Random stuff to refactor

platform_x_intersecting = (o, objects) ->
  _(objects).detect (other) -> other.platform && other.x_intersecting(o)

splat_detection = (o, objects) ->
  return if o.dead
  platform = platform_x_intersecting(o, objects)
  if platform && platform.intersecting(o)
      o.splat(objects)

platform_detection = (o, objects) ->
  return if o.dead
  platform = platform_x_intersecting(o, objects)
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

objects.push crosshair = new Crosshair(view)

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

shootables_hit = (objects, bullet) ->
  _(objects).select (o) ->
    o.shootable && (o.intersecting(bullet) || bullet.intersecting(o))

click_listener = (event) ->
  point = view.view_to_world(event.offsetX, event.offsetY)
  new Explosion(objects, point.x, point.y).bullet()
  bullet = new Bullet(point.x, point.y)
  shootables = shootables_hit(objects, bullet)
  _(shootables).each (o) ->
    o.bang(objects)

mouse_move_listener = (event) ->
  #point = view.view_to_world(event.offsetX, event.offsetY)
  point = { x: event.offsetX, y: event.offsetY }
  crosshair.aim(point)

view.canvas.addEventListener("click", click_listener)
view.canvas.addEventListener("mousemove", mouse_move_listener)

##
# The game!

animation_loop()
