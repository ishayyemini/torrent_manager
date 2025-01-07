import { useState } from 'react'
import { Box, Button, DialogTitle, TextField } from '@mui/material'

import Jellyfin from './API/jellyfin.ts'

interface HomeProps {
    afterSignOut: () => void
}

function Home({ afterSignOut }: HomeProps) {
    const [search, setSearch] = useState('')

    return (
        <>
            <Button
                onClick={() => Jellyfin.logout().then(() => afterSignOut())}
            >
                Logout
            </Button>
            <Box>
                <DialogTitle>Search for torrents</DialogTitle>
                <TextField
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </Box>
            <Button onClick={() => Jellyfin.getUsers()}>Print Users</Button>
        </>
    )
}

export default Home
