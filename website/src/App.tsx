import './App.css'
import Login from './Login.tsx'
import { useState } from 'react'
import Home from './Home.tsx'

// TODO authentication

function App() {
    const [loggedIn, toggleLoggedIn] = useState(
        localStorage.getItem('token') != null,
    )

    return (
        <>
            {loggedIn ? (
                <Home />
            ) : (
                <Login afterSignIn={() => toggleLoggedIn(true)} />
            )}
        </>
    )
}

export default App
