canvas = document.getElementById("antibalt")

canvas.width = 800
canvas.height = 600
canvas.style.backgroundColor = "black"

context = canvas.getContext("2d")

rgb = (r, g, b) -> (new Color(r, g, b)).toString()

class Color
  constructor: (@r, @g, @b) ->
  toString: -> "rgb(#{@r},#{@g},#{@b})"

class Escapee
  WIDTH = 8
  HEIGHT = 16
  constructor: (@x, @y) ->
    @color = rgb(64, 64, 255)
  render: (context) ->
    context.fillStyle = @color
    context.fillRect(@x, @y, WIDTH, HEIGHT)

new Escapee(100, 100).render(context)
