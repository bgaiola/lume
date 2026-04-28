import { QueryClient } from '@tanstack/react-query';

import { ApiClientError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Do not retry 4xx responses; the user / payload is wrong, not the server.
        if (error instanceof ApiClientError && error.statusCode >= 400 && error.statusCode < 500) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
