/**
 * Rysuje tła i elementy scenografii w stylu noir bezpośrednio przez Phaser Graphics.
 * Wszystko czarno-białe z akcentami czerwieni.
 */

export const NOIR = {
  BLACK: 0x0a0a0a,
  DARK: 0x1a1a1a,
  SHADOW: 0x111111,
  MIDGRAY: 0x555555,
  GRAY: 0x888888,
  LIGHT: 0xcccccc,
  WHITE: 0xf0f0f0,
  RED: 0xcc2200,
  RED_DIM: 0x660000,
  YELLOW: 0xddaa00,
  YELLOW_DIM: 0x886600,
}

export function drawOfficeBackground(g: Phaser.GameObjects.Graphics, w: number, h: number) {
  // Podłoga
  g.fillStyle(NOIR.DARK)
  g.fillRect(0, 0, w, h)

  // Deski podłogowe
  g.lineStyle(1, NOIR.MIDGRAY, 0.3)
  for (let y = h * 0.65; y < h; y += 18) {
    g.beginPath()
    g.moveTo(0, y)
    g.lineTo(w, y)
    g.strokePath()
  }

  // Ściana tylna z teksturą cegły
  g.fillStyle(NOIR.SHADOW)
  g.fillRect(0, 0, w, h * 0.65)

  // Cegły
  const brickH = 28
  const brickW = 70
  for (let row = 0; row < Math.ceil((h * 0.65) / brickH); row++) {
    const offset = (row % 2) * (brickW / 2)
    for (let col = -1; col < Math.ceil(w / brickW) + 1; col++) {
      const bx = col * brickW + offset
      const by = row * brickH
      g.lineStyle(1, NOIR.MIDGRAY, 0.25)
      g.strokeRect(bx + 1, by + 1, brickW - 2, brickH - 2)
    }
  }

  // Okno z żaluzjami — światło wpadające pasami
  const winX = w * 0.72
  const winY = 60
  const winW = 220
  const winH = 280
  g.fillStyle(NOIR.YELLOW_DIM, 0.15)
  g.fillRect(winX, winY, winW, winH)

  // Paski światła przez żaluzje
  const stripeCount = 14
  const stripeH = winH / stripeCount
  for (let i = 0; i < stripeCount; i += 2) {
    g.fillStyle(NOIR.YELLOW, 0.06)
    g.fillRect(winX, winY + i * stripeH, winW, stripeH)
    // Cień żaluzji na podłodze (perspektywa)
    const shadowX = winX - 40 + i * 8
    const shadowW = winW + 40
    g.fillStyle(NOIR.YELLOW, 0.03)
    g.fillRect(shadowX, h * 0.62, shadowW, 30)
  }

  // Rama okna
  g.lineStyle(3, NOIR.LIGHT, 0.7)
  g.strokeRect(winX, winY, winW, winH)
  g.lineStyle(1, NOIR.LIGHT, 0.4)
  g.beginPath(); g.moveTo(winX + winW / 2, winY); g.lineTo(winX + winW / 2, winY + winH); g.strokePath()
  g.beginPath(); g.moveTo(winX, winY + winH / 2); g.lineTo(winX + winW, winY + winH / 2); g.strokePath()

  // Biurko
  const deskY = h * 0.58
  g.fillStyle(NOIR.MIDGRAY, 0.9)
  g.fillRect(w * 0.05, deskY, w * 0.5, 22)
  g.fillStyle(NOIR.DARK)
  g.fillRect(w * 0.05, deskY + 22, 18, h * 0.42 - 22)
  g.fillRect(w * 0.55 - 18, deskY + 22, 18, h * 0.42 - 22)

  // Lampka na biurku
  const lampX = w * 0.22
  const lampY = deskY - 2
  g.lineStyle(2, NOIR.GRAY)
  g.beginPath(); g.moveTo(lampX, lampY); g.lineTo(lampX + 10, lampY - 55); g.strokePath()
  g.beginPath(); g.moveTo(lampX + 10, lampY - 55); g.lineTo(lampX + 45, lampY - 55); g.strokePath()
  g.fillStyle(NOIR.YELLOW, 0.9)
  g.fillTriangle(lampX + 10, lampY - 55, lampX + 45, lampY - 55, lampX + 28, lampY - 25)

  // Stożek światła lampy
  g.fillStyle(NOIR.YELLOW, 0.08)
  g.fillTriangle(lampX + 10, lampY - 55, lampX + 45, lampY - 55, lampX - 20, deskY)

  // Papiery na biurku
  g.fillStyle(NOIR.LIGHT, 0.8)
  g.fillRect(w * 0.28, deskY - 8, 65, 8)
  g.fillRect(w * 0.31, deskY - 14, 55, 8)
  g.fillStyle(NOIR.GRAY, 0.4)
  for (let i = 0; i < 4; i++) {
    g.fillRect(w * 0.29 + i * 14, deskY - 6, 10, 1)
  }

  // Szafa w tle
  const cabX = w * 0.02
  const cabY = h * 0.1
  g.fillStyle(NOIR.BLACK)
  g.fillRect(cabX, cabY, 95, h * 0.52)
  g.lineStyle(2, NOIR.MIDGRAY, 0.6)
  g.strokeRect(cabX, cabY, 95, h * 0.52)
  g.lineStyle(1, NOIR.GRAY, 0.3)
  g.beginPath(); g.moveTo(cabX + 47, cabY); g.lineTo(cabX + 47, cabY + h * 0.52); g.strokePath()
  g.beginPath(); g.moveTo(cabX, cabY + h * 0.26); g.lineTo(cabX + 95, cabY + h * 0.26); g.strokePath()
  g.fillStyle(NOIR.MIDGRAY, 0.5)
  g.fillCircle(cabX + 35, cabY + h * 0.13, 4)
  g.fillCircle(cabX + 60, cabY + h * 0.13, 4)

  // Tablica detektywistyczna na ścianie
  const boardX = w * 0.35
  const boardY = 40
  g.fillStyle(0x2a1a0a)
  g.fillRect(boardX, boardY, 280, 200)
  g.lineStyle(3, 0x4a3a1a)
  g.strokeRect(boardX, boardY, 280, 200)

  // Karteczki i sznurki
  const notes = [
    { x: boardX + 20, y: boardY + 20, w: 70, h: 55, rot: -0.08 },
    { x: boardX + 110, y: boardY + 15, w: 80, h: 60, rot: 0.05 },
    { x: boardX + 200, y: boardY + 25, w: 65, h: 50, rot: -0.12 },
    { x: boardX + 30, y: boardY + 110, w: 75, h: 55, rot: 0.07 },
    { x: boardX + 155, y: boardY + 105, w: 80, h: 60, rot: -0.04 },
  ]
  notes.forEach(n => {
    g.save()
    g.fillStyle(NOIR.LIGHT, 0.85)
    g.fillRect(n.x, n.y, n.w, n.h)
    g.lineStyle(1, NOIR.GRAY, 0.5)
    g.strokeRect(n.x, n.y, n.w, n.h)
    g.lineStyle(1, NOIR.GRAY, 0.3)
    for (let li = 0; li < 4; li++) {
      g.beginPath(); g.moveTo(n.x + 8, n.y + 12 + li * 10); g.lineTo(n.x + n.w - 8, n.y + 12 + li * 10); g.strokePath()
    }
    g.restore()
  })

  // Czerwone sznurki między karteczkami
  g.lineStyle(1, NOIR.RED, 0.7)
  g.beginPath(); g.moveTo(boardX + 55, boardY + 47); g.lineTo(boardX + 150, boardY + 45); g.strokePath()
  g.beginPath(); g.moveTo(boardX + 110, boardY + 45); g.lineTo(boardX + 68, boardY + 138); g.strokePath()
  g.beginPath(); g.moveTo(boardX + 190, boardY + 50); g.lineTo(boardX + 235, boardY + 135); g.strokePath()

  // Pinezki
  ;[
    [boardX + 55, boardY + 47], [boardX + 150, boardY + 45],
    [boardX + 110, boardY + 45], [boardX + 68, boardY + 138],
    [boardX + 190, boardY + 50], [boardX + 235, boardY + 135],
  ].forEach(([px, py]) => {
    g.fillStyle(NOIR.RED)
    g.fillCircle(px, py, 4)
    g.fillStyle(NOIR.WHITE)
    g.fillCircle(px - 1, py - 1, 1)
  })

  // Podłoga — linia podziału
  g.fillStyle(0x0f0f0f)
  g.fillRect(0, h * 0.65, w, 3)
}

