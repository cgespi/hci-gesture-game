import Phaser from 'phaser'
import {
  COLOR_NET_MESH,
  COLOR_NET_TOP,
  COLOR_ROOM_BG,
  COLOR_TABLE_LINE,
  COLOR_TABLE_SURFACE,
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

/**
 * Draws a first-person ping-pong table (trapezoid surface + lines) and a net at {@link NET_T}.
 * All vector graphics; no external assets.
 */
export function createCourtRenderer(scene: Phaser.Scene, options: CourtOptions = {}): CourtView {
  const dims = resolveDims(options)
  const q = tableSurfaceQuad(dims)

  const room = scene.add.graphics().setDepth(DEPTH_ROOM_BG)
  room.fillStyle(COLOR_ROOM_BG, 1)
  room.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  const table = scene.add.graphics().setDepth(DEPTH_TABLE)

  // Table surface (two triangles).
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

  // Sidelines + near/far end lines.
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

  // Center lengthwise line.
  table.lineStyle(2, COLOR_TABLE_LINE, 0.45)
  table.beginPath()
  table.moveTo(dims.centerX, dims.topY)
  table.lineTo(dims.centerX, dims.bottomY)
  table.strokePath()

  // Subtle depth stripes (optional readability).
  table.lineStyle(1, COLOR_TABLE_LINE, 0.12)
  const steps = 5
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const row = trapezoidRow(dims, t)
    table.beginPath()
    table.moveTo(row.leftX, row.y)
    table.lineTo(row.rightX, row.y)
    table.strokePath()
  }

  // Net: separate layer so ball can sort above/below.
  const net = scene.add.graphics().setDepth(DEPTH_NET)
  const netRow = trapezoidRow(dims, NET_T)
  const yNet = netRow.y
  const postLift = 14
  const postDrop = 6
  const postOut = 10

  // Posts just outside the table width.
  net.lineStyle(4, COLOR_TABLE_LINE, 0.85)
  net.beginPath()
  net.moveTo(netRow.leftX - postOut, yNet + postDrop)
  net.lineTo(netRow.leftX - postOut, yNet - postLift)
  net.moveTo(netRow.rightX + postOut, yNet + postDrop)
  net.lineTo(netRow.rightX + postOut, yNet - postLift)
  net.strokePath()

  // Top tape.
  net.lineStyle(5, COLOR_NET_TOP, 0.95)
  net.beginPath()
  net.moveTo(netRow.leftX, yNet)
  net.lineTo(netRow.rightX, yNet)
  net.strokePath()

  // Mesh: vertical segments.
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
  // Mesh horizontals.
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
