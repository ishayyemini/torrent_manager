import './App.css'
import Login from './Login.tsx'
import { useEffect, useState } from 'react'
import Home from './Home.tsx'
import API from './API/API.ts'

// TODO authentication

function App() {
    const [loggedIn, toggleLoggedIn] = useState(
        localStorage.getItem('token') != null,
    )

    useEffect(() => {
        if (loggedIn) API.user().catch(() => toggleLoggedIn(false))
    }, [loggedIn])

    return (
        <>
            {loggedIn ? (
                <Home
                    logout={() => {
                        localStorage.removeItem('token')
                        toggleLoggedIn(false)
                    }}
                />
            ) : (
                <Login afterSignIn={() => toggleLoggedIn(true)} />
            )}
        </>
    )
}

export default App
