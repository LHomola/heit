import { render, screen } from '@testing-library/react'
import App from '../App'

// This smoke test is a rendering pass that mounts the entire React tree and confirms that something gets displayed on the screen.
// It is designed to confirm that no error is thrown by anything in the import graph (e.g., a typo in a route)
describe('App', () => {
  it('renders the app login screen when user not authenticated', async () => {
    render(<App />)

    // findByRole keeps polling until the button is loaded 
    const loginButton = await screen.findByRole('button', { name: /login/i })

    expect(loginButton).toBeInTheDocument()
  })
})