export function drawAlleyBackground(g: Phaser.GameObjects.Graphics, w: number, h: number) {
  // Niebo nocne
  const skyGrad = g.scene.add.graphics()
  g.fillStyle(NOIR.BLACK)
  g.fillRect(0, 0, w, h)

  // Mgła na dole
  for (let i = 0; i < 6; i++) {
    g.fillStyle(0x222233, 0.12 - i * 0.015)
    g.fillRect(0, h - 80 + i * 12, w, 12)
  }

  // Budynki w tle (sylwetki)
  const buildings = [
    { x: 0, w: 140, h: 340, floors: 12 },
    { x: 120, w: 100, h: 420, floors: 15 },
    { x: 200, w: 160, h: 280, floors: 10 },
    { x: 340, w: 90, h: 380, floors: 14 },
    { x: 800, w: 110, h: 360, floors: 13 },
    { x: 890, w: 150, h: 300, floors: 11 },
    { x: 1020, w: 130, h: 440, floors: 16 },
    { x: 1130, w: 160, h: 260, floors: 9 },
  ]

  buildings.forEach(b => {
    const by = h * 0.55 - b.h
    g.fillStyle(NOIR.BLACK)
    g.fillRect(b.x, by, b.w, b.h + h * 0.45)
    // Okna (losowe światła)
    const floorH = b.h / b.floors
    for (let f = 1; f < b.floors; f++) {
      for (let col = 0; col < Math.floor(b.w / 20); col++) {
        const wx = b.x + 5 + col * 20
        const wy = by + f * floorH
        const lit = Math.sin(wx * 7.3 + wy * 3.1) > 0.2
        if (lit) {
          g.fillStyle(NOIR.YELLOW, 0.6)
          g.fillRect(wx, wy + 3, 11, 8)
        } else {
          g.fillStyle(NOIR.DARK)
          g.fillRect(wx, wy + 3, 11, 8)
        }
      }
    }
  })

  // Jezdnia
  g.fillStyle(NOIR.SHADOW)
  g.fillRect(0, h * 0.55, w, h * 0.45)

  // Kałuże odbijające światło
  const puddles = [
    { x: w * 0.1, y: h * 0.72, rx: 70, ry: 18 },
    { x: w * 0.45, y: h * 0.68, rx: 90, ry: 22 },
    { x: w * 0.75, y: h * 0.8, rx: 60, ry: 15 },
  ]
  puddles.forEach(p => {
    g.fillStyle(NOIR.DARK, 0.8)
    g.fillEllipse(p.x, p.y, p.rx * 2, p.ry * 2)
    g.fillStyle(NOIR.RED, 0.2)
    g.fillEllipse(p.x, p.y, p.rx * 2 * 0.6, p.ry * 2 * 0.6)
  })

  // Latarnia uliczna
  const lampPostX = w * 0.15
  g.lineStyle(4, NOIR.GRAY)
  g.beginPath(); g.moveTo(lampPostX, h); g.lineTo(lampPostX, h * 0.35); g.strokePath()
  g.lineStyle(3, NOIR.GRAY)
  g.beginPath(); g.moveTo(lampPostX, h * 0.35); g.lineTo(lampPostX + 50, h * 0.3); g.strokePath()
  g.fillStyle(NOIR.YELLOW)
  g.fillRect(lampPostX + 42, h * 0.3 - 8, 22, 14)

  // Stożek światła latarni
  g.fillStyle(NOIR.YELLOW, 0.05)
  g.fillTriangle(lampPostX + 42, h * 0.3, lampPostX + 64, h * 0.3, lampPostX - 80, h * 0.72)

  // Neon "HOTEL" po prawej
  const neonX = w * 0.78
  const neonY = h * 0.22
  g.fillStyle(NOIR.RED, 0.9)
  g.fillRect(neonX, neonY, 120, 36)
  g.lineStyle(2, NOIR.RED)
  g.strokeRect(neonX - 2, neonY - 2, 124, 40)
  // Blask neonu
  g.fillStyle(NOIR.RED, 0.06)
  g.fillRect(neonX - 30, neonY - 30, 180, 120)

  // Mur po lewej
  g.fillStyle(NOIR.DARK)
  g.fillRect(0, h * 0.1, 60, h * 0.9)
  g.lineStyle(1, NOIR.MIDGRAY, 0.3)
  for (let row = 0; row < 20; row++) {
    const offset = (row % 2) * 30
    for (let col = 0; col < 3; col++) {
      g.strokeRect(col * 60 + offset - 30, h * 0.1 + row * 30, 58, 28)
    }
  }

  // Mur po prawej
  g.fillStyle(NOIR.DARK)
  g.fillRect(w - 60, h * 0.1, 60, h * 0.9)
  g.lineStyle(1, NOIR.MIDGRAY, 0.3)
  for (let row = 0; row < 20; row++) {
    const offset = (row % 2) * 30
    for (let col = 0; col < 3; col++) {
      g.strokeRect(w - 60 + col * 60 + offset - 30, h * 0.1 + row * 30, 58, 28)
    }
  }

  // Schody prowadzące w górę zaułka (perspektywa)
  g.fillStyle(NOIR.SHADOW)
  g.fillRect(w * 0.35, h * 0.15, w * 0.3, h * 0.4)
  g.lineStyle(1, NOIR.MIDGRAY, 0.2)
  for (let s = 0; s < 10; s++) {
    const sy = h * 0.15 + s * (h * 0.04)
    g.beginPath(); g.moveTo(w * 0.35, sy); g.lineTo(w * 0.65, sy); g.strokePath()
  }
}

