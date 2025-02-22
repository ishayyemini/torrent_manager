import { useState } from 'react'
import {
    Backdrop,
    Box,
    Card,
    CircularProgress,
    IconButton,
    Snackbar,
    Tab,
    Tabs,
} from '@mui/material'
import { Logout, ListAlt, Search } from '@mui/icons-material'

import SearchTorrents from './SearchTorrents.tsx'
import ListTorrents from './ListTorrents.tsx'

interface HomeProps {
    logout: () => void
}

function Home({ logout }: HomeProps) {
    const [tab, setTab] = useState(0)
    const [loading, toggleLoading] = useState(false)
    const [snack, setSnack] = useState('')

    return (
        <>
            <Card style={{ position: 'relative' }}>
                <IconButton
                    title={'Logout'}
                    onClick={logout}
                    style={{ position: 'absolute', right: '0' }}
                >
                    <Logout />
                </IconButton>

                <Box width={'300px'} margin={'12px'}>
                    <Tabs value={tab} onChange={(_, value) => setTab(value)}>
                        <Tab icon={<Search />} />
                        <Tab icon={<ListAlt />} />
                    </Tabs>

                    {tab === 0 && (
                        <SearchTorrents
                            logout={logout}
                            toggleLoading={toggleLoading}
                            setSnack={setSnack}
                        />
                    )}

                    {tab === 1 && <ListTorrents />}
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
