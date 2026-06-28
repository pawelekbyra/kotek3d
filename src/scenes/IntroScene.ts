import { Rain } from '../objects/Rain'

const INTRO_PANELS = [
  {
    text: 'Miasto nigdy nie śpi.',
    subtext: 'A ja razem z nim.',
  },
  {
    text: 'Rok 1947. Jesień.',
    subtext: 'Deszcz pada już trzeci tydzień z rzędu.',
  },
  {
    text: 'Nazywam się Marek Lis.\nDetektyw prywatny.',
    subtext: 'Przyjmuję każdą sprawę. Prawie każdą.',
  },
  {
    text: 'Tamtej nocy ktoś zapukał\ndo moich drzwi.',
    subtext: '',
  },
]

export class IntroScene extends Phaser.Scene {
  private rain!: Rain
  private panelIndex = 0
  private panelContainer!: Phaser.GameObjects.Container
  private canAdvance = false

  constructor() { super({ key: 'IntroScene' }) }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // Tło
    const bg = this.add.graphics()
    bg.fillStyle(0x050505)
    bg.fillRect(0, 0, W, H)

    // Deszcz na intro
    this.rain = new Rain(this, 80)

    this.panelContainer = this.add.container(0, 0)
    this.panelContainer.setDepth(10)

    this.showPanel(0)

    this.input.on('pointerdown', () => this.nextPanel())
    this.input.keyboard?.on('keydown-SPACE', () => this.nextPanel())
    this.input.keyboard?.on('keydown-ENTER', () => this.nextPanel())
  }

  private showPanel(index: number) {
    const W = this.scale.width
    const H = this.scale.height
    const panel = INTRO_PANELS[index]

    this.panelContainer.removeAll(true)
    this.canAdvance = false

    // Ramka komiksowa
    const frame = this.add.graphics()
    const margin = 80
    frame.fillStyle(0x0a0a0a, 0.95)
    frame.fillRect(margin, margin, W - margin * 2, H - margin * 2)
    frame.lineStyle(4, 0xf0f0f0, 0.9)
    frame.strokeRect(margin, margin, W - margin * 2, H - margin * 2)
    frame.lineStyle(2, 0xcc2200, 0.7)
    frame.strokeRect(margin + 6, margin + 6, W - margin * 2 - 12, H - margin * 2 - 12)

    // Numer panelu
    const numText = this.add.text(margin + 16, margin + 14, `${index + 1}/${INTRO_PANELS.length}`, {
      fontSize: '13px',
      fontFamily: 'Georgia, serif',
      color: '#cc2200',
    }).setAlpha(0.7)

    // Linia pozioma przerywana — styl komiksu
    const dashes = this.add.graphics()
    dashes.lineStyle(1, 0x333333, 0.5)
    for (let x = margin + 20; x < W - margin - 20; x += 16) {
      dashes.beginPath()
      dashes.moveTo(x, H / 2)
      dashes.lineTo(x + 10, H / 2)
      dashes.strokePath()
    }

    // Główny tekst
    const mainText = this.add.text(W / 2, H / 2 - 60, panel.text, {
      fontSize: '36px',
      fontFamily: 'Georgia, serif',
      color: '#f0f0f0',
      align: 'center',
      lineSpacing: 12,
    }).setOrigin(0.5).setAlpha(0)

    // Podtekst (kursywa, szary)
    const subText = panel.subtext ? this.add.text(W / 2, H / 2 + 60, panel.subtext, {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#888888',
      fontStyle: 'italic',
      align: 'center',
    }).setOrigin(0.5).setAlpha(0) : null

    // Wskazówka
    const hint = this.add.text(W - margin - 20, H - margin - 20, '▶ dalej', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#555555',
    }).setOrigin(1, 1).setAlpha(0 as number)

    this.panelContainer.add([frame, numText, dashes, mainText])
    if (subText) this.panelContainer.add(subText)
    this.panelContainer.add(hint)

    // Fade in
    this.tweens.add({ targets: mainText, alpha: 1, duration: 800, ease: 'Power2' })
    if (subText) this.tweens.add({ targets: subText, alpha: 1, duration: 800, delay: 400, ease: 'Power2' })
    this.tweens.add({
      targets: hint, alpha: 1, duration: 600, delay: 900, ease: 'Power2',
      onComplete: () => {
        this.canAdvance = true
        this.tweens.add({ targets: hint, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 })
      }
    })
  }

  private nextPanel() {
    if (!this.canAdvance) return

    this.panelIndex++
    if (this.panelIndex < INTRO_PANELS.length) {
      // Przejście jak przewracanie strony
      this.tweens.add({
        targets: this.panelContainer,
        x: -80,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          this.panelContainer.x = 80
          this.showPanel(this.panelIndex)
          this.tweens.add({ targets: this.panelContainer, x: 0, alpha: 1, duration: 300, ease: 'Power2' })
        }
      })
    } else {
      this.cameras.main.fadeOut(600, 0, 0, 0)
      this.time.delayedCall(600, () => {
        this.rain.destroy()
        this.scene.start('OfficeScene')
      })
    }
  }

  update() {
    this.rain.update()
  }
}
