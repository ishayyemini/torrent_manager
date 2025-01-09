import { FormEventHandler, useCallback, useState } from 'react'
import {
    Box,
    Button,
    Card,
    Checkbox,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormGroup,
    Radio,
    RadioGroup,
    TextField,
} from '@mui/material'

import API, { BT4GResItem, Metadata, SearchOptions } from './API/API.ts'

function Home() {
    const [search, setSearch] = useState('')
    const [torrents, setTorrents] = useState<BT4GResItem[] | undefined>()
    const [searchOptions, setSearchOptions] = useState<SearchOptions>({
        hdr: true,
        quality: '2160p',
    })
    const [selectedMagnet, setSelectedMagnet] = useState('')
    const [metadata, setMetadata] = useState<Metadata>({
        name: '',
        type: 'movie',
        season: undefined,
    })

    const onSearchFormSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
        (e) => {
            e.preventDefault()
            API.findTorrents(search, searchOptions).then((res) => {
                setMetadata((oldMetadata) => {
                    const se =
                        search.toLowerCase().match(/s\d\de\d\d/i)?.[0] ||
                        search.toLowerCase().match(/s\d\d/i)?.[0]
                    oldMetadata.name = (
                        se ? search.replace(' ' + se, '') : search
                    ).replace(
                        /\w\S*/g,
                        (text) =>
                            text.charAt(0).toUpperCase() +
                            text.substring(1).toLowerCase(),
                    )
                    oldMetadata.type = se ? 'show' : 'movie'
                    oldMetadata.season = se
                        ? parseInt(se.slice(1, 3))
                        : undefined

                    return oldMetadata
                })
                if (res.length == 0) setTorrents(undefined)
                else setTorrents(res)
            })
        },
        [search, searchOptions],
    )

    const onApproveFormSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
        (e) => {
            e.preventDefault()
            if (selectedMagnet != '')
                API.addTorrent(selectedMagnet, metadata).then(() => {
                    setTorrents(undefined)
                    setSelectedMagnet('')
                })
            else setTorrents(undefined)
        },
        [metadata, selectedMagnet],
    )

    return (
        <>
            <Card>
                <Box width={'300px'} margin={'12px'}>
                    {torrents == undefined ? (
                        <>
                            <DialogTitle>Search</DialogTitle>

                            <form onSubmit={onSearchFormSubmit}>
                                <TextField
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    fullWidth
                                />

                                <FormControl>
                                    <RadioGroup
                                        name={'quality'}
                                        value={searchOptions.quality}
                                        onChange={(e) =>
                                            setSearchOptions({
                                                ...searchOptions,
                                                quality: e.target
                                                    .value as SearchOptions['quality'],
                                            })
                                        }
                                        row
                                    >
                                        <FormControlLabel
                                            value={'2160p'}
                                            control={<Radio />}
                                            label={'2160p'}
                                        />
                                        <FormControlLabel
                                            value={'1080p'}
                                            control={<Radio />}
                                            label={'1080p'}
                                        />
                                    </RadioGroup>
                                </FormControl>

                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={searchOptions.hdr}
                                            onChange={() =>
                                                setSearchOptions({
                                                    ...searchOptions,
                                                    hdr: !searchOptions.hdr,
                                                })
                                            }
                                            disabled={
                                                searchOptions.quality != '2160p'
                                            }
                                        />
                                    }
                                    label={'HDR'}
                                />

                                <Button type={'submit'}>Search Torrent</Button>
                            </form>
                        </>
                    ) : (
                        <>
                            <DialogTitle>Choose Torrent</DialogTitle>

                            <form onSubmit={onApproveFormSubmit}>
                                <Box
                                    maxHeight={'300px'}
                                    margin={'0 0 12px 0'}
                                    overflow={'auto'}
                                >
                                    <RadioGroup
                                        name={'selectedMagnet'}
                                        value={selectedMagnet}
                                        onChange={(e) =>
                                            setSelectedMagnet(e.target.value)
                                        }
                                        row
                                    >
                                        {torrents.map((torrent, index) => (
                                            <FormControlLabel
                                                value={torrent.link}
                                                control={<Radio />}
                                                label={
                                                    <span
                                                        style={{
                                                            lineBreak:
                                                                'anywhere',
                                                            fontWeight:
                                                                torrent.link ==
                                                                selectedMagnet
                                                                    ? 'bold'
                                                                    : 'normal',
                                                        }}
                                                    >
                                                        {torrent.title}
                                                    </span>
                                                }
                                                key={index}
                                                disabled={torrent.added}
                                            />
                                        ))}
                                    </RadioGroup>
                                </Box>

                                <TextField
                                    value={metadata.name}
                                    onChange={(e) =>
                                        setMetadata((oldMetadata) => ({
                                            ...oldMetadata,
                                            name: e.target.value,
                                        }))
                                    }
                                    fullWidth
                                />
                                <Box height={'12px'} />
                                <FormControlLabel
                                    control={
                                        <TextField
                                            value={
                                                metadata.season?.toString() ??
                                                '1'
                                            }
                                            onChange={(e) =>
                                                setMetadata({
                                                    ...metadata,
                                                    season: parseInt(
                                                        e.target.value,
                                                    ),
                                                })
                                            }
                                            disabled={metadata.type != 'show'}
                                            type={'number'}
                                            fullWidth
                                        />
                                    }
                                    label={
                                        <Box
                                            width={'auto'}
                                            margin={'0 10px 0 0'}
                                        >
                                            Season
                                        </Box>
                                    }
                                    labelPlacement={'start'}
                                    style={{ width: '100%', margin: 0 }}
                                />

                                <FormControl>
                                    <RadioGroup
                                        name={'type'}
                                        value={metadata.type}
                                        onChange={(e) =>
                                            setMetadata((oldMetadata) => ({
                                                ...oldMetadata,
                                                type: e.target
                                                    .value as Metadata['type'],
                                            }))
                                        }
                                        row
                                    >
                                        <FormControlLabel
                                            value={'movie'}
                                            control={<Radio />}
                                            label={'Movie'}
                                        />
                                        <FormControlLabel
                                            value={'show'}
                                            control={<Radio />}
                                            label={'Show'}
                                        />
                                    </RadioGroup>
                                </FormControl>

                                <FormGroup
                                    row
                                    style={{ justifyContent: 'space-around' }}
                                >
                                    <Button
                                        type={'reset'}
                                        onClick={() => {
                                            setTorrents(undefined)
                                            setSelectedMagnet('')
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type={'submit'}>Add Torrent</Button>
                                </FormGroup>
                            </form>
                        </>
                    )}
                </Box>
            </Card>
        </>
    )
}

export default Home
