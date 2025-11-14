import { Button } from '../Button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../Card';
import { Input } from '../Input';
import { LoadingSpinner } from '../LoadingSpinner';

export function ComponentShowcase() {
  return (
    <div className="space-y-8 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Component Showcase</CardTitle>
          <CardDescription>
            Examples of reusable UI components with Tailwind styling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="mb-3 font-semibold">Buttons</h4>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" size="sm">
                Small
              </Button>
              <Button variant="primary" size="lg">
                Large
              </Button>
              <Button variant="primary" isLoading>
                Loading
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-semibold">Inputs</h4>
            <div className="max-w-md space-y-3">
              <Input placeholder="Standard input" />
              <Input placeholder="With error" error="This field is required" />
              <Input type="email" placeholder="Email input" />
              <Input type="password" placeholder="Password input" />
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-semibold">Loading Spinners</h4>
            <div className="flex items-center gap-4">
              <LoadingSpinner size="sm" />
              <LoadingSpinner size="md" />
              <LoadingSpinner size="lg" />
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-semibold">Typography</h4>
            <div className="space-y-2">
              <h1>Heading 1</h1>
              <h2>Heading 2</h2>
              <h3>Heading 3</h3>
              <h4>Heading 4</h4>
              <h5>Heading 5</h5>
              <h6>Heading 6</h6>
              <p className="text-gray-600 dark:text-gray-400">
                This is body text. It uses the configured gray color scale for
                proper contrast in both light and dark modes.
              </p>
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-semibold">Color Scale</h4>
            <div className="space-y-2">
              <div className="flex gap-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
                  (shade) => (
                    <div
                      key={shade}
                      className={`h-12 w-12 rounded bg-primary-${shade} flex items-center justify-center text-xs text-white`}
                    >
                      {shade}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
