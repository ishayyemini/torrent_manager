import { useState, useEffect, ReactElement, Fragment } from 'react'
import {
    Box,
    List,
    ListItem,
    LinearProgress,
    Typography,
    Divider,
} from '@mui/material'

import API, { Torrent } from './API/API.ts'
import {
    CloudUpload,
    Download,
    Downloading,
    HourglassEmpty,
    StopCircle,
    Upload,
} from '@mui/icons-material'

function formatSizeUnits(bytes: number): string {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB'
    else if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB'
    else if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB'
    else if (bytes > 1) return bytes + ' bytes'
    else if (bytes == 1) return bytes + ' byte'
    else return '0 bytes'
}

function formatStatus(status: number): [ReactElement, ReactElement] {
    switch (status) {
        case 0:
            return [<StopCircle key={0} />, <span key={1}>Stopped</span>]
        case 1:
            return [
                <HourglassEmpty key={0} />,
                <span key={1}>Check Pending</span>,
            ]
        case 2:
            return [<HourglassEmpty key={0} />, <span key={1}>Checking</span>]
        case 3:
            return [
                <Downloading key={0} />,
                <span key={1}>Download Pending</span>,
            ]
        case 4:
            return [<Downloading key={0} />, <span key={1}>Downloading</span>]
        case 5:
            return [<CloudUpload key={0} />, <span key={1}>Seed Pending</span>]
        case 6:
            return [<CloudUpload key={0} />, <span key={1}>Seeding</span>]
        default:
            return [<Downloading key={0} />, <span key={1}>Downloading</span>]
    }
}

function formatEta(eta: number) {
    const day = 24 * 60 * 60
    const hour = 60 * 60
    const minute = 60
    if (eta >= day)
        return (
            Math.round(eta / day) + 'd ' + Math.round((eta % day) / hour) + 'hr'
        )
    if (eta >= hour)
        return (
            Math.round(eta / hour) +
            'hr ' +
            Math.round((eta % hour) / minute) +
            'm'
        )
    if (eta >= minute)
        return Math.round(eta / minute) + 'm ' + (eta % minute) + 's'
    if (eta >= 0) return eta + 's'
    else return ''
}

function ListTorrents() {
    const [torrents, setTorrents] = useState<Torrent[]>([])

    useEffect(() => {
        API.listTorrents().then((r) => setTorrents(r.torrents))
        const interval = setInterval(() => {
            API.listTorrents().then((r) => setTorrents(r.torrents))
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    return (
        <Box>
            <List>
                {torrents.map((torrent: Torrent) => (
                    <Fragment key={torrent.id}>
                        <ListItem>
                            <Box maxWidth={'100%'}>
                                <Box maxWidth={'100%'} overflow={'hidden'}>
                                    <Typography fontWeight={'bold'}>
                                        {torrent.name}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography fontSize={'0.7em'}>
                                        {torrent.downloadDir.replace(
                                            '/mnt/media/',
                                            '',
                                        )}
                                    </Typography>
                                </Box>
                                <Box
                                    display={'flex'}
                                    flexDirection={'row'}
                                    justifyContent={'space-between'}
                                    alignItems={'between'}
                                >
                                    <Box display={'flex'} gap={'5px'}>
                                        {formatStatus(torrent.status)}
                                    </Box>
                                    <Box>{formatEta(torrent.eta)}</Box>
                                </Box>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Box sx={{ width: '100%', mr: 1 }}>
                                        <LinearProgress
                                            variant={'determinate'}
                                            value={torrent.percentDone * 100}
                                        />
                                    </Box>
                                    <Box sx={{ minWidth: 35 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{ color: 'text.secondary' }}
                                        >{`${Math.round(torrent.percentDone * 100)}%`}</Typography>
                                    </Box>
                                </Box>
                                <Box
                                    display={'flex'}
                                    flexDirection={'row'}
                                    justifyContent={'space-evenly'}
                                    alignItems={'baseline'}
                                >
                                    <Box width={'fit-content'} display={'flex'}>
                                        <Download />{' '}
                                        {formatSizeUnits(torrent.rateDownload)}
                                    </Box>

                                    <Box width={'fit-content'} display={'flex'}>
                                        <Upload />{' '}
                                        {formatSizeUnits(torrent.rateUpload)}
                                    </Box>
                                </Box>
                            </Box>
                        </ListItem>{' '}
                        <Divider key={torrent.id + '_1'} />
                    </Fragment>
                ))}
            </List>
        </Box>
    )
}

export default ListTorrents
