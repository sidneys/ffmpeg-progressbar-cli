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

/**
 * Modules
 * Internal
 * @constant
 */
const utilities = require('./utilities')


/**
 * Timecode format
 * @constant
 * @default
 */
const etaFormat = 'HH:mm:ss'

/**
 * Convert seconds into timecode format
 * @param {Number} seconds - Duration in seconds
 * @returns {String} - Timecode / HH:mm:ss
 */
let convertSecondsToTimecode = (seconds) => {
    // console.debug('convertSecondsToTimecode')

    return moment.duration(seconds, 'seconds').format(etaFormat, { trim: false })
}

/**
 * Progress Bar Singleton
 * @external {CliProgress.Bar}
 */
let progressBar

/**
 * Wrapper for progressBar constructor
 * @param {Object=} userOptions - Options
 * @returns {CliProgress.Bar} - progressBar
 */
let createBar = (userOptions) => {
    // console.debug('createProgressbar')

    const baseOptions = {
        format: `🎬 ${colors.grey('Rendering')} ${colors.green.bold('{filename}')} ${colors.white.bold('|')} ${colors.blue('{bar}')} ${colors.blue.bold('{percentagePad}%')} ${colors.white.bold('|')} ${colors.grey('ETA')} ${colors.red.bold('{etaTimecode}')}`,
        fps: 20,
        barsize: 60,
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        etaBuffer: 64,
        hideCursor: true,
        stream: process.stdout,
        align: 'center',
        stopOnComplete: true,
        clearOnComplete: false
    }

    const options = Object.assign(baseOptions, userOptions)

    // DEBUG
    // console.debug('configuration', require('util').inspect(configuration, /** @type {InspectOptions} */ { showHidden: true, colors: true, compact: true }))

    return new CliProgress.Bar(options)
}

/**
 * Wrapper for progressBar.start
 * @param {Number} totalValue - Total value
 * @param {Object=} extraPayload - Extra Payload
 * @public
 */
let startBar = (totalValue, extraPayload) => {
    // console.debug('startProgressbar')

    const startPayload = {
        etaTimecode: convertSecondsToTimecode(0),
        percentagePad: '00'
    }

    const payload = Object.assign(startPayload, extraPayload)

    // DEBUG
    // console.debug('startBar', 'payload', require('util').inspect(payload, /** @type {InspectOptions} */ { showHidden: true, colors: true, compact: true }))

    progressBar.start(totalValue, 0, payload)
}

/**
 *  Wrapper for progressBar.update
 * @param {Number} currentValue - Current value
 * @param {Object=} extraPayload - Extra Payload
 * @public
 */
let updateBar = (currentValue, extraPayload) => {
    // console.debug('updateProgressbar')

    const updatePayload = {
        percentagePad: utilities.fractionToPercentagePad(progressBar.value / progressBar.total),
        etaTimecode: convertSecondsToTimecode(progressBar.eta.eta)
    }

    const payload = Object.assign(updatePayload, extraPayload)

    // DEBUG
    // console.debug('updateBar', 'payload', require('util').inspect(payload, /** @type {InspectOptions} */ { showHidden: true, colors: true, compact: true }))

    progressBar.update(currentValue, payload)
}

/**
 * @param {Object} options - Progress Bar options
 * @exports progress-bar
 * @returns {Object}
 */
module.exports = (options) => {
    progressBar = createBar(options)

    return {
        bar: progressBar,
        start: startBar,
        update: updateBar
    }
}
