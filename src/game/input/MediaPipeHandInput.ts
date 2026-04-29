import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import {
  DEFAULT_HAND_LANDMARKER_MODEL_URL,
  HAND_LANE_LEFT_MAX_X,
  HAND_LANE_RIGHT_MIN_X,
  LOCAL_HAND_LANDMARKER_MODEL_PATH,
  MEDIAPIPE_VISION_WASM_ROOT_URL,
  MIRROR_WEBCAM_INPUT,
  SHOW_WEBCAM_DEBUG_OVERLAY,
  USE_LOCAL_HAND_LANDMARKER_MODEL,
  WEBCAM_HIT_COOLDOWN_MS,
  WEBCAM_SWIPE_JITTER_DEADZONE_X,
  WEBCAM_SWIPE_MIN_DELTA_X,
  WEBCAM_SWIPE_WINDOW_MS,
} from '../constants.ts'
import type { HitAction, HitInputEvent, InputController } from './InputController'

type HandPositionSample = {
  x: number
  y: number
  timeMs: number
}

const HAND_CENTER_LANDMARKS = [0, 5, 9, 13, 17]

/**
 * Optional webcam + MediaPipe controller.
 * If setup fails, this controller silently degrades to "no action" so keyboard remains usable.
 */
export class MediaPipeHandInput implements InputController {
  private handLandmarker: HandLandmarker | null = null
  private videoEl: HTMLVideoElement | null = null
  private webcamStream: MediaStream | null = null
  private overlayRoot: HTMLDivElement | null = null
  private laneLabelEl: HTMLDivElement | null = null

  private pendingHit: HitInputEvent | null = null
  private lastProcessedVideoTime = -1
  private lastWebcamHitAtMs = 0
  private handXHistory: HandPositionSample[] = []

  private initialized = false
  private disabled = false

  constructor() {
    this.createDebugOverlay()
    void this.initialize()
  }

  update(_dtSeconds: number): void {
    this.pendingHit = null

    if (!this.initialized || this.disabled || !this.videoEl || !this.handLandmarker) {
      return
    }

    if (this.videoEl.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return
    }

    if (this.videoEl.currentTime === this.lastProcessedVideoTime) {
      return
    }
    this.lastProcessedVideoTime = this.videoEl.currentTime

    const nowMs = performance.now()
    const result = this.handLandmarker.detectForVideo(this.videoEl, nowMs)
    const handCenter = this.resolveHandCenter(result.landmarks[0])
    if (handCenter === null) {
      this.updateDebugLabel('NO HAND')
      this.resetMotionWindow()
      return
    }

    const lane = this.resolveLaneFromX(handCenter.x)
    this.updateDebugLabel(lane.toUpperCase())
    this.recordHandSample(handCenter.x, handCenter.y, nowMs)

    const swipeAction = this.detectSwipeAction(lane)
    if (swipeAction) {
      this.emitHitIfReady(swipeAction, nowMs)
      return
    }

    // Hybrid behavior: a steady pose is also a valid hit trigger.
    this.emitHitIfReady(lane, nowMs)
  }

  consumeHitAction(): HitInputEvent | null {
    return this.pendingHit
  }

  isReady(): boolean {
    // If webcam setup fails, allow keyboard-only gameplay to continue.
    return this.initialized || this.disabled
  }

  destroy(): void {
    this.stopWebcam()
    if (this.overlayRoot) {
      this.overlayRoot.remove()
      this.overlayRoot = null
      this.laneLabelEl = null
    }

    const maybeClose = this.handLandmarker as unknown as { close?: () => void } | null
    maybeClose?.close?.()
    this.handLandmarker = null
    this.initialized = false
    this.resetMotionWindow()
  }

  private async initialize(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.disableController('Webcam API not available.')
      return
    }

