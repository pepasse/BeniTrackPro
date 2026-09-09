import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.tsx'
import { store } from './store'
import { attachAuthHandlers } from './config/apiClient'
import { tokensRefreshed, logout } from './store/authSlice'

// Branche le client API au store Redux : lui donne accès au token courant
// et lui permet de mettre à jour le store après un rafraîchissement,
// ou de déconnecter l'utilisateur si le refresh token est lui-même expiré.
attachAuthHandlers({
  getAccessToken: () => store.getState().auth.accessToken,
  getRefreshToken: () => store.getState().auth.refreshToken,
  onTokensRefreshed: (accessToken, refreshToken) => {
    store.dispatch(tokensRefreshed({ accessToken, refreshToken }));
  },
  onAuthExpired: () => {
    store.dispatch(logout());
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
