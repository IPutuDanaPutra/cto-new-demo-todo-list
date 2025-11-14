import { AppProviders } from '@/app/providers';
import { AppRouter } from '@/routes';
import '@/styles/global.css';

export function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
