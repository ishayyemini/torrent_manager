import {
    Backdrop,
    Box,
    Button,
    Card,
    CircularProgress,
    DialogTitle,
    FormGroup,
    Snackbar,
    TextField,
} from '@mui/material'
import { FormEventHandler, useCallback, useState } from 'react'

import API from './API/API.ts'

interface LoginProps {
    afterSignIn: () => void
}

function Login({ afterSignIn }: LoginProps) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, toggleLoading] = useState(false)
    const [snack, setSnack] = useState('')

    const onSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
        (e) => {
            e.preventDefault()
            toggleLoading(true)
            API.login(username, password)
                .then(() => {
                    toggleLoading(false)
                    afterSignIn()
                })
                .catch((err) => {
                    toggleLoading(false)
                    setSnack(err.message)
                })
        },
        [afterSignIn, password, username],
    )

    return (
        <>
            <Card>
                <Box margin={'12px'}>
                    <DialogTitle>Login</DialogTitle>

                    <form onSubmit={onSubmit}>
                        <FormGroup>
                            <TextField
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <br />
                            <TextField
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type={'password'}
                            />
                        </FormGroup>
                        <br />
                        <Button type={'submit'}>Submit</Button>
                    </form>
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

export default Login
