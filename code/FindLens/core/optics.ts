export interface SensorParams {
  width: number
  height: number
  resolutionX?: number
  resolutionY?: number
  pixelSize?: number
}

export interface LensParams {
  focalLength: number
}

export interface TargetParams {
  height: number
  width: number
  depth: number
}

export const DEFAULT_TARGET: TargetParams = {
  height: 1.70,
  width: 0.45,
  depth: 0.25
}

export const DEFAULT_CAMERA_HEIGHT = 1.5

export const DEFAULT_CAMERA_PITCH = 0

export const CAMERA_PITCH_MIN = -60
export const CAMERA_PITCH_MAX = 60

export const STANDARD_FOCAL_LENGTHS = [6, 8, 12, 16, 25, 35, 50] as const

export const SENSOR_PRESETS: Array<{
  name: string
  width: number
  height: number
  resolutionX: number
  resolutionY: number
  pixelSize: number
}> = [
  {
    name: '1/2" IMX226',
    width: 6.4512,
    height: 5.3088,
    resolutionX: 3840,
    resolutionY: 3160,
    pixelSize: 1.68
  },
  {
    name: '2/3" IMX264',
    width: 8.80,
    height: 6.60,
    resolutionX: 4400,
    resolutionY: 3300,
    pixelSize: 2.0
  },
  {
    name: '1" IMX183',
    width: 13.1328,
    height: 8.7552,
    resolutionX: 5472,
    resolutionY: 3648,
    pixelSize: 2.4
  }
]

const DEG_PER_RAD = 180 / Math.PI

export function atan2deg(value: number): number {
  return Math.atan(value) * DEG_PER_RAD
}

export function deg2rad(deg: number): number {
  return deg * Math.PI / 180
}

export function computeSensorFromPixel(
  resolutionX: number,
  resolutionY: number,
  pixelSize: number
): { width: number; height: number } {
  return {
    width: resolutionX * pixelSize / 1000,
    height: resolutionY * pixelSize / 1000
  }
}

export function computeHorizontalFOV(sensorWidth: number, focalLength: number): number {
  return 2 * atan2deg(sensorWidth / (2 * focalLength))
}

export function computeVerticalFOV(sensorHeight: number, focalLength: number): number {
  return 2 * atan2deg(sensorHeight / (2 * focalLength))
}

export function computeDiagonalFOV(sensorWidth: number, sensorHeight: number, focalLength: number): number {
  const diagonal = Math.sqrt(sensorWidth * sensorWidth + sensorHeight * sensorHeight)
  return 2 * atan2deg(diagonal / (2 * focalLength))
}

export interface FOVResult {
  horizontalFOV: number
  verticalFOV: number
  diagonalFOV: number
}

export function computeAllFOV(sensor: SensorParams, focalLength: number): FOVResult {
  return {
    horizontalFOV: computeHorizontalFOV(sensor.width, focalLength),
    verticalFOV: computeVerticalFOV(sensor.height, focalLength),
    diagonalFOV: computeDiagonalFOV(sensor.width, sensor.height, focalLength)
  }
}

export interface CoverageResult {
  horizontalRange: number
  verticalRange: number
}

export function computeCoverage(distance: number, sensor: SensorParams, focalLength: number): CoverageResult {
  const hFOV = computeHorizontalFOV(sensor.width, focalLength)
  const vFOV = computeVerticalFOV(sensor.height, focalLength)
  return {
    horizontalRange: 2 * distance * Math.tan(deg2rad(hFOV / 2)),
    verticalRange: 2 * distance * Math.tan(deg2rad(vFOV / 2))
  }
}

export interface ProportionResult {
  widthProportion: number
  heightProportion: number
}

export function computeProportion(
  target: TargetParams,
  distance: number,
  sensor: SensorParams,
  focalLength: number
): ProportionResult {
  const coverage = computeCoverage(distance, sensor, focalLength)
  return {
    widthProportion: target.width / coverage.horizontalRange,
    heightProportion: target.height / coverage.verticalRange
  }
}

export interface PixelCoverageResult {
  widthPixels: number | null
  heightPixels: number | null
}

export function computePixelCoverage(
  target: TargetParams,
  distance: number,
  sensor: SensorParams,
  focalLength: number
): PixelCoverageResult {
  if (!sensor.resolutionX || !sensor.resolutionY) {
    return { widthPixels: null, heightPixels: null }
  }
  const proportion = computeProportion(target, distance, sensor, focalLength)
  return {
    widthPixels: Math.round(proportion.widthProportion * sensor.resolutionX),
    heightPixels: Math.round(proportion.heightProportion * sensor.resolutionY)
  }
}

export function computeFocalLengthFromCoverage(
  distance: number,
  sensorWidth: number,
  targetHorizontalRange: number
): number {
  return distance * sensorWidth / targetHorizontalRange
}

export function computeFocalLengthFromProportion(
  distance: number,
  sensorSize: number,
  targetSize: number,
  targetProportion: number
): number {
  return distance * sensorSize / (targetSize / targetProportion)
}

export function computeFocalLengthForFullFrame(
  distance: number,
  sensorSize: number,
  targetSize: number
): number {
  return distance * sensorSize / targetSize
}

export interface RecommendationResult {
  theoryFocalLength: number
  recommendedFocalLength: number
  actualCoverage: CoverageResult
  actualProportion: ProportionResult
  canFitFully: boolean
}

export function recommendFocalLength(
  theoryFL: number,
  distance: number,
  sensor: SensorParams,
  target: TargetParams
): RecommendationResult {
  const standardList = [...STANDARD_FOCAL_LENGTHS]
  let recommended = standardList[0]
  for (const fl of standardList) {
    if (fl >= theoryFL) {
      recommended = fl
      break
    }
    recommended = fl
  }
  const actualCoverage = computeCoverage(distance, sensor, recommended)
  const actualProportion = computeProportion(target, distance, sensor, recommended)
  const canFitFully = actualProportion.heightProportion <= 1 && actualProportion.widthProportion <= 1

  return {
    theoryFocalLength: Math.round(theoryFL * 10) / 10,
    recommendedFocalLength: recommended,
    actualCoverage,
    actualProportion,
    canFitFully
  }
}

export const DISTANCE_MIN = 0.5
export const DISTANCE_MAX = 50
export const FOCAL_LENGTH_MIN = 1
export const FOCAL_LENGTH_MAX = 300
export const PROPORTION_MIN = 0.1
export const PROPORTION_MAX = 1.0