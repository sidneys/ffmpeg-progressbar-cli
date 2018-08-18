#!/usr/bin/env node
'use strict'

/**
 * The maximum number of characters of the filename label displayed next to the progress bar beam.
 * @constant
 * @default
 */
const BAR_FILENAME_LENGTH = process.env.BAR_FILENAME_LENGTH || 20

/**
 * The share of (available) horizontal display real estate the progress bar beam should occupy.
 * @constant
 */
const BAR_BEAM_RATIO = process.env.BAR_SIZE_RATIO || 0.75


/**
 * Modules
 * Node
 * @constant
 */
const childProcess = require('child_process')
const os = require('os')
const path = require('path')

/**
 * Modules
 * External
 * @constant
 */
const appRootPath = require('app-root-path')
appRootPath.setPath(path.join(__dirname, '..'))
const ellipsize = require('ellipsize')
const ini = require('ini')
const which = require('which')
const windowSize = require('window-size')

/**
 * Modules
 * Internal
 * @constant
 */
const progressBar = require('./progress-bar')
const parseFFmpegLog = require('./parse-ffmpeg-log')
const formatter = require('./formatter')
const theme = require('./theme')


/**
 * FFmpeg Binary
 * @constant
 */
const ffmpegFilepath = which.sync('ffmpeg')

/**
 * FFmpeg arguments
 * @constant
 */
const ffmpegUserArgsList = process.argv.slice(2)
const ffmpegPreparationTaskArgsList = [...ffmpegUserArgsList]
const ffmpegPrimaryTaskArgsList = ['-y', '-loglevel', 'error', '-progress', 'pipe:1', ...ffmpegUserArgsList]

/**
 * Calculate the progress bars' text components width (fixed width)
 * @returns {Number} - String length
 */
let approximateBarTextWidth = () => {
    // console.debug('approximateBarTextWidth()')

    // TEXT LABEL                                               WIDTH
    // 🎬 Rendering                                             12
    // BAR_FILENAME_LENGTH                                      10
    //  |  {percentagePad}% | ETA {etaTimecode}                 20

    const barTextWidth = 12 + Number(BAR_FILENAME_LENGTH) + 20

    const correctionFactor = 4

    return barTextWidth - correctionFactor
}

/**
 * Calculate the progress bars' beam width (variable width)
 * @returns {Number} - String length
 */
let approximateBarBeamWidth = () => {
    // console.debug('approximateBarBeamWidth()')

    const barBeamWidth = (windowSize.get().width - approximateBarTextWidth()) * BAR_BEAM_RATIO

    return Math.floor(barBeamWidth)
}

/**
 * Calculate the progress bars' beam total width
 * @returns {Number} - String length
 */
let approximateBarWidth = () => {
    // console.debug('approximateBarWidth()')

    return approximateBarTextWidth() + approximateBarBeamWidth()
}


/**
 * Primary Task
 * This task runs the FFmpeg commands provided.
 * @param {Number} totalTimeMs - Total duration (ms)
 * @param {String} filePath - Output target filepath
 */