    try {
      const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_VISION_WASM_ROOT_URL)
      const modelAssetPath = this.getModelAssetPath()
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath },
        runningMode: 'VIDEO',
        numHands: 1,
      })
    } catch (error) {
      this.disableController('Failed to load MediaPipe Hand Landmarker.', error)
      return
    }

    try {
      this.webcamStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user',
        },
        audio: false,
      })
    } catch (error) {
      this.disableController('Webcam permission denied or unavailable.', error)
      return
    }

    const videoEl = this.videoEl
    if (!videoEl || !this.webcamStream) {
      this.disableController('Webcam preview could not be created.')
      return
    }

    videoEl.srcObject = this.webcamStream

    try {
      await videoEl.play()
      this.initialized = true
      this.updateDebugLabel('NO HAND')
    } catch (error) {
      this.disableController('Webcam video playback failed.', error)
    }
  }

  private resolveHandCenter(landmarks: { x: number; y: number }[] | undefined): { x: number; y: number } | null {
    if (!landmarks || landmarks.length === 0) {
      return null
    }

    // Average palm-adjacent points for a stable horizontal center signal.
    let xSum = 0
    let ySum = 0
    let count = 0
    for (const idx of HAND_CENTER_LANDMARKS) {
      const lm = landmarks[idx]
      if (!lm) continue
      xSum += lm.x
      ySum += lm.y
      count += 1
    }
    if (!count) return null

    let x = xSum / count
    const y = ySum / count

    // Flip input mapping when using mirrored webcam UX.
    if (MIRROR_WEBCAM_INPUT) {
      x = 1 - x
    }

    return { x, y }
  }

  private resolveLaneFromX(x: number): HitAction {
    if (x < HAND_LANE_LEFT_MAX_X) return 'left'
    if (x > HAND_LANE_RIGHT_MIN_X) return 'right'
    return 'center'
  }

  private recordHandSample(x: number, y: number, nowMs: number): void {
    this.handXHistory.push({ x, y, timeMs: nowMs })
    const minTimeMs = nowMs - WEBCAM_SWIPE_WINDOW_MS
    while (this.handXHistory.length > 0 && this.handXHistory[0].timeMs < minTimeMs) {
      this.handXHistory.shift()
    }
  }

  private detectSwipeAction(lane: HitAction): HitAction | null {
    if (this.handXHistory.length < 2) return null

    const earliest = this.handXHistory[0]
    const latest = this.handXHistory[this.handXHistory.length - 1]
    const deltaX = latest.x - earliest.x
    const deltaY = latest.y - earliest.y
    const movementDistance = Math.hypot(deltaX, deltaY)
    if (movementDistance < Math.max(WEBCAM_SWIPE_MIN_DELTA_X, WEBCAM_SWIPE_JITTER_DEADZONE_X)) return null

    // Rearm by collapsing to newest sample so one swipe does not repeatedly fire.
    this.handXHistory = [{ x: latest.x, y: latest.y, timeMs: latest.timeMs }]
    return lane
  }

  private emitHitIfReady(action: HitAction, nowMs: number): void {
    if (nowMs - this.lastWebcamHitAtMs < WEBCAM_HIT_COOLDOWN_MS) {
      return
    }

    this.lastWebcamHitAtMs = nowMs
    this.pendingHit = {
      action,
      source: 'webcam',
      timestampMs: nowMs,
    }
  }

  private getModelAssetPath(): string {
    if (!USE_LOCAL_HAND_LANDMARKER_MODEL) {
      return DEFAULT_HAND_LANDMARKER_MODEL_URL
    }
    return `${import.meta.env.BASE_URL}${LOCAL_HAND_LANDMARKER_MODEL_PATH}`
  }

  private createDebugOverlay(): void {
    const appRoot = document.getElementById('app')
    if (!appRoot) return

    this.overlayRoot = document.createElement('div')
    this.overlayRoot.className = 'mp-webcam-overlay'
    if (!SHOW_WEBCAM_DEBUG_OVERLAY) {
      this.overlayRoot.classList.add('is-hidden')
    }

    const video = document.createElement('video')
    video.className = 'mp-webcam-video'
    video.autoplay = true
    video.muted = true
    video.playsInline = true
    if (MIRROR_WEBCAM_INPUT) {
      video.classList.add('is-mirrored')
    }
    this.videoEl = video

    const laneLabel = document.createElement('div')
    laneLabel.className = 'mp-webcam-lane'
    laneLabel.textContent = 'HAND: INIT...'
    this.laneLabelEl = laneLabel

    this.overlayRoot.append(video, laneLabel)
    appRoot.appendChild(this.overlayRoot)
  }

  private updateDebugLabel(label: string): void {
    if (!this.laneLabelEl) return
    this.laneLabelEl.textContent = `HAND: ${label}`
  }

  private disableController(message: string, error?: unknown): void {
    this.disabled = true
    this.initialized = false
    this.updateDebugLabel('NO HAND')
    this.resetMotionWindow()
    this.stopWebcam()

    if (error) {
      console.warn(`[MediaPipeHandInput] ${message}`, error)
      return
    }
    console.warn(`[MediaPipeHandInput] ${message}`)
  }

  private stopWebcam(): void {
    if (this.videoEl) {
      this.videoEl.pause()
      this.videoEl.srcObject = null
    }

    if (this.webcamStream) {
      for (const track of this.webcamStream.getTracks()) {
        track.stop()
      }
      this.webcamStream = null
    }
  }

  private resetMotionWindow(): void {
    this.handXHistory = []
  }
}
