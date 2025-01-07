const express = require('express')
const cors = require('cors')
const { XMLParser } = require('fast-xml-parser')

const { BT4G_SERVER } = require('../conf.json')

const app = express()
const port = 3000

app.use(cors())

app.get('/', (req, res) => {
    res.send('Express + TypeScript Server')
})

app.get('/bt4g', async (req, res) => {
    const { q } = req.query

    const bt4gRes = await fetch(
        BT4G_SERVER + '?' + new URLSearchParams({ q, page: 'rss' }),
    )
    const parser = new XMLParser()
    const parsedRes = parser.parse(await bt4gRes.text()).rss.channel.item

    console.log(parsedRes)

    res.status(200)
    res.json(parsedRes || [])
})

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`)
})
