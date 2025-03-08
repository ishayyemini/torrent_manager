import {
    Box,
    Button,
    DialogTitle,
    Divider,
    FormGroup,
    List,
    ListItem,
    TextField,
    Typography,
} from '@mui/material'
import API, { MonitorType, ShowItem } from './API/API.ts'
import { FormEventHandler, Fragment, useCallback, useState } from 'react'

interface NewSearchProps {
    logout: () => void
    toggleLoading: (loading: boolean) => void
    setSnack: (message: string) => void
}

function NewSearch({ logout, toggleLoading, setSnack }: NewSearchProps) {
    const [search, setSearch] = useState('')
    const [shows, setShows] = useState<ShowItem[] | undefined>()
    const [monitor, setMonitor] = useState<MonitorType | ''>('')

    const onSearchFormSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
        (e) => {
            e.preventDefault()
            toggleLoading(true)
            API.searchShow(search)
                .then((res) => {
                    setShows(res)
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
        [logout, search, setSnack, toggleLoading],
    )

    const addShow = useCallback(
        (show: ShowItem) => {
            toggleLoading(true)
            API.addShow(show, monitor || 'future')
                .then(() => {
                    setShows(undefined)
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
        [logout, monitor, setSnack, toggleLoading],
    )

    return shows == undefined ? (
        <>
            <DialogTitle>Search Shows</DialogTitle>

            <form onSubmit={onSearchFormSubmit}>
                <TextField
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    fullWidth
                />

                <Button type={'submit'}>Search</Button>
            </form>
        </>
    ) : (
        <>
            <DialogTitle>Results for: "{search}"</DialogTitle>

            <List style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {shows.length == 0 && <Box>No shows found</Box>}

                {shows.map((show) => (
                    <Fragment key={show.tvdbId}>
                        <ListItem>
                            <Button onClick={() => addShow(show)}>
                                <Box
                                    gap={'10px'}
                                    flexDirection={'row'}
                                    display={'flex'}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <Box>
                                        <img
                                            src={show.remotePoster}
                                            alt={show.title + ' poster'}
                                            width={'70px'}
                                        />
                                    </Box>
                                    <Box maxWidth={'100%'}>
                                        <Box
                                            maxWidth={'100%'}
                                            overflow={'hidden'}
                                        >
                                            <span>
                                                <b>{show.title}</b> ({show.year}
                                                )
                                            </span>
                                        </Box>
                                        <Box>
                                            <Typography fontSize={'0.7em'}>
                                                {show.overview}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Button>
                        </ListItem>
                        <Divider key={show.tvdbId + '_1'} />
                    </Fragment>
                ))}
            </List>

            <FormGroup row style={{ justifyContent: 'space-around' }}>
                <Button
                    type={'reset'}
                    onClick={() => {
                        setShows(undefined)
                    }}
                >
                    Cancel
                </Button>
            </FormGroup>
        </>
    )
}

export default NewSearch