export function drawDetective(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: 'left' | 'right' = 'right',
  walkFrame: number = 0
) {
  const flip = facing === 'left' ? -1 : 1
  const legSwing = Math.sin(walkFrame * 0.3) * 8
  const armSwing = Math.sin(walkFrame * 0.3 + Math.PI) * 6
  const bodyBob = Math.abs(Math.sin(walkFrame * 0.3)) * 2

  g.save()
  g.translateCanvas(x, y - bodyBob)
  g.scaleCanvas(flip, 1)

  // Cień pod postacią
  g.fillStyle(NOIR.BLACK, 0.5)
  g.fillEllipse(0, 78, 50, 12)

  // Nogi
  g.lineStyle(8, NOIR.DARK)
  // Lewa noga
  g.beginPath(); g.moveTo(-8, 40); g.lineTo(-8 - legSwing * 0.5, 76); g.strokePath()
  // Prawa noga
  g.beginPath(); g.moveTo(8, 40); g.lineTo(8 + legSwing * 0.5, 76); g.strokePath()

  // Buty
  g.fillStyle(NOIR.BLACK)
  g.fillRect(-14 - legSwing * 0.5, 73, 18, 8)
  g.fillRect(4 + legSwing * 0.5, 73, 18, 8)

  // Płaszcz — korpus
  g.fillStyle(NOIR.DARK)
  g.fillRect(-20, -10, 40, 55)

  // Poła płaszcza (dynamiczna)
  g.fillStyle(NOIR.BLACK)
  const coatSwing = Math.sin(walkFrame * 0.3) * 5
  g.fillTriangle(-20, 25, -20, 45, -32 - coatSwing, 60)
  g.fillTriangle(20, 25, 20, 45, 32 + coatSwing, 60)

  // Krawat/koszula
  g.fillStyle(NOIR.MIDGRAY)
  g.fillRect(-5, -8, 10, 20)
  g.fillStyle(NOIR.WHITE, 0.7)
  g.fillRect(-3, -8, 6, 6)

  // Ramiona i ręce
  g.lineStyle(9, NOIR.DARK)
  g.beginPath(); g.moveTo(-20, -5); g.lineTo(-28 + armSwing, 20); g.strokePath()
  g.beginPath(); g.moveTo(20, -5); g.lineTo(28 - armSwing, 20); g.strokePath()

  // Dłonie
  g.fillStyle(NOIR.LIGHT, 0.8)
  g.fillCircle(-28 + armSwing, 22, 5)
  g.fillCircle(28 - armSwing, 22, 5)

  // Szyja
  g.fillStyle(NOIR.LIGHT, 0.6)
  g.fillRect(-5, -22, 10, 14)

  // Głowa
  g.fillStyle(NOIR.LIGHT, 0.7)
  g.fillEllipse(0, -35, 34, 38)

  // Twarz — cień kapelusza na oczach
  g.fillStyle(NOIR.SHADOW, 0.7)
  g.fillRect(-17, -48, 34, 18)

  // Kapelusz — rondo
  g.fillStyle(NOIR.BLACK)
  g.fillRect(-26, -50, 52, 8)
  // Kapelusz — tuba
  g.fillRect(-18, -76, 36, 28)
  // Linia kapelusza
  g.lineStyle(2, NOIR.MIDGRAY, 0.5)
  g.strokeRect(-18, -76, 36, 28)

  // Oczy (widoczne w cieniu)
  g.fillStyle(NOIR.WHITE, 0.3)
  g.fillEllipse(-8, -43, 10, 6)
  g.fillEllipse(8, -43, 10, 6)
  g.fillStyle(NOIR.BLACK, 0.8)
  g.fillEllipse(-8, -43, 5, 4)
  g.fillEllipse(8, -43, 5, 4)

  // Usta — papieros
  g.fillStyle(NOIR.LIGHT, 0.6)
  g.fillRect(2, -28, 14, 3)
  g.fillStyle(NOIR.RED, 0.8)
  g.fillCircle(16, -27, 2)
  // Dym z papierosa
  g.lineStyle(1, NOIR.GRAY, 0.3)
  g.beginPath(); g.moveTo(16, -29); g.lineTo(14, -38); g.strokePath()
  g.beginPath(); g.moveTo(14, -38); g.lineTo(18, -46); g.strokePath()

  g.restore()
}
