import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { XMLParser } from 'fast-xml-parser'
import Transmission from 'transmission-promise'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { Jellyfin } from '@jellyfin/sdk'

dotenv.config({ path: './.env' })

const app = express()
const port = 3000

app.use(cors())
app.use(bodyParser.json())
const jellyfin = new Jellyfin({
    clientInfo: {
        name: 'torrent_manager',
        version: '1.0.0',
    },
    deviceInfo: {
        name: 'web_server',
        id: 'jf94389dxj2q3x0sd3',
    },
})

async function getJellyfin(username, password) {
    const servers = await jellyfin.discovery.getRecommendedServerCandidates(
        process.env.JELLYFIN_SERVER,
    )
    const best = jellyfin.discovery.findBestServer(servers)
    if (!best) throw new Error('Jellyfin server not found')
    const API = jellyfin.createApi(best.address)
    const auth = await API.authenticateUserByName(username, password).catch(
        (err) => err,
    )
    if (auth.status !== 200) throw new Error('Authentication failed')
    return API
}

const APIs = {}

const transmission = new Transmission({
    host: process.env.TRANSMISSION_SERVER,
    port: process.env.NODE_ENV === 'production' ? 9091 : 443,
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
        if (!APIs[req.username])
            return res.status(401).json({ error: 'Invalid token' })
        next()
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' })
    }
}

async function getSonarrTag(username) {
    const tags = await fetch(process.env.SONARR_SERVER + '/api/v3/tag', {
        headers: { 'X-Api-Key': process.env.SONARR_API_TOKEN },
    })
        .then((res) => res.json())
        .catch((err) => {
            console.error(err)
            return []
        })

    const index = tags.findIndex((tag) => tag.label === username)
    if (index >= 0) return tags[index].id
    else return 1
}

app.get('/torrents-api', (req, res) => {
    res.send('Express + TypeScript Server')
})

app.get('/torrents-api/test/status', (req, res) => {
    res.json({ status: 'ok!' })
})

app.get('/torrents-api/test/persons', (req, res) => {
    const page = parseInt(req.query.page) || 0

    if ([0, 1, 2].includes(page)) {
        return res.status(404).json({ error: 'Not Found' })
    }

    const x = [
        { age: 10, gender: 'male', id: 3424 },
        { age: 23, gender: 'male', id: 323 },
        { age: 67, gender: 'female', id: 3434424 },
        { age: 11, gender: 'female', id: 123 },
        { age: 50, gender: 'female', id: 547 },
        { age: 11, gender: 'male', id: 5645 },
    ]

    return res.status(200).json(x.slice(page * 2, page * 2 + 2))
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

    await getJellyfin(username, password)
        .then((API) => {
            APIs[username] = API
            const token = jwt.sign({ username }, process.env.SESSION_SECRET, {
                expiresIn: '12h',
            })
            res.status(200).json({ token })
        })
        .catch(() => {
            res.status(401).json({ error: 'Authentication failed' })
        })
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
        .catch((err) => {
            console.error(err)
            res.status(404).json({ error: 'Could not find torrents' })
        })
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

app.get('/torrents-api/search-show', verifyToken, async (req, res) => {
    const { term } = req.query

    const sonarrRes = await fetch(
        process.env.SONARR_SERVER +
            '/api/v3/series/lookup?' +
            new URLSearchParams({ term, apikey: process.env.SONARR_API_TOKEN }),
    )
        .then(async (res) => res.json())
        .catch((err) => {
            console.error(err)
            return { error: 'Failed to search' }
        })
    if (sonarrRes.error) return res.status(404).json({ error: sonarrRes.error })

    return res.status(200).json(sonarrRes ?? [])
})

app.post('/torrents-api/add-show', verifyToken, async (req, res) => {
    const { show, monitor } = req.body

    let parsedShow
    try {
        parsedShow = JSON.parse(show)
    } catch {
        return res.status(403).json({ error: 'Failed to add show' })
    }

    if (
        !['future', 'all', 'latestSeason', 'firstSeason', 'pilot'].includes(
            monitor,
        )
    )
        return res.status(403).json({ error: 'Failed to add show' })

    const sonarrRes = await fetch(
        process.env.SONARR_SERVER + '/api/v3/series',
        {
            method: 'POST',
            headers: {
                'X-Api-Key': process.env.SONARR_API_TOKEN,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...parsedShow,
                tags: [await getSonarrTag(req.username)],
                rootFolderPath: '/mnt/media/Shows',
                seasonFolder: true,
                path: '/mnt/media/Shows/' + parsedShow.folder,
                qualityProfileId: 1,
                addOptions: {
                    monitor,
                    searchForMissingEpisodes: true,
                    searchForCutoffUnmetEpisodes: true,
                },
            }),
        },
    )
        .then((res) => res.json())
        .catch((err) => {
            console.error(err)
            return { error: 'Failed to add show' }
        })
    if (!sonarrRes.id || sonarrRes.error)
        return res.status(404).json({ error: sonarrRes.error })

    return res.status(200).json({ result: 'ok' })
})

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`)
})
