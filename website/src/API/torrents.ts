import Transmission from 'transmission-promise'

import {
    TRANSMISSION_SERVER,
    TRANSMISSION_USERNAME,
    TRANSMISSION_PASSWORD,
    SHOWS_DIR,
    MOVIES_DIR,
} from '../../../conf.json'

// TODO move logic to server, better to hide passwords

export interface BT4GResItem {
    description: string
    guid: string
    link: string
    pubDate: string
    title: string
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

class Torrents {
    static transmission = new Transmission({
        host: TRANSMISSION_SERVER,
        port: 443,
        username: TRANSMISSION_USERNAME,
        password: TRANSMISSION_PASSWORD,
        ssl: true,
    })

    static async findTorrent(
        searchTerm: string,
        searchOptions?: SearchOptions,
    ): Promise<BT4GResItem | undefined> {
        if (!searchOptions) searchOptions = { hdr: true, quality: '2160p' }
        searchTerm += ' ' + searchOptions.quality
        if (searchOptions.hdr && searchOptions.quality == '2160p')
            searchTerm += ' hdr'
        const res = await this.searchBT4G(searchTerm)
        if (Array.isArray(res)) return res[0]
        else return undefined
    }

    static async searchBT4G(searchTerm: string): Promise<BT4GResItem[]> {
        const res = await fetch(
            'http://localhost:3000/bt4g' +
                '?' +
                new URLSearchParams({ q: searchTerm }),
            { mode: 'cors' },
        )
        return (await res.json()) as BT4GResItem[]
    }

    static async addTorrent(torrentLink: string, metadata: Metadata) {
        console.log(metadata)
        return await this.transmission.addUrl(torrentLink, {
            'download-dir':
                (metadata.type == 'show' ? SHOWS_DIR : MOVIES_DIR) +
                '/' +
                metadata.name +
                (metadata.type == 'show'
                    ? '/Season ' + metadata.season?.toString()
                    : ''),
        })
    }
}

export default Torrents
