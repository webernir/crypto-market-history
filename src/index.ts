import * as moment from "moment"
import axios from "axios"
import { parse } from "json2csv"
import * as fs from "fs"
import * as path from "path"

const fields = ["coin", "time", "close"]
const opts = { fields }
const coins = ["BTC", "ETH", "BCH"]

function formatDate(date: Date): string {
  return moment(date).format("YYYYMMDD")
}

async function getHistory(coin: string, toDate: Date) {
  const toDateStr = formatDate(toDate)
  const url = `https://cex.io/api/ohlcv/hd/${toDateStr}/${coin}/USD`
  console.log(url)
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

function writeCoinsClosePrice(coins: string[], toDate: Date) {
  const outputDir = path.join(process.cwd(), "output")
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }
  coins.forEach(async coin => {
    const data = await getHistory(coin, toDate)
    const filename = path.join(outputDir, `${coin}.${formatDate(toDate)}.csv`)
    const csv = parse(data)
    fs.writeFileSync(filename, csv)
  })
}

writeCoinsClosePrice(
  coins,
  moment()
    .add(-1, "day")
    .toDate()
)
