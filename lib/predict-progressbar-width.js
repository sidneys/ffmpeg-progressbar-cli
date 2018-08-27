'use strict'


/**
 * Modules
 * External
 * @constant
 */
const windowSize = require('window-size')


/**
 * Calculate the progress bars' text components width (fixed width)
 * @param {Number} targetFilenameLength - Target filename length
 * @returns {Number} - String length
 *
 * @private
 */
let predictTextWidth = (targetFilenameLength) => {
    // console.debug('predictTextWidth()')

    // TEXT LABEL                                               WIDTH
    // 🎬 Rendering                                             12
    // BAR_FILENAME_LENGTH                                      10
    //  |  {percentagePad}% | ETA {etaTimecode}                 20

    const barTextWidth = 12 + targetFilenameLength + 20

    const correctionFactor = 4

    return barTextWidth - correctionFactor
}

/**
 * Calculate the progress bars' beam width (variable width)
 * @param {Number} targetFilenameLength - Target filename length
 * @param {Number} targetBarBeamRatio - Target bar beam ratio
 * @returns {Number} - String length
 *
 * @private
 */
let predictBeamWidth = (targetFilenameLength, targetBarBeamRatio) => {
    // console.debug('predictBeamWidth()')

    const barBeamWidth = (windowSize.get().width - predictTextWidth(targetFilenameLength)) * targetBarBeamRatio

    return Math.floor(barBeamWidth)
}

/**
 * Calculate the progress bars' beam total width
 * @param {Number} targetFilenameLength - Target filename length
 * @param {Number} targetBarBeamRatio - Target bar beam ratio
 * @returns {Number} - String length
 */
let predictTotalWidth = (targetFilenameLength, targetBarBeamRatio) => {
    // console.debug('approximateBarWidth()')

    return predictTextWidth(targetFilenameLength) + predictBeamWidth(targetFilenameLength, targetBarBeamRatio)
}


/**
 * @module predict-progressbar-width.js
 */
module.exports = {
    beam: predictBeamWidth,
    text: predictTextWidth,
    total: predictTotalWidth
}

