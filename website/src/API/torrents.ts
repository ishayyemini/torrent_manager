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

class Torrents {
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
}

export default Torrents
