import Phaser from 'phaser'
import {
  COLOR_NET_MESH,
  COLOR_NET_TOP,
  COLOR_ROOM_BG,
  COLOR_TABLE_LINE,
  COLOR_TABLE_SURFACE,
  COURT_PERSPECTIVE,
  DEPTH_NET,
  DEPTH_ROOM_BG,
  DEPTH_TABLE,
  GAME_HEIGHT,
  GAME_WIDTH,
  NET_T,
} from '../constants.ts'
import {
  defaultTableDims,
  hitBandQuad,
  projectCourtPoint,
  tableSurfaceQuad,
  trapezoidRow,
  type TableDims,
} from './tablePerspective.ts'

export type CourtView = {
  tableGraphics: Phaser.GameObjects.Graphics
  netGraphics: Phaser.GameObjects.Graphics
  destroy: () => void
}

export type CourtOptions = Partial<TableDims>

function resolveDims(options: CourtOptions): TableDims {
  return { ...defaultTableDims(), ...options }
}

function strokeFullWidthRow(g: Phaser.GameObjects.Graphics, dims: TableDims, zNorm: number, lineWidth: number, color: number, alpha: number): void {
  const row = trapezoidRow(dims, zNorm)
  g.lineStyle(lineWidth, color, alpha)
  g.beginPath()
  g.moveTo(row.leftX, row.y)
  g.lineTo(row.rightX, row.y)
  g.strokePath()
}

/**
 * Draws a first-person ping-pong table (perspective quad + lines) and a net at {@link NET_T}.
 * Geometry comes from {@link projectCourtPoint}; all vector graphics, no external assets.
 */
export function createCourtRenderer(scene: Phaser.Scene, options: CourtOptions = {}): CourtView {
  const dims = resolveDims(options)
  const q = tableSurfaceQuad(dims)

  const room = scene.add.graphics().setDepth(DEPTH_ROOM_BG)
  room.fillStyle(COLOR_ROOM_BG, 1)
  room.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  const table = scene.add.graphics().setDepth(DEPTH_TABLE)

  // Table surface (two triangles from projected corners).
  table.fillStyle(COLOR_TABLE_SURFACE, 1)
  table.beginPath()
  table.moveTo(q.farLeftX, q.farY)
  table.lineTo(q.farRightX, q.farY)
  table.lineTo(q.nearRightX, q.nearY)
  table.closePath()
  table.fillPath()
  table.beginPath()
  table.moveTo(q.farLeftX, q.farY)
  table.lineTo(q.nearRightX, q.nearY)
  table.lineTo(q.nearLeftX, q.nearY)
  table.closePath()
  table.fillPath()

  // Sidelines and end lines (straight in court space → screen chords).
  table.lineStyle(3, COLOR_TABLE_LINE, 0.9)
  table.beginPath()
  table.moveTo(q.farLeftX, q.farY)
  table.lineTo(q.nearLeftX, q.nearY)
  table.moveTo(q.farRightX, q.farY)
  table.lineTo(q.nearRightX, q.nearY)
  table.moveTo(q.farLeftX, q.farY)
  table.lineTo(q.farRightX, q.farY)
  table.moveTo(q.nearLeftX, q.nearY)
  table.lineTo(q.nearRightX, q.nearY)
  table.strokePath()

  // Center lengthwise line (court midline at xNorm = 0).
  const cFar = projectCourtPoint(dims, 0, 0)
  const cNear = projectCourtPoint(dims, 0, 1)
  table.lineStyle(2, COLOR_TABLE_LINE, 0.45)
  table.beginPath()
  table.moveTo(cFar.x, cFar.y)
  table.lineTo(cNear.x, cNear.y)
  table.strokePath()

  // Service / guide lines (parallel to far edge at fixed depths).
  strokeFullWidthRow(table, dims, COURT_PERSPECTIVE.serviceLineZ0, 1, COLOR_TABLE_LINE, 0.35)
  strokeFullWidthRow(table, dims, COURT_PERSPECTIVE.serviceLineZ1, 1, COLOR_TABLE_LINE, 0.35)

  // Subtle net line on the table plane (under the net mesh).
  strokeFullWidthRow(table, dims, NET_T, 1, COLOR_TABLE_LINE, 0.22)

  // Depth stripes: evenly spaced in zNorm so spacing matches court depth, not screen Y.
  table.lineStyle(1, COLOR_TABLE_LINE, 0.12)
  const steps = COURT_PERSPECTIVE.depthStripeCount
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    strokeFullWidthRow(table, dims, t, 1, COLOR_TABLE_LINE, 0.12)
  }

  // Net: separate layer so ball can sort above/below.
  const net = scene.add.graphics().setDepth(DEPTH_NET)
  const netRow = trapezoidRow(dims, NET_T)
  const yNet = netRow.y
  const postLift = 14
  const postDrop = 6
  const postOut = 10

  net.lineStyle(4, COLOR_TABLE_LINE, 0.85)
  net.beginPath()
  net.moveTo(netRow.leftX - postOut, yNet + postDrop)
  net.lineTo(netRow.leftX - postOut, yNet - postLift)
  net.moveTo(netRow.rightX + postOut, yNet + postDrop)
  net.lineTo(netRow.rightX + postOut, yNet - postLift)
  net.strokePath()

  net.lineStyle(5, COLOR_NET_TOP, 0.95)
  net.beginPath()
  net.moveTo(netRow.leftX, yNet)
  net.lineTo(netRow.rightX, yNet)
  net.strokePath()

  const meshLines = 9
  net.lineStyle(1, COLOR_NET_MESH, 0.22)
  for (let i = 0; i <= meshLines; i++) {
    const u = i / meshLines
    const x = Phaser.Math.Linear(netRow.leftX, netRow.rightX, u)
    net.beginPath()
    net.moveTo(x, yNet - 9)
    net.lineTo(x, yNet + 9)
    net.strokePath()
  }
  net.lineStyle(1, COLOR_NET_MESH, 0.18)
  for (const dy of [-5, 0, 5]) {
    net.beginPath()
    net.moveTo(netRow.leftX, yNet + dy)
    net.lineTo(netRow.rightX, yNet + dy)
    net.strokePath()
  }

  return {
    tableGraphics: table,
    netGraphics: net,
    destroy: () => {
      room.destroy()
      table.destroy()
      net.destroy()
    },
  }
}

/** Draw / refresh the semi-transparent hit band between two depth values. */
export function redrawHitBand(
  g: Phaser.GameObjects.Graphics,
  dims: TableDims,
  t0: number,
  t1: number,
): void {
  g.clear()
  const quad = hitBandQuad(dims, t0, t1)
  g.fillStyle(0x00ff66, 0.18)
  g.beginPath()
  g.moveTo(quad.x0, quad.y0)
  g.lineTo(quad.x1, quad.y1)
  g.lineTo(quad.x2, quad.y2)
  g.lineTo(quad.x3, quad.y3)
  g.closePath()
  g.fillPath()

  g.lineStyle(2, 0x00ff66, 0.75)
  g.beginPath()
  g.moveTo(quad.x0, quad.y0)
  g.lineTo(quad.x1, quad.y1)
  g.lineTo(quad.x2, quad.y2)
  g.lineTo(quad.x3, quad.y3)
  g.closePath()
  g.strokePath()
}
