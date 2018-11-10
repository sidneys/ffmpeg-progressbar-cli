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
const CliProgress = require('@sidneys/cli-progress')
const moment = require('moment')
/* eslint-disable no-unused-vars */
const momentDurationFormat = require('moment-duration-format')
/* eslint-enable */

/**
 * Modules
 * Internal
 * @constant
 */
const formatter = require('./formatter')
const theme = require('./theme')

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
 * @param {Object=} options - Options
 * @returns {CliProgress.Bar} - progressBar
 */
let createBar = (options) => {
    // console.debug('createProgressbar')

    const baseOptions = {
        format: `🎞  ${theme.filenameLabel('Rendering')} ${theme.filename('{filename}')} | ${theme.beam('{bar}')} ${theme.percentage('{percentagePad}%')} | ${theme.etaLabel('ETA')} ${theme.eta('{etaTimecode}')}`,
        fps: 20,
        barsize: 60,
        barCompleteChar: '\u2593',
        barIncompleteChar: '\u2591',
        etaBuffer: 64,
        hideCursor: true,
        stream: process.stdout,
        align: 'center',
        stopOnComplete: true,
        clearOnComplete: false
    }

    const finalOptions = Object.assign(baseOptions, options)

    // DEBUG
    // console.debug('configuration', require('util').inspect(finalOptions, /** @type {InspectOptions} */ { showHidden: true, colors: true, compact: true }))

    return new CliProgress.Bar(finalOptions)
}

/**
 * Wrapper for progressBar.start
 * @param {Number} totalValue - Total value
 * @param {Object=} payload - Extra Payload
 * @param {String=} annotation - Annotation
 * @public
 */
let startBar = (totalValue, payload, annotation) => {
    // console.debug('startProgressbar')

    const startPayload = {
        etaTimecode: convertSecondsToTimecode(0),
        percentagePad: '00'
    }

    const finalPayload = Object.assign(startPayload, payload)

    // DEBUG
    // console.debug('startBar', 'payload', require('util').inspect(finalPayload, /** @type {InspectOptions} */ { showHidden: true, colors: true, compact: true }))

    progressBar.start(totalValue, 0, finalPayload, annotation)
}

/**
 *  Wrapper for progressBar.update
 * @param {Number} currentValue - Current value
 * @param {Object=} payload - Payload
 * @param {String=} annotation - Annotation
 * @public
 */
let updateBar = (currentValue, payload, annotation) => {
    // console.debug('updateProgressbar')

    const updatePayload = {
        percentagePad: formatter.fractionToPercentage(progressBar.value / progressBar.total, ' '),
        etaTimecode: convertSecondsToTimecode(progressBar.eta.eta)
    }

    const finalPayload = Object.assign(updatePayload, payload)

    // DEBUG
    // console.debug('updateBar', 'payload', require('util').inspect(finalPayload, /** @type {InspectOptions} */ { showHidden: true, colors: true, compact: true }))

    progressBar.update(currentValue, finalPayload, annotation)
}

/**
 * @typedef {Object} progressBar
 * @extends {CliProgress}
 * @property {function} bar
 * @property {function} start
 * @property {function} update
 */

/**
 * @param {Object} options - Progress Bar options
 * @exports progressBar
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
