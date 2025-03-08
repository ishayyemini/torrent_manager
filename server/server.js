const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const { XMLParser } = require('fast-xml-parser')
const bcrypt = require('bcrypt')
const Transmission = require('transmission-promise')
const jwt = require('jsonwebtoken')

require('dotenv').config({ path: './.env' })
const users = require('../users.json')

const app = express()
const port = 3000

app.use(cors())
app.use(bodyParser.json())

const transmission = new Transmission({
    host: process.env.TRANSMISSION_SERVER,
    port: process.env.NODE_ENV === 'production' ? 80 : 443,
    username: process.env.TRANSMISSION_USERNAME,
    password: process.env.TRANSMISSION_PASSWORD,
    ssl: process.env.NODE_ENV !== 'production',
})

const neededFields = [
    'activityDate',
    'addedDate',
    'doneDate',
    'downloadDir',
    'eta',
    'id',
    'isFinished',
    'leftUntilDone',
    'name',
    'percentDone',
    'rateDownload',
    'rateUpload',
    'status',
    'totalSize',
]

async function verifyToken(req, res, next) {
    const token = req.header('Authorization')
    if (!token) return res.status(401).json({ error: 'Access denied' })
    try {
        const decoded = jwt.verify(token, process.env.SESSION_SECRET)
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
        process.env.BT4G_SERVER +
            '?' +
            new URLSearchParams({ q, page: 'rss', orderby: 'seeders' }),
    ).catch(() => ({ error: 'Failed to fetch torrents' }))
    if (bt4gRes.status !== 200)
        return res
            .status(bt4gRes.status)
            .json({ error: 'Failed to fetch torrents' })
    const parser = new XMLParser()
    const parsedRes = (
        parser.parse(await bt4gRes.text())?.rss?.channel?.item ?? []
    ).filter((item) => item.description.includes('<br>Movie<br>'))

    const alreadyAdded = await transmission
        .get(undefined, ['magnetLink'])
        .then((res) => res.torrents.map((item) => item.magnetLink))
        .catch(() => [])

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
    if (username === undefined || password === undefined)
        return res.sendStatus(400)
    const passwordsMatch = await bcrypt
        .compare(password, users[username])
        .catch(() => false)
    if (!passwordsMatch) {
        res.status(401)
        res.json({ error: 'Authentication failed' })
    } else {
        const token = jwt.sign({ username }, process.env.SESSION_SECRET, {
            expiresIn: '12h',
        })
        res.status(200)
        res.json({ token })
    }
})

app.get('/torrents-api/user', verifyToken, (req, res) => {
    res.json({ username: req.username })
})

app.get('/torrents-api/list-torrents', verifyToken, (req, res) => {
    transmission
        .all()
        .then(({ torrents }) => {
            torrents = torrents.map((item) =>
                Object.fromEntries(
                    Object.entries(item).filter(([key]) =>
                        neededFields.includes(key),
                    ),
                ),
            )
            res.status(200).json({ torrents })
        })
        .catch(() => res.status(404).json({ error: 'Could not find torrents' }))
})

app.post('/torrents-api/add-torrent', verifyToken, async (req, res) => {
    if (!req.body) return res.sendStatus(400)
    const { magnet, downloadDir } = req.body
    if (magnet === undefined || downloadDir === undefined)
        return res.sendStatus(400)
    const addRes = await transmission
        .addUrl(magnet, {
            'download-dir': downloadDir,
        })
        .catch(() => ({ error: 'Failed to add torrent' }))
    res.json(addRes)
})

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`)
})
