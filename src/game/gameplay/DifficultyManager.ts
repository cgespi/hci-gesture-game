export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export interface DifficultyConfig {
  startingLaunchSpeed: number
  startingLaunchDelay: number
  streakThreshold: number
  difficultyGrowth: number
  minLaunchDelay: number
  maxLaunchDelay: number
  minLaunchSpeed: number
  maxLaunchSpeed: number
}

export interface DifficultySnapshot {
  currentDifficultyLevel: DifficultyLevel
  currentLaunchSpeed: number
  currentLaunchDelay: number
  hitStreak: number
  missCount: number
  streakThreshold: number
  difficultyGrowth: number
}

const DIFFICULTY_PRESETS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    startingLaunchSpeed: 0.85,
    startingLaunchDelay: 1250,
    streakThreshold: 6,
    difficultyGrowth: 0.1,
    minLaunchDelay: 450,
    maxLaunchDelay: 1600,
    minLaunchSpeed: 0.65,
    maxLaunchSpeed: 2.1,
  },
  medium: {
    startingLaunchSpeed: 1,
    startingLaunchDelay: 900,
    streakThreshold: 4,
    difficultyGrowth: 0.1,
    minLaunchDelay: 350,
    maxLaunchDelay: 1400,
    minLaunchSpeed: 0.7,
    maxLaunchSpeed: 2.4,
  },
  hard: {
    startingLaunchSpeed: 1.2,
    startingLaunchDelay: 650,
    streakThreshold: 3,
    difficultyGrowth: 0.11,
    minLaunchDelay: 280,
    maxLaunchDelay: 1100,
    minLaunchSpeed: 0.8,
    maxLaunchSpeed: 2.7,
  },
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Keeps dynamic difficulty logic isolated from GameScene state transitions.
 */
export class DifficultyManager {
  private currentDifficultyLevel: DifficultyLevel
  private config: DifficultyConfig
  private currentLaunchSpeed: number
  private currentLaunchDelay: number
  private hitStreak = 0
  private missCount = 0
  private streakThreshold: number
  private difficultyGrowth: number

  constructor(level: DifficultyLevel, overrides?: Partial<DifficultyConfig>) {
    this.currentDifficultyLevel = level
    this.config = this.mergeConfig(level, overrides)
    this.currentLaunchSpeed = this.config.startingLaunchSpeed
    this.currentLaunchDelay = this.config.startingLaunchDelay
    this.streakThreshold = this.config.streakThreshold
    this.difficultyGrowth = this.config.difficultyGrowth
  }

  updateOnHit(): void {
    this.hitStreak += 1
    if (this.hitStreak < this.streakThreshold) return

    this.currentLaunchSpeed = clamp(
      this.currentLaunchSpeed * (1 + this.difficultyGrowth),
      this.config.minLaunchSpeed,
      this.config.maxLaunchSpeed
    )
    this.currentLaunchDelay = clamp(
      this.currentLaunchDelay * (1 - this.difficultyGrowth),
      this.config.minLaunchDelay,
      this.config.maxLaunchDelay
    )
    this.hitStreak = 0
  }

  updateOnMiss(): void {
    this.hitStreak = 0
    this.missCount += 1

    this.currentLaunchSpeed = clamp(
      this.currentLaunchSpeed / (1 + this.difficultyGrowth),
      this.config.minLaunchSpeed,
      this.config.maxLaunchSpeed
    )
    this.currentLaunchDelay = clamp(
      this.currentLaunchDelay / (1 - this.difficultyGrowth),
      this.config.minLaunchDelay,
      this.config.maxLaunchDelay
    )
  }

  reset(level = this.currentDifficultyLevel, overrides?: Partial<DifficultyConfig>): void {
    this.currentDifficultyLevel = level
    this.config = this.mergeConfig(level, overrides)
    this.currentLaunchSpeed = this.config.startingLaunchSpeed
    this.currentLaunchDelay = this.config.startingLaunchDelay
    this.hitStreak = 0
    this.missCount = 0
    this.streakThreshold = this.config.streakThreshold
    this.difficultyGrowth = this.config.difficultyGrowth
  }

  getCurrentLaunchSpeed(): number {
    return this.currentLaunchSpeed
  }

  getCurrentLaunchDelayMs(): number {
    return this.currentLaunchDelay
  }

  getSnapshot(): DifficultySnapshot {
    return {
      currentDifficultyLevel: this.currentDifficultyLevel,
      currentLaunchSpeed: this.currentLaunchSpeed,
      currentLaunchDelay: this.currentLaunchDelay,
      hitStreak: this.hitStreak,
      missCount: this.missCount,
      streakThreshold: this.streakThreshold,
      difficultyGrowth: this.difficultyGrowth,
    }
  }

  private mergeConfig(level: DifficultyLevel, overrides?: Partial<DifficultyConfig>): DifficultyConfig {
    const base = DIFFICULTY_PRESETS[level]
    const merged: DifficultyConfig = {
      ...base,
      ...overrides,
    }

    const growth = clamp(merged.difficultyGrowth, 0.01, 0.45)
    merged.difficultyGrowth = growth
    merged.streakThreshold = Math.max(1, Math.round(merged.streakThreshold))
    merged.minLaunchDelay = Math.max(1, merged.minLaunchDelay)
    merged.maxLaunchDelay = Math.max(merged.minLaunchDelay, merged.maxLaunchDelay)
    merged.minLaunchSpeed = Math.max(0.1, merged.minLaunchSpeed)
    merged.maxLaunchSpeed = Math.max(merged.minLaunchSpeed, merged.maxLaunchSpeed)
    merged.startingLaunchDelay = clamp(
      merged.startingLaunchDelay,
      merged.minLaunchDelay,
      merged.maxLaunchDelay
    )
    merged.startingLaunchSpeed = clamp(
      merged.startingLaunchSpeed,
      merged.minLaunchSpeed,
      merged.maxLaunchSpeed
    )

    return merged
  }
}
