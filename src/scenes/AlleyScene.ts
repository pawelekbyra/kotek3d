import { drawAlleyBackground, drawDetective, NOIR } from '../objects/NoirArt'
import { DialogBox } from '../ui/DialogBox'
import { Rain } from '../objects/Rain'

const ALLEY_DIALOGS_INTRO = [
  { speaker: 'Narrator', text: 'Zaułek przy Złotej 7. Tu podobno ostatni raz widziano Stefana Bielę — brata tajemniczej klientki.', color: NOIR.GRAY },
  { speaker: 'Marek Lis', text: 'Deszcz zaciera ślady. Muszę działać szybko.' },
]

const PUDDLE_DIALOGS = [
  { speaker: 'Narrator', text: 'W kałuży odbija się blask neonu hotelu "POLONIA". Coś w tej wodzie...', color: NOIR.GRAY },
  { speaker: 'Marek Lis', text: 'Niedopałek papierosa. Świeży — może godzina, może dwie. Ktoś tu stał i czekał.' },
  { speaker: 'Marek Lis', text: 'Taka sama marka co te w biurku Bieli. Zbieżność? Wątpię.' },
]

const NEON_DIALOGS = [
  { speaker: 'Narrator', text: 'Hotel "POLONIA". Tanie pokoje, tanie pytania, drogie odpowiedzi.', color: NOIR.GRAY },
  { speaker: 'Marek Lis', text: 'Portier w tym miejscu wszystko widzi i za odpowiednią sumę — chętnie opowiada.' },
  { speaker: 'Marek Lis', text: 'Może tu szukać informacji o Bieli...' },
  { speaker: 'Narrator', text: '[ Wejście do hotelu — do odblokowania w następnej scenie ]', color: NOIR.GRAY },
]

const STAIRS_DIALOGS = [
  { speaker: 'Narrator', text: 'Schody prowadzą na górę zaułka. W ciemności coś się porusza.', color: NOIR.GRAY },
  { speaker: 'Marek Lis', text: 'Spokojnie, Lis. To pewnie kot.' },
  { speaker: '???', text: '...', color: 0x666666 },
  { speaker: 'Marek Lis', text: 'Hm. Żaden kot.' },
  { speaker: 'Narrator', text: '[ Dalsze śledztwo — kolejne sceny w przygotowaniu ]', color: NOIR.GRAY },
]

