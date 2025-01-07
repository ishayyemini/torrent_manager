import './App.css'
import Login from './Login.tsx'
import { useState } from 'react'
import Home from './Home.tsx'

function App() {
    const [loggedIn, toggleLoggedIn] = useState(true)

    return (
        <>
            {loggedIn ? (
                <Home afterSignOut={() => toggleLoggedIn(false)} />
            ) : (
                <Login afterSignIn={() => toggleLoggedIn(true)} />
            )}
        </>
    )
}

export default App
