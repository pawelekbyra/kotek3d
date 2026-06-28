export class Rain {
  private scene: Phaser.Scene
  private graphics: Phaser.GameObjects.Graphics
  private drops: Array<{ x: number; y: number; speed: number; len: number; alpha: number }>
  private active = true

  constructor(scene: Phaser.Scene, density = 120) {
    this.scene = scene
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(90)

    const W = scene.scale.width
    const H = scene.scale.height
    this.drops = Array.from({ length: density }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      speed: 8 + Math.random() * 10,
      len: 10 + Math.random() * 20,
      alpha: 0.15 + Math.random() * 0.35,
    }))
  }

  update() {
    if (!this.active) return
    const W = this.scene.scale.width
    const H = this.scene.scale.height

    this.graphics.clear()

    this.drops.forEach(d => {
      d.y += d.speed
      d.x += d.speed * 0.15

      if (d.y > H) {
        d.y = -d.len
        d.x = Math.random() * W
      }
      if (d.x > W) d.x -= W

      this.graphics.lineStyle(1, 0x8899bb, d.alpha)
      this.graphics.beginPath()
      this.graphics.moveTo(d.x, d.y)
      this.graphics.lineTo(d.x + d.len * 0.15, d.y + d.len)
      this.graphics.strokePath()
    })
  }

  setActive(v: boolean) { this.active = v; if (!v) this.graphics.clear() }
  destroy() { this.graphics.destroy() }
}
