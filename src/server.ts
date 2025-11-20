import { createYoga } from 'graphql-yoga';
import { createServer } from 'node:http';
import type { RequestListener } from 'node:http';
import { schema } from './schema';

const yoga = createYoga({
    schema,
    graphiql: true,
    graphqlEndpoint: '/',
});

createServer(yoga as unknown as RequestListener).listen(4000, () => {
    console.log('🚀 Server ready at http://localhost:4000');
});