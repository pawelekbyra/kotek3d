export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }) }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // Czarne tło
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000)

    // Logo / tytuł gry
    const title = this.add.text(W / 2, H / 2 - 40, 'CIEŃ MIASTA', {
      fontSize: '72px',
      fontFamily: 'Georgia, serif',
      color: '#f0f0f0',
      letterSpacing: 12,
    }).setOrigin(0.5).setAlpha(0)

    const subtitle = this.add.text(W / 2, H / 2 + 50, 'PRZYGODA NOIR', {
      fontSize: '22px',
      fontFamily: 'Georgia, serif',
      color: '#cc2200',
      letterSpacing: 8,
    }).setOrigin(0.5).setAlpha(0)

    const hint = this.add.text(W / 2, H - 60, 'KLIKNIJ ABY ZACZĄĆ', {
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      color: '#555555',
      letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0)

    // Linia dekoracyjna
    const line = this.add.graphics()
    line.lineStyle(2, 0xcc2200, 0)
    line.beginPath()
    line.moveTo(W / 2 - 200, H / 2 + 20)
    line.lineTo(W / 2 + 200, H / 2 + 20)
    line.strokePath()

    this.tweens.add({ targets: title, alpha: 1, duration: 1500, ease: 'Power2' })
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 1500, delay: 600, ease: 'Power2' })
    this.tweens.add({ targets: hint, alpha: 1, duration: 1000, delay: 1800, ease: 'Power2' })
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 800, delay: 2800, yoyo: true, repeat: -1 })

    // Animuj linię
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 1200,
      delay: 400,
      onUpdate: (t) => {
        const v = t.getValue() as number
        line.clear()
        line.lineStyle(2, 0xcc2200, v)
        line.beginPath()
        line.moveTo(W / 2 - 200 * v, H / 2 + 20)
        line.lineTo(W / 2 + 200 * v, H / 2 + 20)
        line.strokePath()
      },
    })

    this.input.once('pointerdown', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0)
      this.time.delayedCall(500, () => this.scene.start('IntroScene'))
    })
  }
}
