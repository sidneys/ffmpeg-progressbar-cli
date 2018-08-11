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
const BAR_BEAM_RATIO = process.env.BAR_SIZE_RATIO || 0.9


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
 * Approximate the available width for the progress bars' beam
 * @returns {String} -
 */
let availableWidthForProgressBarBeam = () => {
    // console.debug('availableWidthForProgressBarBeam()')

    // TEXT LABEL                                               WIDTH
    // 🎬 Rendering                                             12
    // BAR_FILENAME_LENGTH                                      10
    //  |  {percentagePad}% | ETA {etaTimecode}                 20

    const totalWidth = windowSize.get().width
    const textWidth = 12 + Number(BAR_FILENAME_LENGTH) + 20
    const graceWidth = 4

    return totalWidth - textWidth - graceWidth
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
        barsize: Math.floor(availableWidthForProgressBarBeam() * BAR_BEAM_RATIO)
    })

    let didStart = false

    // Spawn main task
    const mainTask = childProcess.spawn(ffmpegFilepath, ffmpegPrimaryTaskArgsList)

    /** @listens ChildProcess.stdout#data */
    mainTask.stdout.on('data', (data) => {
        if (!didStart) {
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

        // Update Progress Bar
        bar.update(currentTimeMs)

        // DEBUG
        // console.debug('progress (ms)', progressMilliseconds, 'duration (ms)', durationMilliseconds, 'fraction', (progressMilliseconds / durationMilliseconds))
    })

    /** @listens ChildProcess.stderr#data */
    mainTask.stderr.on('data', (data) => {
        process.stderr.write(data)
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

    let duration
    let output
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
            // Errors: Persist
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
        // SIGKILL: ignored, fired manually when task complete
        if (signal === 'SIGKILL') { return }
        if (lastError) {
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
