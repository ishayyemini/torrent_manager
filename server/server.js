const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const { XMLParser } = require('fast-xml-parser')
const bcrypt = require('bcrypt')
const Transmission = require('transmission-promise')
const jwt = require('jsonwebtoken')

const {
    BT4G_SERVER,
    SESSION_SECRET,
    TRANSMISSION_SERVER,
    TRANSMISSION_USERNAME,
    TRANSMISSION_PASSWORD,
} = require('../conf.json')
const users = require('../users.json')

const app = express()
const port = 3000

app.use(cors())
app.use(bodyParser.json())

function verifyToken(req, res, next) {
    const token = req.header('Authorization')
    if (!token) return res.status(401).json({ error: 'Access denied' })
    try {
        const decoded = jwt.verify(token, SESSION_SECRET)
        req.username = decoded.username
        next()
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' })
    }
}

app.get('/torrents-api', (req, res) => {
    res.send('Express + TypeScript Server')
})

app.get('/torrents-api/bt4g', verifyToken, async (req, res) => {
    const { q } = req.query

    const bt4gRes = await fetch(
        BT4G_SERVER +
            '?' +
            new URLSearchParams({ q, page: 'rss', orderby: 'seeders' }),
    )
    const parser = new XMLParser()
    const parsedRes = (
        parser.parse(await bt4gRes.text())?.rss?.channel?.item ?? []
    ).filter((item) => item.description.includes('<br>Movie<br>'))

    const transmission = new Transmission({
        host: TRANSMISSION_SERVER,
        port: 443,
        username: TRANSMISSION_USERNAME,
        password: TRANSMISSION_PASSWORD,
        ssl: true,
    })
    const alreadyAdded = await transmission
        .get(undefined, ['magnetLink'])
        .then((res) => res.torrents.map((item) => item.magnetLink))

    res.status(200)
    res.json(
        parsedRes.map((item) => ({
            ...item,
            added: alreadyAdded.includes(item.link),
        })),
    )
})

app.post('/torrents-api/login', async (req, res) => {
    if (!req.body) return res.sendStatus(400)
    const { username, password } = req.body
    const passwordsMatch = await bcrypt
        .compare(password, users[username])
        .catch(() => false)
    if (!passwordsMatch) {
        res.status(401)
        res.json({ error: 'Authentication failed' })
    } else {
        const token = jwt.sign({ username }, SESSION_SECRET, {
            expiresIn: '12h',
        })
        res.status(200)
        res.json({ token })
    }
})

app.get('/torrents-api/user', verifyToken, (req, res) => {
    res.json({ username: req.username })
})

app.post('/torrents-api/add-torrent', verifyToken, async (req, res) => {
    if (!req.body) return res.sendStatus(400)
    const { magnet, downloadDir } = req.body
    const transmission = new Transmission({
        host: TRANSMISSION_SERVER,
        port: 443,
        username: TRANSMISSION_USERNAME,
        password: TRANSMISSION_PASSWORD,
        ssl: true,
    })

    const addRes = await transmission.addUrl(magnet, {
        'download-dir': downloadDir,
    })
    res.json(addRes)
})

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`)
})
