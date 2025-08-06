export interface GraphQLResponse<T> {
    data?: T;
    errors?: Array<{
      message: string;
      locations?: Array<{ line: number; column: number }>;
      path?: string[];
    }>;
  }
  
  export class GraphQLClient {
    constructor(private endpoint: string) {}
  
    async query<T>(query: string, variables?: Record<string, any>): Promise<T> {
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables,
          }),
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const result: GraphQLResponse<T> = await response.json();
  
        if (result.errors) {
          throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
        }
  
        if (!result.data) {
          throw new Error('No data returned from GraphQL query');
        }
  
        return result.data;
      } catch (error) {
        console.error('GraphQL query failed:', error);
        throw error;
      }
    }
  }
  
  // Default client instance
  export const defaultGraphQLClient = new GraphQLClient('http://localhost:8080/v1/graphql');