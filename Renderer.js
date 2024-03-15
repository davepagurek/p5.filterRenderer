class Renderer {
  constructor(target = window, options = {}) {
    this.target = target
    this.fbo = target.createFramebuffer(options)
    this.shader = target.createShader(this.vert(), this.frag())
  }

  vert() {
    throw new Error('Unimplemented')
  }

  frag() {
    throw new Error('Unimplemented')
  }

  getUniforms() {
    return {}
  }

  draw(cb) {
    this.fbo.draw(() => {
      this.target.push()
      cb()
      this.target.pop()
    })

    const uniforms = this.getUniforms()

    this.target.push()
    this.target.noStroke()
    this.target.shader(this.shader)
    for (const key in uniforms) {
      this.shader.setUniform(key, uniforms[key])
    }
    this.target.plane(this.target.width, this.target.height)
    this.target.pop()
  }

  remove() {
    this.fbo.remove()
  }
}
