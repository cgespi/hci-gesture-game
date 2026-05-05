
import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, SceneKey } from '../constants.ts'

/**
 * We use this scene as our front door: animated background, playful motion, and navigation buttons.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.Menu })
  }

  create() {
    // We add ambient sparkles so the menu feels alive before gameplay starts.
    //particle sparkles 
    const particles = this.add.graphics()
    const sparkles: { x: number; y: number; alpha: number; speed: number; size: number }[] = []

    for (let i = 0; i < 40; i++) {
      sparkles.push({
        x: Phaser.Math.Between(0, GAME_WIDTH),
        y: Phaser.Math.Between(0, GAME_HEIGHT),
        alpha: Phaser.Math.FloatBetween(0.1, 0.6),
        speed: Phaser.Math.FloatBetween(0.2, 0.8),
        size: Phaser.Math.Between(1, 3),
      })
    }

    this.time.addEvent({
      delay: 32,
      loop: true,
      callback: () => {
        particles.clear()
        for (const s of sparkles) {
          s.y -= s.speed
          s.alpha += Phaser.Math.FloatBetween(-0.02, 0.02)
          s.alpha = Phaser.Math.Clamp(s.alpha, 0.05, 0.7)
          if (s.y < 0) {
            s.y = GAME_HEIGHT
            s.x = Phaser.Math.Between(0, GAME_WIDTH)
          }
          particles.fillStyle(0xffffff, s.alpha)
          particles.fillCircle(s.x, s.y, s.size)
        }
      },
    })

    // We build a central panel that anchors title text and action buttons.
    // panel 
    const panelW = 520
    const panelH = 340
    const panelX = GAME_WIDTH/2 - panelW/2
    const panelY = GAME_HEIGHT/2 - panelH/2

    const outerBorder = this.add.graphics()
    outerBorder.lineStyle(4, 0x2ecc71, 0.8)
    outerBorder.strokeRoundedRect(panelX - 4, panelY - 4, panelW + 8, panelH + 8, 20)

    const innerBorder = this.add.graphics()
    innerBorder.lineStyle(2, 0x27ae60, 0.5)
    innerBorder.strokeRoundedRect(panelX - 1, panelY - 1, panelW + 2, panelH + 2, 18)

    const panel = this.add.graphics()
    panel.fillStyle(0x080818, 0.95)
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16)

    this.tweens.add({
      targets: outerBorder,
      alpha: { from: 0.6, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    //  Title 
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 130, 'Welcome to', {
      fontSize: '28px', color: '#aaffaa', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 95, 'Reflex Strike', {
      fontSize: '34px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 60, 'React. Score.', {
      fontSize: '14px', color: '#2ecc71', fontStyle: 'italic',
    }).setOrigin(0.5)

    // We run decorative mini-physics balls to reinforce the sports theme in the menu.
    //  Ball 1 — inside panel, bounces off buttons 
    const floorY   = panelY + panelH - 12
    const ceilingY = panelY + 12
    const leftWall  = panelX + 12
    const rightWall = panelX + panelW - 12

    let ballVX = Phaser.Math.Between(3, 5) * (Math.random() > 0.5 ? 1 : -1)
    let ballVY = Phaser.Math.Between(3, 5) * (Math.random() > 0.5 ? 1 : -1)
    const gravity = 0.18

    const ballShadow = this.add
      .ellipse(panelX + 60, floorY, 20, 6, 0x000000, 0.3)
      .setDepth(1)

    const ball = this.add
      .circle(panelX + 60, panelY + 60, 10, 0xffe66d)
      .setDepth(2)

    // Button bounds for collision
    const playBtnLeft   = GAME_WIDTH/2 - 140
    const playBtnRight  = GAME_WIDTH/2 + 140
    const playBtnTop    = GAME_HEIGHT/2 + 20 - 25
    const playBtnBottom = GAME_HEIGHT/2 + 20 + 25
    const settingsBtnLeft   = GAME_WIDTH/2 - 140
    const settingsBtnRight  = GAME_WIDTH/2 + 140
    const settingsBtnTop    = GAME_HEIGHT/2 + 90 - 25
    const settingsBtnBottom = GAME_HEIGHT/2 + 90 + 25

    this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        ball.x += ballVX
        ball.y += ballVY
        ballVY += gravity

        // chaos kick
        if (Phaser.Math.Between(0, 120) === 0) {
          ballVX += Phaser.Math.FloatBetween(-1.5, 1.5)
          ballVY += Phaser.Math.FloatBetween(-1.5, 1.5)
          ballVX = Phaser.Math.Clamp(ballVX, -6, 6)
          ballVY = Phaser.Math.Clamp(ballVY, -6, 6)
        }

        // Floor
        if (ball.y >= floorY) {
          ball.y = floorY
          ballVY *= -0.85
          this.tweens.add({ targets: ball, scaleX: 1.4, scaleY: 0.7, duration: 60, yoyo: true })
        }

        // Ceiling
        if (ball.y <= ceilingY) {
          ball.y = ceilingY
          ballVY *= -0.85
          this.tweens.add({ targets: ball, scaleX: 0.7, scaleY: 1.4, duration: 60, yoyo: true })
        }

        // Walls
        if (ball.x <= leftWall || ball.x >= rightWall) {
          ballVX *= -1
          ball.x = Phaser.Math.Clamp(ball.x, leftWall, rightWall)
        }

        // Play button collision
        if (ball.x > playBtnLeft && ball.x < playBtnRight &&
            ball.y > playBtnTop  && ball.y < playBtnBottom) {
          const fromTop    = Math.abs(ball.y - playBtnTop)
          const fromBottom = Math.abs(ball.y - playBtnBottom)
          const fromLeft   = Math.abs(ball.x - playBtnLeft)
          const fromRight  = Math.abs(ball.x - playBtnRight)
          const minDist = Math.min(fromTop, fromBottom, fromLeft, fromRight)
          if (minDist === fromTop || minDist === fromBottom) {
            ballVY *= -1
            ball.y += ballVY * 3
          } else {
            ballVX *= -1
            ball.x += ballVX * 3
          }
        }

        // Settings button collision
        if (ball.x > settingsBtnLeft && ball.x < settingsBtnRight &&
            ball.y > settingsBtnTop  && ball.y < settingsBtnBottom) {
          const fromTop    = Math.abs(ball.y - settingsBtnTop)
          const fromBottom = Math.abs(ball.y - settingsBtnBottom)
          const fromLeft   = Math.abs(ball.x - settingsBtnLeft)
          const fromRight  = Math.abs(ball.x - settingsBtnRight)
          const minDist = Math.min(fromTop, fromBottom, fromLeft, fromRight)
          if (minDist === fromTop || minDist === fromBottom) {
            ballVY *= -1
            ball.y += ballVY * 3
          } else {
            ballVX *= -1
            ball.x += ballVX * 3
          }
        }

        // Shadow
        ballShadow.x = ball.x
        const distFromFloor = floorY - ball.y
        const shadowScale = Phaser.Math.Clamp(1 - distFromFloor / 150, 0.15, 1)
        ballShadow.scaleX = shadowScale
        ballShadow.alpha = shadowScale * 0.4
      },
    })

    // ── Ball 2 — outside panel ────────────────────────────
    const outerFloorY   = GAME_HEIGHT - 20
    const outerCeilingY = 20
    const outerLeftWall  = 20
    const outerRightWall = GAME_WIDTH - 20

    let ball2VX = Phaser.Math.Between(3, 5) * (Math.random() > 0.5 ? 1 : -1)
    let ball2VY = -5  // always starts moving upward fast
    const gravity2 = 0.15

    const ball2Shadow = this.add
      .ellipse(GAME_WIDTH - 80, outerFloorY, 20, 6, 0x000000, 0.3)
      .setDepth(1)

    const ball2 = this.add
      .circle(GAME_WIDTH - 80, 30, 10, 0xffe66d)
      .setDepth(2)

    this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        ball2.x += ball2VX
        ball2.y += ball2VY
        ball2VY += gravity2

        // Chaos kick
        if (Phaser.Math.Between(0, 120) === 0) {
          ball2VX += Phaser.Math.FloatBetween(-1.5, 1.5)
          ball2VY += Phaser.Math.FloatBetween(-1.5, 1.5)
          ball2VX = Phaser.Math.Clamp(ball2VX, -6, 6)
          ball2VY = Phaser.Math.Clamp(ball2VY, -6, 6)
        }

        // Floor
        if (ball2.y >= outerFloorY) {
          ball2.y = outerFloorY
          ball2VY *= -0.85
          this.tweens.add({ targets: ball2, scaleX: 1.4, scaleY: 0.7, duration: 60, yoyo: true })
        }

        // Ceiling
        if (ball2.y <= outerCeilingY) {
          ball2.y = outerCeilingY
          ball2VY *= -0.85
        }

        // Walls
        if (ball2.x <= outerLeftWall || ball2.x >= outerRightWall) {
          ball2VX *= -1
          ball2.x = Phaser.Math.Clamp(ball2.x, outerLeftWall, outerRightWall)
        }

        // Deflect off panel
        const in2PanelX = ball2.x > panelX - 15 && ball2.x < panelX + panelW + 15
        const in2PanelY = ball2.y > panelY - 15 && ball2.y < panelY + panelH + 15
        if (in2PanelX && in2PanelY) {
          ball2VX *= -1
          ball2VY *= -1
          ball2.x += ball2VX * 3
          ball2.y += ball2VY * 3
        }

        // Shadow
        ball2Shadow.x = ball2.x
        const dist2 = outerFloorY - ball2.y
        const shadow2Scale = Phaser.Math.Clamp(1 - dist2 / 200, 0.1, 1)
        ball2Shadow.scaleX = shadow2Scale
        ball2Shadow.alpha = shadow2Scale * 0.35
      },
    })

    // ── Ball 3 — chaotic, top area, red ──────────────────
    let ball3VX = Phaser.Math.Between(3, 5) * (Math.random() > 0.5 ? 1 : -1)
    let ball3VY = Phaser.Math.Between(3, 5) * (Math.random() > 0.5 ? 1 : -1)
    const gravity3 = 0.05

    const ball3Shadow = this.add
      .ellipse(Phaser.Math.Between(20, 200), outerFloorY, 16, 5, 0x000000, 0.2)
      .setDepth(1)

    const ball3 = this.add
      .circle(Phaser.Math.Between(20, 200), Phaser.Math.Between(20, 100), 8, 0xff6b6b)
      .setDepth(2)

    this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        ball3.x += ball3VX
        ball3.y += ball3VY
        ball3VY += gravity3

        // chaos kick
        if (Phaser.Math.Between(0, 120) === 0) {
          ball3VX += Phaser.Math.FloatBetween(-1.5, 1.5)
          ball3VY += Phaser.Math.FloatBetween(-1.5, 1.5)
          ball3VX = Phaser.Math.Clamp(ball3VX, -6, 6)
          ball3VY = Phaser.Math.Clamp(ball3VY, -6, 6)
        }

        // floor
        if (ball3.y >= outerFloorY) {
          ball3.y = outerFloorY
          ball3VY *= -0.9
          this.tweens.add({ targets: ball3, scaleX: 1.5, scaleY: 0.6, duration: 50, yoyo: true })
        }

        // ceiling
        if (ball3.y <= outerCeilingY) {
          ball3.y = outerCeilingY
          ball3VY *= -0.9
        }

        // walls
        if (ball3.x <= outerLeftWall || ball3.x >= outerRightWall) {
          ball3VX *= -1
          ball3.x = Phaser.Math.Clamp(ball3.x, outerLeftWall, outerRightWall)
        }

        // deflect off panel
        const in3PanelX = ball3.x > panelX - 15 && ball3.x < panelX + panelW + 15
        const in3PanelY = ball3.y > panelY - 15 && ball3.y < panelY + panelH + 15
        if (in3PanelX && in3PanelY) {
          ball3VX *= -1
          ball3VY *= -1
          ball3.x += ball3VX * 4
          ball3.y += ball3VY * 4
        }

        // shadow
        ball3Shadow.x = ball3.x
        const dist3 = outerFloorY - ball3.y
        const shadow3Scale = Phaser.Math.Clamp(1 - dist3 / 200, 0.1, 1)
        ball3Shadow.scaleX = shadow3Scale
        ball3Shadow.alpha = shadow3Scale * 0.25
      },
    })

    // Main menu actions.
    // buttons 
    this.makeButton(GAME_WIDTH/2, GAME_HEIGHT/2 + 20, '▶  Play', 'btn-green', () => {
      this.sound.play('menu_click', { volume: 0.5 })
      this.scene.start(SceneKey.Confirm)
    })

    this.makeButton(GAME_WIDTH/2, GAME_HEIGHT/2 + 90, '⚙  Settings', 'btn-blue', () => {
      this.sound.play('menu_click', { volume: 0.5 })
      this.scene.start(SceneKey.Settings)
    })
  }

  private makeButton(x: number, y: number, label: string, key: string, onClick: () => void) {
    // We keep one shared button factory so menu interactions feel consistent across scenes.
    const btn = this.add.nineslice(x, y, key, undefined, 280, 50, 8, 8, 8, 8)
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    const text = this.add.text(x, y, label, {
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1)
    btn.on('pointerover', () => { btn.setScale(1.05); text.setScale(1.05) })
    btn.on('pointerout',  () => { btn.setScale(1.0);  text.setScale(1.0) })
    btn.on('pointerdown', onClick)
  }
}
