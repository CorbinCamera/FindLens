import { describe, it, expect } from 'vitest'
import {
  computeSensorFromPixel,
  computeHorizontalFOV,
  computeVerticalFOV,
  computeDiagonalFOV,
  computeAllFOV,
  computeCoverage,
  computeProportion,
  computePixelCoverage,
  computeFocalLengthFromCoverage,
  computeFocalLengthFromProportion,
  computeFocalLengthForFullFrame,
  recommendFocalLength,
  SENSOR_PRESETS,
  DEFAULT_TARGET,
  STANDARD_FOCAL_LENGTHS
} from './optics'

describe('computeSensorFromPixel', () => {
  it('computes sensor size from resolution and pixel size', () => {
    const result = computeSensorFromPixel(3840, 3160, 1.68)
    expect(result.width).toBeCloseTo(6.4512, 3)
    expect(result.height).toBeCloseTo(5.3088, 3)
  })

  it('computes sensor size for different pixel sizes', () => {
    const result = computeSensorFromPixel(1920, 1080, 3.45)
    expect(result.width).toBeCloseTo(6.624, 3)
    expect(result.height).toBeCloseTo(3.726, 3)
  })
})

describe('computeHorizontalFOV', () => {
  it('computes horizontal FOV correctly', () => {
    const fov = computeHorizontalFOV(6.4512, 12)
    expect(fov).toBeCloseTo(30.09, 1)
  })
})

describe('computeVerticalFOV', () => {
  it('computes vertical FOV correctly', () => {
    const fov = computeVerticalFOV(5.3088, 12)
    expect(fov).toBeCloseTo(24.94, 1)
  })
})

describe('computeDiagonalFOV', () => {
  it('computes diagonal FOV correctly', () => {
    const sensor = SENSOR_PRESETS[0]
    const fov = computeDiagonalFOV(sensor.width, sensor.height, 12)
    expect(fov).toBeGreaterThan(30)
    expect(fov).toBeLessThan(45)
  })
})

describe('computeAllFOV', () => {
  it('computes all FOV angles', () => {
    const sensor = { width: 6.4512, height: 5.3088 }
    const result = computeAllFOV(sensor, 12)
    expect(result.horizontalFOV).toBeCloseTo(30.09, 1)
    expect(result.verticalFOV).toBeCloseTo(24.94, 1)
    expect(result.diagonalFOV).toBeGreaterThan(result.horizontalFOV)
  })
})

describe('computeCoverage', () => {
  it('computes coverage at a given distance', () => {
    const sensor = { width: 6.4512, height: 5.3088 }
    const result = computeCoverage(5, sensor, 12)
    expect(result.horizontalRange).toBeCloseTo(2.69, 2)
    expect(result.verticalRange).toBeCloseTo(2.21, 2)
  })

  it('coverage increases with distance', () => {
    const sensor = { width: 6.4512, height: 5.3088 }
    const cov5 = computeCoverage(5, sensor, 12)
    const cov10 = computeCoverage(10, sensor, 12)
    expect(cov10.horizontalRange).toBeCloseTo(2 * cov5.horizontalRange, 2)
    expect(cov10.verticalRange).toBeCloseTo(2 * cov5.verticalRange, 2)
  })
})

describe('computeProportion', () => {
  it('computes target proportion in frame', () => {
    const sensor = { width: 6.4512, height: 5.3088 }
    const target = DEFAULT_TARGET
    const result = computeProportion(target, 5, sensor, 12)
    expect(result.widthProportion).toBeLessThan(1)
    expect(result.heightProportion).toBeLessThan(1)
  })
})

describe('computePixelCoverage', () => {
  it('computes pixel coverage when resolution is available', () => {
    const sensor = { width: 6.4512, height: 5.3088, resolutionX: 3840, resolutionY: 3160 }
    const target = DEFAULT_TARGET
    const result = computePixelCoverage(target, 5, sensor, 12)
    expect(result.widthPixels).toBeGreaterThan(0)
    expect(result.heightPixels).toBeGreaterThan(0)
  })

  it('returns null when resolution is not available', () => {
    const sensor = { width: 6.4512, height: 5.3088 }
    const result = computePixelCoverage(DEFAULT_TARGET, 5, sensor, 12)
    expect(result.widthPixels).toBeNull()
    expect(result.heightPixels).toBeNull()
  })
})

describe('computeFocalLengthFromCoverage', () => {
  it('computes focal length from desired horizontal coverage', () => {
    const fl = computeFocalLengthFromCoverage(5, 6.4512, 2.69)
    expect(fl).toBeCloseTo(12.0, 0)
  })
})

describe('computeFocalLengthFromProportion', () => {
  it('computes focal length for desired proportion', () => {
    const fl = computeFocalLengthFromProportion(5, 5.3088, 1.70, 0.79)
    expect(fl).toBeGreaterThan(10)
    expect(fl).toBeLessThan(20)
  })
})

describe('computeFocalLengthForFullFrame', () => {
  it('computes focal length for full target in frame', () => {
    const fl = computeFocalLengthForFullFrame(5, 5.3088, 1.70)
    expect(fl).toBeCloseTo(15.6, 0)
  })
})

describe('recommendFocalLength', () => {
  it('recommends the nearest standard focal length >= theory', () => {
    const sensor = { width: 6.4512, height: 5.3088, resolutionX: 3840, resolutionY: 3160 }
    const theoryFL = computeFocalLengthForFullFrame(5, 5.3088, 1.70)
    const result = recommendFocalLength(theoryFL, 5, sensor, DEFAULT_TARGET)
    expect(result.theoryFocalLength).toBeCloseTo(15.6, 0)
    expect(STANDARD_FOCAL_LENGTHS).toContain(result.recommendedFocalLength)
    expect(result.recommendedFocalLength).toBeGreaterThanOrEqual(theoryFL)
  })

  it('theory FL above all standards still maps to last standard', () => {
    const sensor = { width: 6.4512, height: 5.3088 }
    const result = recommendFocalLength(100, 5, sensor, DEFAULT_TARGET)
    expect(result.recommendedFocalLength).toBe(50)
  })

  it('theory FL below all standards maps to first standard', () => {
    const sensor = { width: 6.4512, height: 5.3088 }
    const result = recommendFocalLength(3, 5, sensor, DEFAULT_TARGET)
    expect(result.recommendedFocalLength).toBe(6)
  })

  it('marks canFitFully correctly when recommended >= theory', () => {
    const sensor = { width: 6.4512, height: 5.3088 }
    const result = recommendFocalLength(12, 5, sensor, DEFAULT_TARGET)
    expect(result.canFitFully).toBe(true)
  })
})

describe('SENSOR_PRESETS', () => {
  it('has at least 2 presets', () => {
    expect(SENSOR_PRESETS.length).toBeGreaterThanOrEqual(2)
  })

  it('each preset has valid pixel-derived dimensions', () => {
    for (const p of SENSOR_PRESETS) {
      const computed = computeSensorFromPixel(p.resolutionX, p.resolutionY, p.pixelSize)
      expect(computed.width).toBeCloseTo(p.width, 3)
      expect(computed.height).toBeCloseTo(p.height, 3)
    }
  })
})