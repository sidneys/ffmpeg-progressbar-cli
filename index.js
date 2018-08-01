#!/usr/bin/env node
'use strict'

/**
 * Modules
 * Node
 * @constant
 */
const childProcess = require('child_process')

/**
 * Modules
 * External
 * @constant
 */
const cliProgress = require('cli-progress')
const ini = require('ini')
//const console = require('@sidneys/console')({ write: false })
const moment = require('moment')
const momentDurationFormat = require('moment-duration-format')
const which = require('which')
const windowSize = require('window-size')

/**
 * Timecode format
 * @constant
 * @default
 */
const defaultTimecodeFormat = 'HH:mm:ss.SSS'


/**
 * Filesystem
 * @constant
 */
const ffmpegFilepath = which.sync('ffmpeg')

/**
 * Arguments
 * @constant
 */
const ffmpegUserArgsList = process.argv.slice(2)
const ffmpegPreTaskArgsList = ['-y', ...ffmpegUserArgsList]
const ffmpegMainTaskArgsList = ['-y', '-loglevel', 'quiet', '-progress', 'pipe:1', ...ffmpegUserArgsList]


/**
 * Progress Bar
 * @type {Object}
 */
const progressBar = new cliProgress.Bar({
    format: '[{bar}] {percentage}% | ETA {eta}s | Total {duration_formatted}',
    fps: 10,
    stream: process.stdout,
    barsize: parseInt(((windowSize.get()).width) * 0.5)
}, cliProgress.Presets.shades_classic)


/**
 * parseFFmpegDuration
 * @param {String} text - FFmpeg Log Output
 */
let parseFFmpegDuration = (text) => {
    // console.debug('parseFFmpegDuration()')

    const durationList = text.match(/Duration: (.{2}):(.{2}):(.{2}).(.{2})/)

    if (!durationList) { return }
 
    // Grep
    const timecode = `${durationList[1]}:${durationList[2]}:${durationList[3]}.${durationList[4].padEnd(3, 0)}`

    // Format
    const timecodeMoment = moment.duration(timecode)
    const milliseconds = timecodeMoment.asMilliseconds()

    return milliseconds.toFixed(3)
}

/**
 * Primary Task
 * @param {Number} durationMilliseconds - Ms
 */
let startPrimaryTask = (durationMilliseconds) => {
    // console.debug('startPrimaryTask()')

    progressBar.start(durationMilliseconds, 0)

    const mainTask = childProcess.spawn(ffmpegFilepath, ffmpegMainTaskArgsList)

    mainTask.stdout.on('data', (data) => {
        data = data.toString()

        const progress = ini.decode(data)
        const currentMicroseconds = Number(progress.out_time_ms)

        // Format
        const currentMilliseconds = (currentMicroseconds / 1000).toFixed(3)
        const fraction = (currentMilliseconds / durationMilliseconds)
        const percentage = `${(fraction * 100).toFixed(1)} %`

        progressBar.update(currentMilliseconds)
    })
 
    mainTask.stderr.on('data', (data) => {
        console.error(data.toString())
    })

    mainTask.on('close', (code) => process.exit(code))
}

/**
 * Preparation Task
 */
let startPreparationTask = () => {
    // console.debug('startPreparationTask()')   

    const preTask = childProcess.execFile(ffmpegFilepath, ffmpegPreTaskArgsList)

    let onData = (data) => {
        if (parseFFmpegDuration(data.toString())) {
            preTask.kill('SIGKILL')
            startPrimaryTask(parseFFmpegDuration(data.toString())) 
        }
    }

    preTask.stdout.on('data', onData)
    preTask.stderr.on('data', (data) => {
        //console.error(data.toString())
        onData(data)
    })
    preTask.on('close', (data) => {
        //console.debug('close')
    })
}


/**
 * Main
 */
if (require.main === module) {
    startPreparationTask()
}