export class AlleyScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Graphics
  private detective!: Phaser.GameObjects.Graphics
  private dialog!: DialogBox
  private rain!: Rain

  private detectiveX = 150
  private detectiveY = 540
  private targetX = 150
  private facing: 'left' | 'right' = 'right'
  private walkFrame = 0
  private isWalking = false
  private dialogActive = false

  private hotspots: Array<{ x: number; y: number; r: number; label: string; action: () => void }> = []
  private hotspotIndicators: Phaser.GameObjects.Container[] = []
  private clickIndicator?: Phaser.GameObjects.Graphics

  constructor() { super({ key: 'AlleyScene' }) }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    this.cameras.main.fadeIn(1000, 0, 0, 0)

    this.bg = this.add.graphics()
    drawAlleyBackground(this.bg, W, H)

    this.rain = new Rain(this, 150)

    this.detective = this.add.graphics()
    this.detective.setDepth(50)

    this.dialog = new DialogBox(this)

    this.setupHotspots(W, H)

    this.clickIndicator = this.add.graphics()
    this.clickIndicator.setDepth(60)

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.dialogActive) return
      const clicked = this.hotspots.find(h => {
        const dx = ptr.x - h.x; const dy = ptr.y - h.y
        return Math.sqrt(dx * dx + dy * dy) < h.r
      })
      if (clicked) {
        this.walkTo(clicked.x, clicked.action)
      } else if (ptr.y > H * 0.5 && ptr.y < H - 180) {
        this.walkTo(ptr.x)
        this.showClickIndicator(ptr.x, ptr.y)
      }
    })

    // Intro dialog
    this.time.delayedCall(1000, () => {
      this.dialogActive = true
      this.dialog.show(ALLEY_DIALOGS_INTRO, () => {
        this.dialogActive = false
        this.showHotspotIndicators()
      })
    })

    // Efekt mgły na dole ekranu
    this.addFogEffect(W, H)
  }

  private addFogEffect(W: number, H: number) {
    for (let i = 0; i < 5; i++) {
      const fog = this.add.graphics()
      fog.setDepth(85 + i)
      const fogY = H - 60 - i * 20

      fog.fillStyle(0x111122, 0.08)
      fog.fillEllipse(W / 2 + Math.sin(i * 1.3) * 100, fogY, W * 1.4, 60)

      this.tweens.add({
        targets: fog,
        x: Math.sin(i) * 30,
        duration: 3000 + i * 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }
  }

  private setupHotspots(W: number, H: number) {
    this.hotspots = [
      {
        x: W * 0.44, y: H * 0.68,
        r: 70, label: 'Kałuża',
        action: () => {
          this.dialogActive = true
          this.dialog.show(PUDDLE_DIALOGS, () => { this.dialogActive = false })
        },
      },
      {
        x: W * 0.82, y: H * 0.38,
        r: 80, label: 'Hotel Polonia',
        action: () => {
          this.dialogActive = true
          this.dialog.show(NEON_DIALOGS, () => { this.dialogActive = false })
        },
      },
      {
        x: W * 0.5, y: H * 0.3,
        r: 75, label: 'Schody',
        action: () => {
          this.dialogActive = true
          this.dialog.show(STAIRS_DIALOGS, () => { this.dialogActive = false })
        },
      },
    ]
  }

  private showHotspotIndicators() {
    this.hotspotIndicators.forEach(c => c.destroy())
    this.hotspotIndicators = []

    this.hotspots.forEach(h => {
      const cont = this.add.container(h.x, h.y - 55)
      cont.setDepth(80)

      const circ = this.add.graphics()
      circ.lineStyle(2, NOIR.RED, 0.8)
      circ.strokeCircle(0, 0, 16)
      circ.fillStyle(NOIR.RED, 0.15)
      circ.fillCircle(0, 0, 16)

      const icon = this.add.text(0, 0, '✦', {
        fontSize: '14px', color: '#cc2200',
      }).setOrigin(0.5)

      const label = this.add.text(0, 24, h.label, {
        fontSize: '13px',
        fontFamily: 'Georgia, serif',
        color: '#f0f0f0',
        backgroundColor: '#00000099',
        padding: { x: 6, y: 3 },
      }).setOrigin(0.5)

      cont.add([circ, icon, label])
      this.tweens.add({ targets: cont, y: h.y - 60, duration: 900 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      this.hotspotIndicators.push(cont)
    })
  }

  private showClickIndicator(x: number, y: number) {
    if (!this.clickIndicator) return
    this.clickIndicator.clear()
    this.clickIndicator.lineStyle(2, NOIR.WHITE, 0.5)
    this.clickIndicator.strokeCircle(x, y, 12)
    this.tweens.add({ targets: this.clickIndicator, alpha: 0, duration: 500, ease: 'Power2', onComplete: () => this.clickIndicator?.setAlpha(1) })
  }

  private walkTo(x: number, onArrive?: () => void) {
    const W = this.scale.width
    x = Phaser.Math.Clamp(x, 80, W - 80)
    this.targetX = x
    this.facing = x > this.detectiveX ? 'right' : 'left'
    this.isWalking = true

    if (onArrive) {
      const check = this.time.addEvent({
        delay: 50, loop: true,
        callback: () => {
          if (Math.abs(this.detectiveX - x) < 10) {
            check.remove()
            this.isWalking = false
            onArrive()
          }
        },
      })
    }
  }

  update() {
    this.rain.update()

    if (this.isWalking) {
      const dx = this.targetX - this.detectiveX
      if (Math.abs(dx) > 3) {
        this.detectiveX += dx * 0.08
        this.walkFrame++
      } else {
        this.detectiveX = this.targetX
        this.isWalking = false
        this.walkFrame = 0
      }
    }

    this.detective.clear()
    drawDetective(this.detective, this.detectiveX, this.detectiveY, this.facing, this.isWalking ? this.walkFrame : 0)
  }
}
