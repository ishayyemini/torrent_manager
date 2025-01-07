import { FormEventHandler, useCallback, useState } from 'react'
import {
    Box,
    Button,
    Card,
    Checkbox,
    DialogTitle,
    FormControl,
    FormControlLabel,
    Radio,
    RadioGroup,
    TextField,
} from '@mui/material'

import Torrents, { BT4GResItem, SearchOptions } from './API/torrents.ts'

// interface HomeProps {
//     afterSignOut: () => void
// }

function Home(/*{ afterSignOut }: HomeProps*/) {
    const [search, setSearch] = useState('')
    // const [options, setOptions] = useState<SearchHint[]>([])
    const [torrent, setTorrent] = useState<BT4GResItem | undefined>()
    const [searchOptions, setSearchOptions] = useState<SearchOptions>({
        hdr: true,
        quality: '2160p',
    })

    console.log(searchOptions)

    // useEffect(() => {
    //     // if (search)
    //     //     Jellyfin.searchMedia(search).then((res) => setOptions(res ?? []))
    //     // else setOptions([])
    // }, [search])

    const onSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
        (e) => {
            e.preventDefault()
            Torrents.findTorrent(search, searchOptions).then((res) =>
                setTorrent(res),
            )
        },
        [search, searchOptions],
    )

    return (
        <>
            {/*<Button*/}
            {/*    onClick={() => Jellyfin.logout().then(() => afterSignOut())}*/}
            {/*>*/}
            {/*    Logout*/}
            {/*</Button>*/}
            <Box width={'300px'} justifySelf={'center'}>
                <DialogTitle>Search</DialogTitle>

                <form onSubmit={onSubmit}>
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
                                disabled={searchOptions.quality != '2160p'}
                            />
                        }
                        label={'HDR'}
                    />

                    {/*<Autocomplete*/}
                    {/*    value={search}*/}
                    {/*    options={options.map((item) => item.Name)}*/}
                    {/*    renderInput={(params) => (*/}
                    {/*        <TextField*/}
                    {/*            {...params}*/}
                    {/*            value={search}*/}
                    {/*            onChange={(e) => setSearch(e.target.value)}*/}
                    {/*        />*/}
                    {/*    )}*/}
                    {/*/>*/}
                    {/*<Button onClick={() => Jellyfin.searchMedia(search)}>Search</Button>*/}
                    <Button type={'submit'}>Search Torrent</Button>
                </form>
            </Box>
            <br />
            <br />
            <Card>
                <Box margin={'12px'}>Title: {torrent?.title}</Box>
            </Card>
        </>
    )
}

export default Home
