import { Api, Jellyfin as JellyfinSDK } from '@jellyfin/sdk'
import { getSearchApi, getUserApi } from '@jellyfin/sdk/lib/utils/api'

import { JELLYFIN_SERVER } from '../../../conf.json'
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'

class Jellyfin {
    private static jellyfin: JellyfinSDK | undefined
    private static api: Api | undefined

    static async initJellyfin() {
        this.jellyfin = new JellyfinSDK({
            clientInfo: {
                name: 'torrent_manager',
                version: '1.0.0',
            },
            deviceInfo: {
                name: 'web_server',
                id: 'jf94389dxj2q3x0sd3',
            },
        })

        const servers =
            await this.jellyfin.discovery.getRecommendedServerCandidates(
                JELLYFIN_SERVER,
            )
        const best = this.jellyfin.discovery.findBestServer(servers)
        if (best == undefined) {
            this.jellyfin = undefined
            throw new Error('No Jellyfin server found')
        }
        this.api = this.jellyfin.createApi(best.address)
        if (this.api == undefined) {
            this.jellyfin = undefined
            throw new Error('Error creating API')
        }
    }

    static async getUsers() {
        if (this.jellyfin == undefined) await this.initJellyfin()

        const users = await getUserApi(this.api as Api).getPublicUsers()
        console.log('Users =>', users.data)
    }

    static async login(username: string, password: string) {
        if (this.jellyfin == undefined) await this.initJellyfin()

        const auth = await this.api?.authenticateUserByName(username, password)
        if (auth == undefined) throw new Error('Jellyfin auth error')
        console.log('Auth =>', auth.data)
    }

    static async logout() {
        if (this.jellyfin == undefined) await this.initJellyfin()
        await this.api?.logout()
    }

    static async searchMedia(searchTerm: string) {
        if (this.jellyfin == undefined) await this.initJellyfin()
        const res = await getSearchApi(this.api as Api).getSearchHints({
            searchTerm,
            limit: 10,
            includeItemTypes: [BaseItemKind.Movie, BaseItemKind.Series],
        })
        console.log(res)
        return res.data.SearchHints
    }
}

export default Jellyfin
