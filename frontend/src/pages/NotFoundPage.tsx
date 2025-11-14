import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { HomeIcon } from '@heroicons/react/24/outline';

export function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>404 - Page Not Found</title>
      </Helmet>

      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
          <h2 className="mt-4 text-3xl font-bold">Page Not Found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link to="/">
            <Button className="mt-6">
              <HomeIcon className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
