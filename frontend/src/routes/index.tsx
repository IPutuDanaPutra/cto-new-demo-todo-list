import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '@/components';
import {
  DashboardPage,
  TodosPage,
  CategoriesPage,
  TagsPage,
  CalendarPage,
  SettingsPage,
  ActivityLogPage,
  NotFoundPage,
} from '@/pages';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'todos',
        element: <TodosPage />,
      },
      {
        path: 'categories',
        element: <CategoriesPage />,
      },
      {
        path: 'tags',
        element: <TagsPage />,
      },
      {
        path: 'calendar',
        element: <CalendarPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'activity',
        element: <ActivityLogPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
