/**
 * Independent time operation tool to facilitate subsequent switch to dayjs
 */
import dayjs from 'dayjs'

const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'
const DATE_FORMAT = 'YYYY-MM-DD'

export function formatToDateTime(date, format = DATE_TIME_FORMAT) {
  return dayjs(date).format(format)
}

export function formatToDate(date, format = DATE_FORMAT) {
  return dayjs(date).format(format)
}

export function formatToDateTimeRange(daterange, format = DATE_TIME_FORMAT) {
  if (!daterange || daterange.length !== 2) {
    return ''
  }
  return `${formatToDateTime(daterange[0], format)}~${formatToDateTime(daterange[1], format)}`
}