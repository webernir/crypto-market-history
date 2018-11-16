import moment = require("moment")

export function formatDate(date: Date): string {
  return moment(date).format("YYYYMMDD")
}

export function formatInverse(date: string): string {
  return moment(date).format("DD/MM/YYYY")
}

export function generateNowFilename(toDate: Date): string {
  return `${formatDate(toDate)}.${moment().format("HH-mm-ss")}`
}

export function yesterday() {
  return moment()
    .add(-1, "day")
    .toDate()
}
export function unixToDate(date: number): Date {
  return moment.unix(date).toDate()
}
