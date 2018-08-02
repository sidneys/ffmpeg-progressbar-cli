'use strict'

/**
 * Modules
 * Node
 * @constant
 */
const path = require('path')

/**
 * Modules
 * External
 * @constant
 */
const appRootPath = require('app-root-path')
appRootPath.setPath(path.join(__dirname, '..'))
const CliProgress = require('cli-progress')
const colors = require('colors/safe')
const moment = require('moment')
/* eslint-disable no-unused-vars */
const momentDurationFormat = require('moment-duration-format')
/* eslint-enable */
const windowSize = require('window-size')

/**
 * Modules
 * Internal
 * @constant
 */
const utils = require(path.join(appRootPath.path, 'lib', 'utils'))


/**
 * Progressbar Width
 * @constant
 * @default
 */
const barWidth = Math.floor(windowSize.get().width * 0.35)

/**
 * Timecode format
 * @constant
 * @default
 */
const etaFormat = 'HH:mm:ss'

/**
 * Convert seconds into timecode format
 * @param {Number} seconds - Duration in seconds
 * @return {String} - Timecode / HH:mm:ss
 */
let convertSecondsToTimecode = (seconds) => {
    // console.debug('convertSecondsToTimecode')

    return moment.duration(seconds, 'seconds').format(etaFormat, { trim: false })
}

/**
 * Progress Bar
 * @type {Object}
 */
const progressBar = new CliProgress.Bar({
    format: `🎬 ${colors.grey('Rendering')} ${colors.green.bold('{label}')} ${colors.white.bold('|')} ${colors.blue('{bar}')}  ${colors.blue.bold('{percentagePad}%')} ${colors.white.bold('|')} ${colors.grey('ETA')} ${colors.red.bold('{etaTimecode}')}`,
    fps: 20,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    barsize: barWidth,
    etaBuffer: 64,
    hideCursor: true,
    stream: process.stdout,
    position: 'center',
    stopOnComplete: true,
    clearOnComplete: false
}, CliProgress.Presets.shades_grey)


/**
 * Start Progress Bar
 * @param {Number} totalValue - Progress Bar total value
 * @param {String} label - Progress Bar label
 * @public
 */
let startProgressbar = (totalValue, label) => {
    // console.debug('startProgressbar')

    progressBar.start(totalValue, 0, {
        etaTimecode: convertSecondsToTimecode(0),
        fractionToPercentagePadded: '00',
        label: label
    })
}

/**
 * Update Progress Bar
 * @param {Number} currentValue - Progress Bar current value
 * @public
 */
let updateProgressbar = (currentValue) => {
    // console.debug('updateProgressbar')

    progressBar.update(currentValue, {
        etaTimecode: convertSecondsToTimecode(progressBar.eta.eta),
        percentagePad: utils.fractionToPercentagePad(progressBar.value / progressBar.total)
    })
}


/**
 * @exports bar
 */
module.exports = {
    progressBar: progressBar,
    start: startProgressbar,
    stop: progressBar.stop,
    update: updateProgressbar
}
