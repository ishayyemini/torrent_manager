import {
    Box,
    Button,
    Card,
    DialogTitle,
    FormGroup,
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

    const onSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
        (e) => {
            e.preventDefault()
            API.login(username, password).then(() => afterSignIn())
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
        </>
    )
}

export default Login
