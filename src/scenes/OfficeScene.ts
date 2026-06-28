import { drawOfficeBackground, drawDetective, NOIR } from '../objects/NoirArt'
import { DialogBox } from '../ui/DialogBox'
import { Rain } from '../objects/Rain'

const OFFICE_DIALOGS_INTRO = [
  { speaker: 'Marek Lis', text: 'Znowu ta sama dziura. Znowu ten sam deszcz za oknem.' },
  { speaker: 'Marek Lis', text: 'Trzy tygodnie bez roboty. Rachunek za czynsz czeka.' },
  {
    speaker: 'Narrator',
    text: 'Na tablicy wisią zdjęcia z ostatniej sprawy. Sprawa zamknięta. Klient niezadowolony.',
    color: NOIR.GRAY,
  },
  { speaker: 'Marek Lis', text: 'Tego wieczoru coś musi się zmienić.' },
]

const BOARD_DIALOGS = [
  { speaker: 'Narrator', text: 'Tablica ze zdjęciami, sznurkami i notatkami. Stara sprawa — zaginięcie pewnego biznesmena.', color: NOIR.GRAY },
  { speaker: 'Marek Lis', text: 'Władysław Rożen. Zaginął trzy miesiące temu. Żona zapłaciła z góry. I tyle z niej.' },
  { speaker: 'Narrator', text: 'Czerwone sznurki prowadzą donikąd. Jak zawsze.', color: NOIR.GRAY },
]

const WINDOW_DIALOGS = [
  { speaker: 'Narrator', text: 'Przez brudną szybę widać mokrą ulicę i blask neonów.', color: NOIR.GRAY },
  { speaker: 'Marek Lis', text: 'Gdzieś tam jest odpowiedź. Zawsze jest. Wystarczy wiedzieć gdzie szukać.' },
]

const KNOCK_DIALOGS = [
  { speaker: 'Narrator', text: '— Puk. Puk. Puk. —', color: NOIR.GRAY },
  { speaker: 'Marek Lis', text: '...Co to, do cholery?' },
  { speaker: 'Nieznajoma', text: 'Panie Lis? Czy mogę wejść? To... pilne.', color: 0x8899cc },
  { speaker: 'Marek Lis', text: 'Drzwi otwarte.' },
  {
    speaker: 'Narrator',
    text: 'Kobieta w mokrym płaszczu. Oczy zapłakane lub może po prostu mokre od deszczu. Trudno stwierdzić.',
    color: NOIR.GRAY,
  },
  { speaker: 'Nieznajoma', text: 'Mój brat zaginął. Policja mówi że uciekł z kochanką. Ale ja wiem... ja wiem że to nieprawda.', color: 0x8899cc },
  { speaker: 'Marek Lis', text: 'Proszę usiąść. I od początku.' },
  {
    speaker: 'Narrator',
    text: 'Nowa sprawa. Może ta zrobi różnicę. Wychodzimy na ulicę.',
    color: NOIR.GRAY,
  },
]

