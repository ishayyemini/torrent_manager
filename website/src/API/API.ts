import { SHOWS_DIR, MOVIES_DIR, JELLYFIN_SERVER } from '../../../conf.json'

export interface BT4GResItem {
    description: string
    guid: string
    link: string
    pubDate: string
    title: string
    added: boolean
}

export interface SearchOptions {
    hdr: boolean
    quality: '1080p' | '2160p'
}

export interface Metadata {
    name: string
    type: 'show' | 'movie'
    season?: number
}

export interface Torrent {
    activityDate: number
    addedDate: number
    doneDate: number
    downloadDir: string
    eta: number
    id: number
    isFinished: number
    leftUntilDone: number
    name: string
    percentDone: number
    rateDownload: number
    rateUpload: number
    status: number
    totalSize: number
}

class API {
    static async login(username: string, password: string) {
        const res = await fetch(JELLYFIN_SERVER + '/torrents-api/login', {
            body: JSON.stringify({
                username,
                password,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'post',
        })

        if (res.status != 200) throw new Error('Login error')
        const json = await res.json()
        localStorage.setItem('token', json.token)
    }

    static async user(): Promise<{ username: string }> {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('No token')
        const res = await fetch(JELLYFIN_SERVER + '/torrents-api/user', {
            headers: {
                Authorization: token,
            },
        })
        if (res.status != 200) throw new Error('User error')
        return await res.json()
    }

    static async findTorrents(
        searchTerm: string,
        searchOptions?: SearchOptions,
    ): Promise<BT4GResItem[]> {
        if (!searchOptions) searchOptions = { hdr: true, quality: '2160p' }
        searchTerm += ' ' + searchOptions.quality
        if (searchOptions.hdr && searchOptions.quality == '2160p')
            searchTerm += ' hdr'
        const res = await this.searchBT4G(searchTerm)
        if (Array.isArray(res)) return res
        else return []
    }

    static async searchBT4G(searchTerm: string): Promise<BT4GResItem[]> {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('No token')
        const res = await fetch(
            JELLYFIN_SERVER +
                '/torrents-api/bt4g' +
                '?' +
                new URLSearchParams({ q: searchTerm }),
            {
                mode: 'cors',
                headers: {
                    Authorization: token,
                },
            },
        )
        if (res.status != 200)
            throw new Error(await res.json().then((x) => x.error))
        return (await res.json()) as BT4GResItem[]
    }

    static async addTorrent(torrentLink: string, metadata: Metadata) {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('No token')
        const res = await fetch(JELLYFIN_SERVER + '/torrents-api/add-torrent', {
            body: JSON.stringify({
                magnet: torrentLink,
                downloadDir:
                    (metadata.type == 'show' ? SHOWS_DIR : MOVIES_DIR) +
                    '/' +
                    metadata.name +
                    (metadata.type == 'show'
                        ? '/Season ' + metadata.season?.toString()
                        : ''),
            }),
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
            method: 'post',
        })
        if (res.status != 200)
            throw new Error(await res.json().then((x) => x.error))
        return await res.json()
    }

    static async listTorrents() {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('No token')
        const res = await fetch(
            JELLYFIN_SERVER + '/torrents-api/list-torrents',
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                },
            },
        )
        if (res.status != 200)
            throw new Error(await res.json().then((x) => x.error))
        return (await res.json()) as { torrents: Torrent[] }
    }
}

export default API
