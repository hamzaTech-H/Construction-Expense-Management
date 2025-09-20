export {};

declare global {
  interface Window {
    database: {
      addUser: (name: string, email: string) => Promise<number>;
      getUser: (id: number) => Promise<{ id: number; name: string; email: string } | null>;
    };
  }
}