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
const moment = require('moment')
/* eslint-disable no-unused-vars */
const momentDurationFormat = require('moment-duration-format')
/* eslint-enable */


/**
 * Parse FFmpeg log for "y/N" question
 * @param {String} text - FFmpeg Log Output
 * @returns {String|void} - First output filepath
 */
let parseFFmpegLogForQuestion = (text) => {
    // console.debug('searchQuestionLog')

    let questionLine = text.match(/.*(\[y\/N\]).*$/gmi)

    if (!questionLine) { return }

    questionLine = questionLine[0]
    questionLine = questionLine.replace(/\'/gmi, '')

    return questionLine
}

/**
 * Parse FFmpeg log for "Duration: "
 * @param {String} text - FFmpeg Log Output
 * @returns {Number|void} - Duration (milliseconds)
 */
let parseFFmpegLogForDuration = (text) => {
    // console.debug('searchDurationLog')

    const durationList = text.match(/Duration: (.{2}):(.{2}):(.{2}).(.{2})/)

    if (!durationList) { return }

    // Grep
    const timecode = `${durationList[1]}:${durationList[2]}:${durationList[3]}.${durationList[4].padEnd(3, '0')}`

    // Format
    const timecodeMoment = moment.duration(timecode)

    return timecodeMoment.asMilliseconds()
}

/**
 * Parse FFmpeg log for "Output #0"
 * @param {String} text - FFmpeg Log Output
 * @returns {String|void} - First output filepath
 */
let parseFFmpegLogForOutput = (text) => {
    // console.debug('searchOutputLog')

    let outputLine = text.match(/(?:Output #0).*$/gmi)

    if (!outputLine) { return }

    outputLine = outputLine[0]
    outputLine = outputLine.match(/'(.*?)'/gmi)[0]
    outputLine = outputLine.replace(/\'/gmi, '')

    return path.resolve(outputLine)
}


/**
 * @exports parse-ffmpeg-log
 */
module.exports = {
    output: parseFFmpegLogForOutput,
    duration: parseFFmpegLogForDuration,
    question: parseFFmpegLogForQuestion
}
