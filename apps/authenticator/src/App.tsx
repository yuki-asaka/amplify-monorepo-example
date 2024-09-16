import {Authenticator, Button} from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import { signInWithRedirect } from 'aws-amplify/auth';
import outputs from '../amplify_outputs.json';
import '@aws-amplify/ui-react/styles.css';
import './App.css'

Amplify.configure(outputs);


const components = {
    SignIn: {
        Footer() {
            return (
                <Button
                    variation="primary"
                    onClick={async () =>
                    await signInWithRedirect({ provider: { custom: 'GitHub' }})}>
                    Sign in with GitHub
                </Button>
            );
        }
    }
}

export default function App() {
    return (
        <Authenticator
            hideSignUp
            components={components}>
            {({ signOut, user }) => (
                <main>
                    <h1>Hello {user?.username}</h1>
                    <button onClick={signOut}>Sign out</button>
                </main>
            )}
        </Authenticator>
    );
}
