import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { PlusIcon } from '@heroicons/react/24/outline';

export function CategoriesPage() {
  return (
    <>
      <Helmet>
        <title>Categories - Todo Platform</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Categories</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Organize your todos with categories
            </p>
          </div>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Category
          </Button>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                No categories yet
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Create categories to organize your todos
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
