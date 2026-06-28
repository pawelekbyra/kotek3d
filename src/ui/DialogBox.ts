import { NOIR } from '../objects/NoirArt'

export interface DialogLine {
  speaker: string
  text: string
  color?: number
}

export class DialogBox {
  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private bg: Phaser.GameObjects.Graphics
  private speakerText: Phaser.GameObjects.Text
  private bodyText: Phaser.GameObjects.Text
  private continueHint: Phaser.GameObjects.Text
  private lines: DialogLine[]
  private currentIndex: number = 0
  private onComplete?: () => void
  private typewriterTimer?: Phaser.Time.TimerEvent
  private fullText: string = ''
  private displayedChars: number = 0
  private isTyping: boolean = false
  private cornerDecor: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.container = scene.add.container(0, 0)
    this.container.setDepth(100)

    const W = scene.scale.width
    const H = scene.scale.height
    const boxH = 180
    const boxY = H - boxH - 20
    const boxX = 20
    const boxW = W - 40

    // Tło dialogu — styl komiksu
    this.bg = scene.add.graphics()
    this.bg.fillStyle(NOIR.BLACK, 0.93)
    this.bg.fillRect(boxX, boxY, boxW, boxH)
    // Biała ramka
    this.bg.lineStyle(3, NOIR.WHITE, 0.9)
    this.bg.strokeRect(boxX, boxY, boxW, boxH)
    // Czerwona linia akcentu
    this.bg.lineStyle(3, NOIR.RED, 0.8)
    this.bg.strokeRect(boxX + 5, boxY + 5, boxW - 10, boxH - 10)

    // Ozdobniki rogu (kreski komiksowe)
    this.cornerDecor = scene.add.graphics()
    this.drawCorners(this.cornerDecor, boxX, boxY, boxW, boxH)

    // Tekst mówcy
    this.speakerText = scene.add.text(boxX + 22, boxY + 16, '', {
      fontSize: '15px',
      fontFamily: 'Georgia, serif',
      color: '#cc2200',
      letterSpacing: 4,
      fontStyle: 'bold',
    })

    // Linia pod mówcą
    const speakerLine = scene.add.graphics()
    speakerLine.lineStyle(1, NOIR.RED, 0.6)
    speakerLine.beginPath()
    speakerLine.moveTo(boxX + 18, boxY + 38)
    speakerLine.lineTo(boxX + boxW - 18, boxY + 38)
    speakerLine.strokePath()

    // Treść dialogu
    this.bodyText = scene.add.text(boxX + 22, boxY + 46, '', {
      fontSize: '17px',
      fontFamily: 'Georgia, serif',
      color: '#f0f0f0',
      wordWrap: { width: boxW - 44 },
      lineSpacing: 6,
    })

    // Wskazówka kontynuacji
    this.continueHint = scene.add.text(boxX + boxW - 30, boxY + boxH - 28, '▶', {
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      color: '#cc2200',
    })
    scene.tweens.add({
      targets: this.continueHint,
      alpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
    })

    this.container.add([
      this.bg, this.cornerDecor, speakerLine,
      this.speakerText, this.bodyText, this.continueHint,
    ])
    this.container.setVisible(false)

    scene.input.on('pointerdown', () => this.advance())
    scene.input.keyboard?.on('keydown-SPACE', () => this.advance())
    scene.input.keyboard?.on('keydown-ENTER', () => this.advance())

    this.lines = []
  }

  private drawCorners(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
    const len = 18
    g.lineStyle(3, NOIR.WHITE, 0.5)
    // Góra-lewo
    g.beginPath(); g.moveTo(x - 3, y + len + 6); g.lineTo(x - 3, y - 3); g.lineTo(x + len + 6, y - 3); g.strokePath()
    // Góra-prawo
    g.beginPath(); g.moveTo(x + w - len - 6, y - 3); g.lineTo(x + w + 3, y - 3); g.lineTo(x + w + 3, y + len + 6); g.strokePath()
    // Dół-lewo
    g.beginPath(); g.moveTo(x - 3, y + h - len - 6); g.lineTo(x - 3, y + h + 3); g.lineTo(x + len + 6, y + h + 3); g.strokePath()
    // Dół-prawo
    g.beginPath(); g.moveTo(x + w - len - 6, y + h + 3); g.lineTo(x + w + 3, y + h + 3); g.lineTo(x + w + 3, y + h - len - 6); g.strokePath()
  }

  show(lines: DialogLine[], onComplete?: () => void) {
    this.lines = lines
    this.currentIndex = 0
    this.onComplete = onComplete
    this.container.setVisible(true)
    this.displayLine(this.lines[0])
  }

  private displayLine(line: DialogLine) {
    this.speakerText.setText(line.speaker.toUpperCase())
    this.speakerText.setColor(line.color ? `#${line.color.toString(16).padStart(6, '0')}` : '#cc2200')
    this.fullText = line.text
    this.displayedChars = 0
    this.bodyText.setText('')
    this.continueHint.setVisible(false)
    this.isTyping = true

    this.typewriterTimer = this.scene.time.addEvent({
      delay: 28,
      repeat: this.fullText.length - 1,
      callback: () => {
        this.displayedChars++
        this.bodyText.setText(this.fullText.substring(0, this.displayedChars))
        if (this.displayedChars >= this.fullText.length) {
          this.isTyping = false
          this.continueHint.setVisible(true)
        }
      },
    })
  }

  private advance() {
    if (!this.container.visible) return

    if (this.isTyping) {
      this.typewriterTimer?.remove()
      this.bodyText.setText(this.fullText)
      this.isTyping = false
      this.continueHint.setVisible(true)
      return
    }

    this.currentIndex++
    if (this.currentIndex < this.lines.length) {
      this.displayLine(this.lines[this.currentIndex])
    } else {
      this.container.setVisible(false)
      this.onComplete?.()
    }
  }

  hide() {
    this.container.setVisible(false)
    this.typewriterTimer?.remove()
  }
}
