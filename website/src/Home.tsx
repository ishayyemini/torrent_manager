import { FormEventHandler, useCallback, useState } from 'react'
import {
    Backdrop,
    Box,
    Button,
    Card,
    Checkbox,
    CircularProgress,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormGroup,
    IconButton,
    Radio,
    RadioGroup,
    Snackbar,
    TextField,
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'

import API, { BT4GResItem, Metadata, SearchOptions } from './API/API.ts'

interface HomeProps {
    logout: () => void
}

function Home({ logout }: HomeProps) {
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
    const [loading, toggleLoading] = useState(false)
    const [snack, setSnack] = useState('')

    const onSearchFormSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
        (e) => {
            e.preventDefault()
            toggleLoading(true)
            API.findTorrents(search, searchOptions)
                .then((res) => {
                    if (res.length == 0) {
                        setMetadata({
                            name: '',
                            type: 'movie',
                            season: undefined,
                        })
                        setTorrents(undefined)
                        setSnack('No torrents found :(')
                    } else {
                        setMetadata((oldMetadata) => {
                            const se =
                                search
                                    .toLowerCase()
                                    .match(/s\d\de\d\d/i)?.[0] ||
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
                        setTorrents(res)
                    }
                })
                .catch((err) => {
                    console.log(err)
                    setSnack(err.message)
                    if (err.message == 'Invalid token') logout()
                })
                .finally(() => {
                    toggleLoading(false)
                })
        },
        [logout, search, searchOptions],
    )

    const onApproveFormSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
        (e) => {
            e.preventDefault()
            if (selectedMagnet != '') {
                toggleLoading(true)
                API.addTorrent(selectedMagnet, metadata)
                    .then(() => {
                        setTorrents(undefined)
                        setSelectedMagnet('')
                        setSnack('Successfully added torrent! :)')
                    })
                    .catch((err) => {
                        setSnack(err.message)
                        if (err.message == 'Invalid token') logout()
                    })
                    .finally(() => {
                        toggleLoading(false)
                    })
            } else setTorrents(undefined)
        },
        [logout, metadata, selectedMagnet],
    )

    return (
        <>
            <Card style={{ position: 'relative' }}>
                <IconButton
                    title={'Logout'}
                    onClick={logout}
                    style={{ position: 'absolute', right: '0' }}
                >
                    <LogoutIcon />
                </IconButton>

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

            <Backdrop
                sx={(theme) => ({
                    color: '#fff',
                    zIndex: theme.zIndex.drawer + 1,
                })}
                open={loading}
            >
                <CircularProgress color="inherit" />
            </Backdrop>

            <Snackbar
                open={snack !== ''}
                autoHideDuration={5000}
                onClose={() => setSnack('')}
                message={snack}
            />
        </>
    )
}

export default Home
