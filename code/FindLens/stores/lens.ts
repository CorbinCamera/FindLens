import { defineStore } from 'pinia'
import {
  computeSensorFromPixel,
  computeAllFOV,
  computeCoverage,
  computeProportion,
  computePixelCoverage,
  computeFocalLengthForFullFrame,
  computeFocalLengthFromProportion,
  recommendFocalLength,
  DEFAULT_TARGET,
  DEFAULT_CAMERA_HEIGHT,
  DEFAULT_CAMERA_PITCH,
  CAMERA_PITCH_MIN,
  CAMERA_PITCH_MAX,
  STANDARD_FOCAL_LENGTHS,
  SENSOR_PRESETS,
  DISTANCE_MIN,
  DISTANCE_MAX,
  FOCAL_LENGTH_MIN,
  FOCAL_LENGTH_MAX,
  PROPORTION_MIN,
  PROPORTION_MAX,
  type SensorParams,
  type TargetParams
} from '~/core/optics'

export type InputMode = 'manual' | 'pixel'
export type CalculateMode = 'forward' | 'reverse-full' | 'reverse-proportion'

export const useLensStore = defineStore('lens', {
  state: () => ({
    inputMode: 'pixel' as InputMode,
    calculateMode: 'forward' as CalculateMode,
    selectedPresetIndex: 0,
    sensorWidth: 6.4512,
    sensorHeight: 5.3088,
    resolutionX: 3840,
    resolutionY: 3160,
    pixelSize: 1.68,
    focalLength: 12,
    target: { ...DEFAULT_TARGET },
    cameraHeight: DEFAULT_CAMERA_HEIGHT,
    cameraPitch: DEFAULT_CAMERA_PITCH,
    distance: 5,
    reverseProportion: 0.79,
    standardFocalLengths: [...STANDARD_FOCAL_LENGTHS]
  }),

  getters: {
    effectiveSensor(state): SensorParams {
      if (state.inputMode === 'pixel') {
        const computed = computeSensorFromPixel(state.resolutionX, state.resolutionY, state.pixelSize)
        return {
          width: computed.width,
          height: computed.height,
          resolutionX: state.resolutionX,
          resolutionY: state.resolutionY,
          pixelSize: state.pixelSize
        }
      }
      return {
        width: state.sensorWidth,
        height: state.sensorHeight
      }
    },

    fov(): { horizontalFOV: number; verticalFOV: number; diagonalFOV: number } {
      const s = this.effectiveSensor
      return computeAllFOV(s, this.focalLength)
    },

    coverage(): { horizontalRange: number; verticalRange: number } {
      return computeCoverage(this.distance, this.effectiveSensor, this.focalLength)
    },

    proportion(): { widthProportion: number; heightProportion: number } {
      return computeProportion(this.target, this.distance, this.effectiveSensor, this.focalLength)
    },

    pixelCoverage(): { widthPixels: number | null; heightPixels: number | null } {
      return computePixelCoverage(this.target, this.distance, this.effectiveSensor, this.focalLength)
    },

    reverseTheoryFL(): number {
      const s = this.effectiveSensor
      if (this.calculateMode === 'reverse-full') {
        return computeFocalLengthForFullFrame(this.distance, s.height, this.target.height)
      } else {
        return computeFocalLengthFromProportion(
          this.distance,
          s.height,
          this.target.height,
          this.reverseProportion
        )
      }
    },

    recommendation(): ReturnType<typeof recommendFocalLength> {
      return recommendFocalLength(this.reverseTheoryFL, this.distance, this.effectiveSensor, this.target)
    },

    allStandardResults(): Array<{
      focalLength: number
      coverage: { horizontalRange: number; verticalRange: number }
      proportion: { widthProportion: number; heightProportion: number }
      canFitFully: boolean
    }> {
      const s = this.effectiveSensor
      return this.standardFocalLengths.map(fl => ({
        focalLength: fl,
        coverage: computeCoverage(this.distance, s, fl),
        proportion: computeProportion(this.target, this.distance, s, fl),
        canFitFully:
          computeProportion(this.target, this.distance, s, fl).heightProportion <= 1 &&
          computeProportion(this.target, this.distance, s, fl).widthProportion <= 1
      }))
    },

    shareUrl(): string {
      const params = new URLSearchParams()
      const s = this.effectiveSensor
      params.set('sw', s.width.toString())
      params.set('sh', s.height.toString())
      if (s.resolutionX) params.set('rx', s.resolutionX.toString())
      if (s.resolutionY) params.set('ry', s.resolutionY.toString())
      if (s.pixelSize) params.set('ps', s.pixelSize!.toString())
      params.set('fl', this.focalLength.toString())
      params.set('th', this.target.height.toString())
      params.set('tw', this.target.width.toString())
      params.set('td', this.target.depth.toString())
      params.set('ch', this.cameraHeight.toString())
      params.set('cp', this.cameraPitch.toString())
      params.set('dist', this.distance.toString())
      params.set('mode', this.calculateMode)
      if (this.calculateMode === 'reverse-proportion') {
        params.set('rp', this.reverseProportion.toString())
      }
      return `?${params.toString()}`
    }
  },

  actions: {
    loadFromUrl() {
      if (import.meta.client) {
        const params = new URLSearchParams(window.location.search)
        const parseNum = (v: string | null, min: number, max: number, fallback: number) => {
          if (v === null) return fallback
          const n = parseFloat(v)
          return isNaN(n) || n < min || n > max ? fallback : n
        }
        const parseIntSafe = (v: string | null, min: number, max: number, fallback: number) => {
          if (v === null) return fallback
          const n = parseInt(v, 10)
          return isNaN(n) || n < min || n > max ? fallback : n
        }
        if (params.has('sw')) this.sensorWidth = parseNum(params.get('sw'), 0.1, 100, this.sensorWidth)
        if (params.has('sh')) this.sensorHeight = parseNum(params.get('sh'), 0.1, 100, this.sensorHeight)
        if (params.has('rx')) this.resolutionX = parseIntSafe(params.get('rx'), 1, 50000, this.resolutionX)
        if (params.has('ry')) this.resolutionY = parseIntSafe(params.get('ry'), 1, 50000, this.resolutionY)
        if (params.has('ps')) this.pixelSize = parseNum(params.get('ps'), 0.1, 100, this.pixelSize)
        if (params.has('fl')) this.focalLength = parseNum(params.get('fl'), FOCAL_LENGTH_MIN, FOCAL_LENGTH_MAX, this.focalLength)
        if (params.has('th')) this.target.height = parseNum(params.get('th'), 0.1, 10, this.target.height)
        if (params.has('tw')) this.target.width = parseNum(params.get('tw'), 0.05, 5, this.target.width)
        if (params.has('td')) this.target.depth = parseNum(params.get('td'), 0.05, 5, this.target.depth)
        if (params.has('ch')) this.cameraHeight = parseNum(params.get('ch'), 0.1, 10, DEFAULT_CAMERA_HEIGHT)
        if (params.has('cp')) this.cameraPitch = parseNum(params.get('cp'), CAMERA_PITCH_MIN, CAMERA_PITCH_MAX, DEFAULT_CAMERA_PITCH)
        if (params.has('dist')) this.distance = parseNum(params.get('dist'), DISTANCE_MIN, DISTANCE_MAX, this.distance)
        if (params.has('mode')) {
          const mode = params.get('mode')!
          if (['forward', 'reverse-full', 'reverse-proportion'].includes(mode)) {
            this.calculateMode = mode as CalculateMode
          }
        }
        if (params.has('rp')) this.reverseProportion = parseNum(params.get('rp'), PROPORTION_MIN, PROPORTION_MAX, this.reverseProportion)
      }
    },

    selectPreset(index: number) {
      this.selectedPresetIndex = index
      const preset = SENSOR_PRESETS[index]
      this.resolutionX = preset.resolutionX
      this.resolutionY = preset.resolutionY
      this.pixelSize = preset.pixelSize
      this.inputMode = 'pixel'
    },

    setDistance(d: number) {
      this.distance = Math.max(DISTANCE_MIN, Math.min(DISTANCE_MAX, d))
    },

    setFocalLength(fl: number) {
      this.focalLength = Math.max(FOCAL_LENGTH_MIN, Math.min(FOCAL_LENGTH_MAX, fl))
    },

    setCameraPitch(p: number) {
      this.cameraPitch = Math.max(CAMERA_PITCH_MIN, Math.min(CAMERA_PITCH_MAX, p))
    },

    setTargetFromPreset() {
      this.target = { ...DEFAULT_TARGET }
    },

    resetAll() {
      this.target = { ...DEFAULT_TARGET }
      this.cameraHeight = DEFAULT_CAMERA_HEIGHT
      this.cameraPitch = DEFAULT_CAMERA_PITCH
      this.distance = 5
      this.focalLength = 12
    }
  }
})