export class OfficeScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Graphics
  private detective!: Phaser.GameObjects.Graphics
  private dialog!: DialogBox
  private rain!: Rain

  private detectiveX = 200
  private detectiveY = 490
  private targetX = 200
  private facing: 'left' | 'right' = 'right'
  private walkFrame = 0
  private isWalking = false

  private hotspots: Array<{ x: number; y: number; r: number; label: string; action: () => void }> = []
  private hotspotIndicators: Phaser.GameObjects.Container[] = []
  private clickIndicator?: Phaser.GameObjects.Graphics
  private dialogActive = false
  private introPlayed = false
  private sceneTransitioned = false

  constructor() { super({ key: 'OfficeScene' }) }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    this.cameras.main.fadeIn(800, 0, 0, 0)

    // Tło biura
    this.bg = this.add.graphics()
    drawOfficeBackground(this.bg, W, H)

    // Deszcz widoczny przez okno (subtelny)
    this.rain = new Rain(this, 30)

    // Postać
    this.detective = this.add.graphics()
    this.detective.setDepth(50)

    // Dialog
    this.dialog = new DialogBox(this)

    // Hotspoty klikalne
    this.setupHotspots(W, H)

    // Wskaźnik kliknięcia (gdzie chodzić)
    this.clickIndicator = this.add.graphics()
    this.clickIndicator.setDepth(60)

    // Kliknięcie na scenę = idź tam
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.dialogActive) return
      const clicked = this.hotspots.find(h => {
        const dx = ptr.x - h.x; const dy = ptr.y - h.y
        return Math.sqrt(dx * dx + dy * dy) < h.r
      })
      if (clicked) {
        this.walkTo(clicked.x, clicked.action)
      } else if (ptr.y > H * 0.45 && ptr.y < H - 180) {
        this.walkTo(ptr.x)
        this.showClickIndicator(ptr.x, ptr.y)
      }
    })

    // Intro dialog po chwili
    this.time.delayedCall(900, () => {
      this.dialogActive = true
      this.dialog.show(OFFICE_DIALOGS_INTRO, () => {
        this.dialogActive = false
        this.introPlayed = true
        this.showHotspotIndicators()
      })
    })
  }

  private setupHotspots(W: number, H: number) {
    this.hotspots = [
      {
        x: W * 0.48, y: H * 0.32,
        r: 80, label: 'Tablica',
        action: () => {
          this.dialogActive = true
          this.dialog.show(BOARD_DIALOGS, () => { this.dialogActive = false })
        }
      },
      {
        x: W * 0.82, y: H * 0.28,
        r: 70, label: 'Okno',
        action: () => {
          this.dialogActive = true
          this.dialog.show(WINDOW_DIALOGS, () => {
            this.dialogActive = false
            if (!this.sceneTransitioned) this.triggerKnock()
          })
        }
      },
    ]
  }

  private triggerKnock() {
    this.sceneTransitioned = true
    this.time.delayedCall(600, () => {
      // Efekt pukania — shake
      this.cameras.main.shake(400, 0.003)
      this.time.delayedCall(500, () => {
        this.dialogActive = true
        this.dialog.show(KNOCK_DIALOGS, () => {
          this.cameras.main.fadeOut(800, 0, 0, 0)
          this.time.delayedCall(800, () => {
            this.rain.destroy()
            this.scene.start('AlleyScene')
          })
        })
      })
    })
  }

  private showHotspotIndicators() {
    this.hotspotIndicators.forEach(c => c.destroy())
    this.hotspotIndicators = []

    this.hotspots.forEach(h => {
      const cont = this.add.container(h.x, h.y - 50)
      cont.setDepth(80)

      const circ = this.add.graphics()
      circ.lineStyle(2, NOIR.RED, 0.8)
      circ.strokeCircle(0, 0, 16)
      circ.fillStyle(NOIR.RED, 0.2)
      circ.fillCircle(0, 0, 16)

      const arrow = this.add.text(0, 0, '✦', {
        fontSize: '14px', color: '#cc2200',
      }).setOrigin(0.5)

      const label = this.add.text(0, 22, h.label, {
        fontSize: '13px',
        fontFamily: 'Georgia, serif',
        color: '#f0f0f0',
        backgroundColor: '#00000099',
        padding: { x: 6, y: 3 },
      }).setOrigin(0.5)

      cont.add([circ, arrow, label])
      this.tweens.add({ targets: cont, y: h.y - 55, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      this.hotspotIndicators.push(cont)
    })
  }

  private showClickIndicator(x: number, y: number) {
    if (!this.clickIndicator) return
    this.clickIndicator.clear()
    this.clickIndicator.lineStyle(2, NOIR.WHITE, 0.6)
    this.clickIndicator.strokeCircle(x, y, 12)
    this.clickIndicator.lineStyle(1, NOIR.WHITE, 0.3)
    this.clickIndicator.strokeCircle(x, y, 20)

    this.tweens.add({
      targets: this.clickIndicator,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => { this.clickIndicator?.setAlpha(1) },
    })
  }

  private walkTo(x: number, onArrive?: () => void) {
    const W = this.scale.width
    x = Phaser.Math.Clamp(x, 80, W - 80)
    this.targetX = x
    this.facing = x > this.detectiveX ? 'right' : 'left'
    this.isWalking = true

    if (onArrive) {
      const check = this.time.addEvent({
        delay: 50,
        loop: true,
        callback: () => {
          if (Math.abs(this.detectiveX - x) < 8) {
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

    // Chód detektywa
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
