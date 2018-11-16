import axios from "axios";
import * as fs from "fs";
import { parse } from "json2csv";
import { flatten, uniq } from "lodash";
import * as moment from "moment";
import * as path from "path";

const coins = ["BTC", "ETH", "BCH", "LTC", "XRP"]

function formatDate(date: Date): string {
  return moment(date).format("YYYYMMDD")
}

function formatInverse(date: string): string {
  return moment(date).format("DD/MM/YYYY")
}

interface HistoryRecord {
  coin: string
  time: Date
  close: number
}

async function getHistory(
  coin: string,
  toDate: Date
): Promise<HistoryRecord[]> {
  const toDateStr = formatDate(toDate)
  const url = `https://cex.io/api/ohlcv/hd/${toDateStr}/${coin}/USD`
  console.log(`fetching data from: ${url}`)

  try {
    const data = await axios(url)
      .then(t => t.data)
      .then(t => JSON.parse(t.data1d))
      .then(z =>
        z.map(t => ({
          coin,
          time: moment.unix(t[0]).toDate(),
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
  const filename = path.join(
    outputDir,
    `${formatDate(toDate)}.${moment().format("HH-mm-ss")}.csv`
  )
  const csv = parse(sorted)
  fs.writeFileSync(filename, csv)
  console.log(`data was written to ${filename}`)
}

writeCoinsClosePrice(
  coins,
  moment()
    .add(-1, "day")
    .toDate()
)
