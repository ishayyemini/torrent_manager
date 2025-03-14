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

export interface ShowItem {
    added: string
    overview: string
    path?: string
    remotePoster: string
    title: string
    tvdbId: number
    year: number
}

export type MonitorType =
    | 'future'
    | 'all'
    | 'latestSeason'
    | 'firstSeason'
    | 'pilot'

class API {
    static async login(username: string, password: string) {
        const res = await fetch(import.meta.env.VITE_API_ENDPOINT + '/login', {
            body: JSON.stringify({ username, password }),
            headers: { 'Content-Type': 'application/json' },
            method: 'post',
        })

        if (res.status != 200) throw new Error('Login error')
        const json = await res.json()
        localStorage.setItem('token', json.token)
    }

    static async user(): Promise<{ username: string }> {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('No token')
        const res = await fetch(import.meta.env.VITE_API_ENDPOINT + '/user', {
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
            import.meta.env.VITE_API_ENDPOINT +
                '/bt4g' +
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
        const res = await fetch(
            import.meta.env.VITE_API_ENDPOINT + '/add-torrent',
            {
                body: JSON.stringify({
                    magnet: torrentLink,
                    downloadDir:
                        (metadata.type == 'show'
                            ? import.meta.env.VITE_SHOWS_DIR
                            : import.meta.env.VITE_MOVIES_DIR) +
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
            },
        )
        if (res.status != 200)
            throw new Error(await res.json().then((x) => x.error))
        return await res.json()
    }

    static async listTorrents() {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('No token')
        const res = await fetch(
            import.meta.env.VITE_API_ENDPOINT + '/list-torrents',
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

    static async searchShow(searchTerm: string) {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('No token')
        const res = await fetch(
            import.meta.env.VITE_API_ENDPOINT +
                '/search-show' +
                '?' +
                new URLSearchParams({ term: searchTerm }),
            { mode: 'cors', headers: { Authorization: token } },
        )
        if (res.status != 200)
            throw new Error(await res.json().then((x) => x.error))
        return ((await res.json()) ?? []) as ShowItem[]
    }

    static async addShow(show: ShowItem, monitor: MonitorType) {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('No token')
        const res = await fetch(
            import.meta.env.VITE_API_ENDPOINT + '/add-show',
            {
                mode: 'cors',
                headers: {
                    Authorization: token,
                    'Content-Type': 'application/json',
                },
                method: 'post',
                body: JSON.stringify({
                    show: JSON.stringify(show),
                    monitor,
                }),
            },
        )
        if (res.status != 200)
            throw new Error(await res.json().then((x) => x.error))
    }
}

export default API
