import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BorderGradientAnimationCard() {
  return (
    <div className="max-w-md mx-auto py-6 px-4">
      <div className="relative p-[1px] overflow-hidden rounded-lg bg-background">
        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,theme(colors.primary.DEFAULT)_0%,theme(colors.secondary.DEFAULT)_50%,theme(colors.primary.DEFAULT)_100%)]" />
        <Card className="relative rounded-[calc(theme(borderRadius.lg)-1px)]">
          <CardHeader>
            <CardTitle>Create project</CardTitle>
            <CardDescription>
              Deploy your new project in one-click.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your new project will be created with the latest version of our
              framework, complete with authentication, database, and API routes.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Deploy</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
