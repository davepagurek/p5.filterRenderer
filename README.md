# p5.filterRenderer

A library for p5.js WebGL mode to draw with depth blur and shadows.

Read more about the motivation for this and how focal blur shaders work in <a href="https://www.davepagurek.com/blog/depth-of-field/">this blog post on the subject.</a>

![image](https://user-images.githubusercontent.com/5315059/172021218-b50f6693-40a6-49a1-99af-8dd9d73f00eb.png)
<small><em>Above: a screenshot from [a sketch](https://openprocessing.org/sketch/1590159) using blurring out-of-focus areas</em></small>

## Get the library

Add the library to your source code, *after* loading p5 but *before* loading your own code.

### Via CDN
```html
<script src="https://cdn.jsdelivr.net/npm/@davepagurek/p5.filterRenderer@0.0.12/p5.Framebuffer.min.js"></script>
```

On OpenProcessing, paste this link into a new library slot:
```
https://cdn.jsdelivr.net/npm/@davepagurek/p5.filterRenderer@0.0.12/p5.filterRenderer.min.js
```

### Self-hosted
[Download the minified or unminified source code from the releases tab](https://github.com/davepagurek/p5.filterRenderer/releases/), then add it to your HTML:
```html
<script type="text/javascript" src="p5.filterRenderer.min.js"></script>
```


## Usage

### Depth of field blur

The library provides a helper that bundles a Framebuffer with a shader that applies focal blur, leaving objects at a provided distance in focus and blurring things more the farther away from that  point they are.

Create a blur renderer and draw inside its `draw` callback. When you tell it to `focusHere()`, anything drawn at that transformed position will be in focus. You can use standard p5 `translate` calls to position the focal point.

#### Gaussian blur

This is likely the best-looking blur renderer, although it uses two render passes. Start by using this one, but look out the other `BlurRenderer` if it's slow.

<table>
<tr>
<td>

```js
let blurRenderer

function setup() {
  createCanvas(400, 400, WEBGL)
  blurRenderer = createGaussianBlurRenderer()
  blurRenderer.setIntensity(0.15)
  blurRenderer.setSamples(20)
  blurRenderer.setDof(50)
}

function draw() {
  blurRenderer.draw(() => {
    clear()
    push()
    background(255)
    noStroke()
    lights()

    push()
    fill('blue')
    translate(-80, -80, -300)
    blurRenderer.focusHere()
    sphere(50)
    pop()

    push()
    fill('red')
    sphere(50)
    pop()
    pop()
  })
}
```

</td>
<td>
<img src="https://user-images.githubusercontent.com/5315059/201497333-92a3f46e-91b7-4d4e-a675-f958d8d9ff50.png" width="400">
</td>
</tr>
</table>

Methods on `GaussianBlurRenderer`:
- `GaussianBlurRenderer.prototype.draw(callback: () => void)`
  - Draw the scene defined in the callback with blur
- `GaussianBlurRenderer.prototype.focusHere()`
  - Tell the renderer what point in space should be in focus. It will move based on any calls to `translate()` or other transformations that you have applied.
  - Defaults to the origin
- `GaussianBlurRenderer.prototype.setIntensity(intensity: number)`
  - Control the intensity of the blur, between 0 and 1: the lower the intensity, the farther objects have to be from the focal point to be blurred
  - Defaults to 0.1
- `GaussianBlurRenderer.prototype.setDof(dof: number)`
  - Control the depth of field (dof), which is the distance away from the focal point that is also in focus, from 0 up
  - The lower the dof, the smaller range will be that has no blur. Blur amount will start to accumulate when objects are outside of the dof range
  - The focal target (set by `focusHere`) is located in the centre of the clear range. So assume the focal target's depth value is `z`, then the clear range becomes from `z - dof / 2` to `z + dof / 2`.
  - Defaults to 0
- `GaussianBlurRenderer.prototype.setSamples(numSamples: number)`
  - Control how many random samples to use in the blur shader. More samples will look smoother but is more computationally intensive.
  - Defaults to 20

A live example: https://davepagurek.github.io/p5.Framebuffer/examples/gaussianblur


#### One-pass blur

Another implementation of blur, but using a single shader pass. This will likely produce a grainier result, but might be faster on some systems.

<table>
<tr>
<td>

```js
let blurRenderer

function setup() {
  createCanvas(400, 400, WEBGL)
  blurRenderer = createBlurRenderer()
}

function draw() {
  blurRenderer.draw(() => {
    clear()
    push()
    background(255)
    noStroke()
    lights()

    push()
    fill('blue')
    translate(-80, -80, -300)
    blurRenderer.focusHere()
    sphere(50)
    pop()

    push()
    fill('red')
    sphere(50)
    pop()
    pop()
  })
}
```

</td>
<td>
<img src="https://user-images.githubusercontent.com/5315059/178128839-164de943-960c-4e0a-ba6a-a7aa836ec798.png">
</td>
</tr>
</table>

Methods on `BlurRenderer`:
- `BlurRenderer.prototype.draw(callback: () => void)`
  - Draw the scene defined in the callback with blur
- `BlurRenderer.prototype.focusHere()`
  - Tell the renderer what point in space should be in focus. It will move based on any calls to `translate()` or other transformations that you have applied.
  - Defaults to the origin
- `BlurRenderer.prototype.setIntensity(intensity: number)`
  - Control the intensity of the blur, between 0 and 1: the lower the intensity, the farther objects have to be from the focal point to be blurred
  - Defaults to 0.05
- `BlurRenderer.prototype.setDof(dof: number)`
  - Control the depth of field (dof), which is the distance away from the focal point that is also in focus, from 0 up
  - The lower the dof, the smaller range will be that has no blur. Blur amount will start to accumulate when objects are outside of the dof range
  - The focal target (set by `focusHere`) is located in the centre of the clear range. So assume the focal target's depth value is `z`, then the clear range becomes from `z - dof / 2` to `z + dof / 2`.
  - Defaults to 0
- `BlurRenderer.prototype.setSamples(numSamples: number)`
  - Control how many random samples to use in the blur shader. More samples will look smoother but is more computationally intensive.
  - Defaults to 15

A live example: https://davepagurek.github.io/p5.Framebuffer/examples/blur

### Contact Shadows

The library provides a helper that bundles a Framebuffer with a shader that applies Ambient Occlusion shadows. This approximates the shadows one would see if there was uniform light hitting an object from all sides. In practice, it adds shadows in areas where objects get close to each other.

Create a shadow renderer and draw inside its `draw` callback. The renderer will add shadows to the result.

<table>
<tr>
<td>

```js
let contactShadowRenderer

function setup() {
  createCanvas(400, 400, WEBGL)
  contactShadowRenderer = createContactShadowRenderer()
}

function draw() {
  contactShadowRenderer.draw(() => {
    clear()
    push()
    background(255)
    fill(255)
    noStroke()
    lights()

    push()
    translate(50, -50, 10)
    sphere(50)
    pop()

    push()
    translate(-50, 50, -10)
    sphere(90)
    pop()
  })
}
```

</td>
<td>
<img src="https://user-images.githubusercontent.com/5315059/178128655-22816bcd-901d-49b5-95db-753815762805.png">
</td>
</tr>
</table>

Methods on `ContactShadowRenderer`:
- `ContactShadowRenderer.prototype.draw(callback: () => void)`
  - Draw the scene defined in the callback with shadows added
- `ContactShadowRenderer.prototype.setIntensity(intensity: number)`
  - Control how dark shadows are: 0 is no shadows, and 1 is full darkness
  - Defaults to 0.5
- `ContactShadowRenderer.prototype.setShadowSamples(numSamples: number)`
  - Control how many random samples to use in the shadow shader. More samples will be more accurate but is more computationally intensive.
  - Defaults to 15
- `ContactShadowRenderer.prototype.setBlurSamples(numSamples: number)`
  - Control how many random samples to use in the blur shader. More samples will be smoother but is more computationally intensive.
  - Defaults to 20
- `ContactShadowRenderer.prototype.setBlurRadius(radius: number)`
  - Sets how far the blur extends when blurring shadows, in pixels, ignoring the pixel density
  - Defaults to 50
- `ContactShadowRenderer.prototype.setSearchRadius(radius: number)`
  - Control how close together objects need to be for them to cast shadows
  - This is defined in *world space,* meaning all transformations are applied when checking distances
  - Defaults to 100

A live example: https://davepagurek.github.io/p5.Framebuffer/examples/shadows

## External examples

- <a href="https://openprocessing.org/sketch/1773564">Rolling Shutter</a>
  - Uses 120 framebuffers to store previous frames of video for a slit scanning effect
- <a href="https://openprocessing.org/sketch/1721124">Wizard Pondering Orb</a>
  - Uses the Gaussian blur renderer
- <a href="https://openprocessing.org/sketch/1616318">3D Text</a>
  - Uses two framebuffers to do a feedback effect
- <a href="https://openprocessing.org/sketch/1622863">Disassemble</a>
  - Uses the contact shadow renderer
- <a href="https://openprocessing.org/sketch/1590159">Train Knots</a>
  - Uses the depth buffer in a focal blur shader
- <a href="https://openprocessing.org/sketch/1460113">Modern Vampires of the City</a>
  - Uses the depth buffer to create a fog effect

More coming soon!
