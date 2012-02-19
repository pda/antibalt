canvas = document.getElementById("antibalt")

canvas.width = 800
canvas.height = 600
canvas.style.backgroundColor = "black"

context = canvas.getContext("2d")

rgb = (r, g, b) -> (new Color(r, g, b)).toString()

Physics =
  G: 9.80665
  apply_gravity: (o) ->
    o.velocity.y += (Physics.G / 32)
  apply_velocity: (o) ->
    o.x += o.velocity.x
    o.y += o.velocity.y

class Color
  constructor: (@r, @g, @b) ->
  toString: -> "rgb(#{@r},#{@g},#{@b})"

class Escapee
  WIDTH = 8
  HEIGHT = 16
  constructor: (@x, @y) ->
    @color = rgb(64, 64, 255)
    @velocity = { x: 0, y: 0 }
  render: (context) ->
    context.fillStyle = @color
    context.fillRect(@x, @y, WIDTH, HEIGHT)

escapee = new Escapee(100, 100)

render = ->
  context.clearRect(0, 0, canvas.width, canvas.height)
  escapee.render(context)

animation_loop = ->
  Physics.apply_gravity(escapee)
  Physics.apply_velocity(escapee)
  render()
  webkitRequestAnimationFrame(animation_loop)

animation_loop()
