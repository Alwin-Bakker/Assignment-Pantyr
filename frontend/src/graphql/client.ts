import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

const httpUrl = import.meta.env.VITE_GRAPHQL_HTTP_URL as string;
const wsUrl = import.meta.env.VITE_GRAPHQL_WS_URL as string;

const httpLink = new HttpLink({ uri: httpUrl });

const wsLink = new GraphQLWsLink(createClient({ url: wsUrl }));

const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query as Parameters<typeof getMainDefinition>[0]);
    return def.kind === 'OperationDefinition' && def.operation === 'subscription';
  },
  wsLink,
  httpLink
);

export const client = new ApolloClient({
  link: splitLink,
  // Estimate has no id field; tell Apollo to normalise it by participantId
  // so cache updates from mutations are reflected in queries without a manual refetch.
  cache: new InMemoryCache({
    typePolicies: {
      Estimate: { keyFields: ['participantId'] },
    },
  }),
});

export default client;
