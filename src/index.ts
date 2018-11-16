import axios from "axios"
import * as fs from "fs"
import { parse } from "json2csv"
import { flatten, uniq } from "lodash"
import * as path from "path"
import {
  formatDate,
  formatInverse,
  generateNowFilename,
  yesterday,
  unixToDate
} from "./dateUtils"
import { HistoryRecord } from "./HistoryRecord"

function getUrl(coin: string, toDate: Date): string {
  const toDateStr = formatDate(toDate)
  return `https://cex.io/api/ohlcv/hd/${toDateStr}/${coin}/USD`
}

async function getHistory(
  coin: string,
  toDate: Date
): Promise<HistoryRecord[]> {
  const url = getUrl(coin, toDate)
  console.log(`fetching data from: ${url}`)

  try {
    const data = await axios(url)
      .then(t => t.data)
      .then(t => JSON.parse(t.data1d))
      .then(z =>
        z.map(t => ({
          coin,
          time: unixToDate(t[0]),
          close: t[4]
        }))
      )
    return data
  } catch (error) {
    console.error(error)
  }
}

async function writeCoinsClosePrice(coins: string[], toDate: Date) {
  const outputDir = path.join(process.cwd(), "output")
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }
  const tasks = coins.map(coin => getHistory(coin, toDate))
  const allCoins = await Promise.all(tasks).then(t => flatten(t))
  const dates = uniq(allCoins.map(t => formatDate(t.time))).sort(
    (a, b) => Number(b) - Number(a)
  )
  const records = []
  dates.forEach(time => {
    const record = {}
    record["time"] = time
    coins.forEach(coin => {
      const point = allCoins.find(
        t => formatDate(t.time) === time && t.coin === coin
      )
      const val = point ? point.close : null
      record[coin] = val
    })
    records.push(record)
  })

  const sorted = records.map(t => ({ ...t, time: formatInverse(t.time) }))
  const filename = path.join(outputDir, `${generateNowFilename(toDate)}.csv`)
  const csv = parse(sorted)
  fs.writeFileSync(filename, csv)
  console.log(`data was written to ${filename}`)
}

const coins = ["BTC", "ETH", "BCH", "LTC", "XRP"]
writeCoinsClosePrice(coins, yesterday())