let startPrimaryTask = (totalTimeMs, filePath) => {
    // console.debug('startPrimaryTask()')

    const bar = progressBar({
        barsize: approximateBarBeamWidth()
    })

    /** @type {Boolean} */
    let didStart = false

    /** @type {String} */
    let lastError

    // DEBUG
    // lastError = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzstuvwxyz'

    // Spawn main task
    const mainTask = childProcess.spawn(ffmpegFilepath, ffmpegPrimaryTaskArgsList)

    /** @listens ChildProcess.stdout#data */
    mainTask.stdout.on('data', (data) => {
        if (!didStart) {
            // Bar::start()
            bar.start(totalTimeMs, {
                filename: formatter.filepathToFilename(filePath, BAR_FILENAME_LENGTH)
            })
            didStart = true
        }

        // Parse sparse output of nearly undocumented `-progress` argument 🤬🤬🤬
        // That is, key-value-pairs in .ini format
        const progressDictionary = ini.decode(data.toString())

        const currentTimeMicroseconds = Number(progressDictionary['out_time_ms'])
        const currentTimeMs = Math.round(currentTimeMicroseconds / 1000)

        // Bar::update() (noncritical errors are written to Bar.annotation)
        bar.update(currentTimeMs, null, !!lastError ? theme.error(ellipsize(lastError, approximateBarWidth() + 7)) : null)

        // DEBUG
        // console.debug('progress (ms)', progressMilliseconds, 'duration (ms)', durationMilliseconds, 'fraction', (progressMilliseconds / durationMilliseconds))
    })

    /** @listens ChildProcess.stderr#data */
    mainTask.stderr.on('data', (data) => {
        // Error: Persist last line fo error logs to lastError
        const dataLines = data.toString().trim().split(os.EOL)
        lastError = dataLines[dataLines.length - 1]
    })

    /** @interface Process.ReadStream<ChildProcess.WritableStream> */
    process.stdin.pipe(mainTask.stdin)

    /** @listens ChildProcess#exit */
    mainTask.on('exit', (code, signal) => {
        // DEBUG
        // console.debug('mainTask#exit', 'code:', code, 'signal:', signal)
    })

    /** @listens ChildProcess#close */
    mainTask.on('close', (code, signal) => {
        // DEBUG
        // console.debug('mainTask#close', 'code:', code, 'signal:', signal)

        // Set bar to 100%
        bar.update(totalTimeMs)

        // Restore cursor
        process.stdout.write('\x1B[?25h')

        // Exit
        process.exit(code)
    })
}

/**
 * Preparation Task
 * This spawns a preliminary process, which gathers information about the output (filename, duration) which cannot be gathered via "ffmpeg -progress"
 */
let startPreparationTask = () => {
    // console.debug('startPreparationTask()')

    // Spawn prep task
    const prepTask = childProcess.spawn(ffmpegFilepath, ffmpegPreparationTaskArgsList)

    /** @type {Number} */
    let duration

    /** @type {String} */
    let output

    /** @type {String} */
    let lastError

    let onData = (data) => {
        data = data.toString()
        if (parseFFmpegLog.duration(data)) { duration = parseFFmpegLog.duration(data) }
        if (parseFFmpegLog.output(data)) { output = parseFFmpegLog.output(data) }

        if (duration && output) {
            // SIGKILL sent: preparation task succeeded
            prepTask.kill('SIGKILL')
            startPrimaryTask(duration, output)
        }
    }
    /** @listens ChildProcess.stdout#data */
    prepTask.stdout.on('data', onData)

    // TODO: Better error handling in prep task!
    /** @listens ChildProcess.stderr#data */
    prepTask.stderr.on('data', (data) => {
        if ((parseFFmpegLog.question(data.toString()))) {
            // Question: Show Question + whitespace
            process.stdout.write(theme.prompt(parseFFmpegLog.question(data.toString().trim())))
            process.stdout.write(' ')
        } else {
            // Error: Persist last line fo error logs to lastError
            const dataLines = data.toString().trim().split(os.EOL)
            lastError = dataLines[dataLines.length - 1]
        }
        onData(data)
    })

    /** @interface Process.ReadStream<ChildProcess.WritableStream> */
    process.stdin.pipe(prepTask.stdin)

    /** @listens ChildProcess#exit */
    prepTask.on('exit', (code, signal) => {
        // DEBUG
        // console.debug('prepTask#exit', 'code:', code, 'signal:', signal)
    })

    /** @listens ChildProcess#close */
    prepTask.on('close', (code, signal) => {
        // DEBUG
        // console.debug('prepTask#close', 'code:', code, 'signal:', signal)

        // SIGKILL (fired by us) caused the process to close: ignore
        if (signal === 'SIGKILL') { return }

        // Other SIGNAL caused the process to close: Abort
        if (lastError) {
            // Show last error message
            process.stderr.write(theme.error(lastError))
        }
        process.stdout.write(os.EOL)
        process.exit(code)
    })
}


/**
 * Main
 */
if (require.main === module) {
    startPreparationTask()
}
