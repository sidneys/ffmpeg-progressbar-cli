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
const readline = require('readline')
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

/**
 * Modules
 * Internal
 * @constant
 */
const progressBar = require('./progress-bar')
const parseFFmpegLog = require('./parse-ffmpeg-log')
const predictProgressbarWidth = require('./predict-progressbar-width')
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
 * @typedef {ChildProcess} Task
 * @inherits {NodeJS.EventEmitter}
 * @property {NodeJS.ReadableStream} stdout - stdout Stream
 * @property {NodeJS.ReadableStream} stderr - stderr Stream
 * @property {NodeJS.WritableStream} stdin - stdin Stream
 * @property {function} on - NodeJS.EventEmitter.on
 */

/**
 * Primary Task
 * This task runs the FFmpeg commands provided.
 * @param {Number} totalTimeMs - Total duration (ms)
 * @param {String} filePath - Output target filepath
 */
let startPrimaryTask = (totalTimeMs, filePath) => {
    // console.debug('startPrimaryTask()')

    const progressbarWidth = predictProgressbarWidth.beam(Number(BAR_FILENAME_LENGTH), BAR_BEAM_RATIO)

    /**
     * Create Progress Bar
     * @type {progressBar}
     */
    const bar = progressBar({
        barsize: progressbarWidth
    })

    /**
     * Startup status
     * @type {Boolean}
     */
    let didStart = false

    /**
     * Last error log
     * @type {String}
     */
    let lastError

    // DEBUG
    // lastError = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzstuvwxyz'

    /**
     * Main Task
     * @type {Task}
     */
    const mainTask = childProcess.spawn(ffmpegFilepath, ffmpegPrimaryTaskArgsList)

    /**
     * Handles mainTask.stdout
     * @param {Buffer|String} data - FFmpeg Live Log Output Buffer
     */
    let onData = (data) => {
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
        bar.update(currentTimeMs, null, !!lastError ? theme.warning(ellipsize(lastError, progressbarWidth + 7)) : null)

        // DEBUG
        // console.debug('progress (ms)', progressMilliseconds, 'duration (ms)', durationMilliseconds, 'fraction', (progressMilliseconds / durationMilliseconds))
    }

    /**
     * @fires mainTask#onData
     * @interface mainTask.stdout
     */
    mainTask.stdout.on('data', onData)

    /**
     * @fires mainTask#onData
     * @interface mainTask.stderr
     */
    mainTask.stderr.on('data', (data) => {
        // Error: Persist last line fo error logs to lastError
        const dataLines = data.toString().trim().split(os.EOL)
        lastError = dataLines[dataLines.length - 1]
    })

    /**
     * @interface Process.ReadStream<ChildProcess.WritableStream>
     */
    process.stdin.pipe(mainTask.stdin)

    /**
     * @listens mainTask#close
     */
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

    /**
     * Preparation Task
     */
    const prepTask = childProcess.spawn(ffmpegFilepath, ffmpegPreparationTaskArgsList)

    /**
     * Duration of output file
     * @type {Number}
     */
    let outputDuration

    /**
     * Name of output file
     * @type {String}
     */
    let outputFilename

    /**
     * Last error log
     * @type {String}
     */
    let lastError

    /**
     * Question status
     * @type {Boolean}
     */
    let didShowQuestion = false

    /**
     * Handles prepTask.stdout
     * @param {Buffer|String} data - FFmpeg Live Log Output Buffer
     */
    let onData = (data) => {
        data = data.toString()
        if (parseFFmpegLog.duration(data)) { outputDuration = parseFFmpegLog.duration(data) }
        if (parseFFmpegLog.output(data)) { outputFilename = parseFFmpegLog.output(data) }

        if (outputDuration && outputFilename) {
            if (didShowQuestion) {
                readline.moveCursor(process.stderr, 0, -1)
                readline.clearLine(process.stderr, 0)
            }
            // Send SIGKILL: preparation task succeeded
            prepTask.kill('SIGKILL')
            startPrimaryTask(outputDuration, outputFilename)
        }
    }

    /**
     * @fires prepTask#onData
     * @interface prepTask.stdout
     */
    prepTask.stdout.on('data', onData)

    /**
     * @fires prepTask#onData
     * @interface prepTask.stderr
     */
    prepTask.stderr.on('data', (data) => {
        if ((parseFFmpegLog.question(data.toString()))) {
            // Question: Show Question + whitespace
            process.stdout.write(theme.prompt(parseFFmpegLog.question(data.toString().trim())))
            process.stdout.write(' ')
            didShowQuestion = true
        } else {
            // Error: Persist last line fo error logs to lastError
            const dataLines = data.toString().trim().split(os.EOL)
            lastError = dataLines[dataLines.length - 1]
        }
        onData(data)
    })

    /**
     * @interface Process.ReadStream<ChildProcess.WritableStream>
     */
    process.stdin.pipe(prepTask.stdin)

    /**
     * @listens prepTask#close
     */
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
