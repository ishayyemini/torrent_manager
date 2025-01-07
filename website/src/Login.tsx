import { Button, DialogTitle, TextField } from '@mui/material'
import { useState } from 'react'

import Jellyfin from './API/jellyfin.ts'

interface LoginProps {
    afterSignIn: () => void
}

function Login({ afterSignIn }: LoginProps) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <DialogTitle>Login</DialogTitle>
                <TextField
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <TextField
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={'password'}
                />
                <br />
                <Button
                    onClick={() =>
                        Jellyfin.login(username, password).then(() =>
                            afterSignIn(),
                        )
                    }
                >
                    Submit
                </Button>
            </div>
        </>
    )
}

export default Login
