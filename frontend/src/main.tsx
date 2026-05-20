import React from 'react';
import './index.css';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ApolloProvider } from '@apollo/client';
import client from './graphql/client';
import { Toaster } from 'sonner';

const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
      <Toaster position="top-center" />
    </ApolloProvider>
  </React.StrictMode>,
);
