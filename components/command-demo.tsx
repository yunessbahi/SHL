import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  BarChart3,
  FolderTree,
  Link,
  Megaphone,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import { useEffect, useState } from "react";

const CommandMenuDemo = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleAction = (action: () => void, actionName: string) => {
    action();
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="inline-flex items-center gap-2"
      >
        <Search className="h-4 w-4" />
        <span>Quick actions...</span>
        <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Links">
            <CommandItem
              onSelect={() =>
                handleAction(
                  () => console.log("Create single link"),
                  "single-link",
                )
              }
            >
              <Link className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>New Single Link</span>
                <span className="text-muted-foreground text-xs">
                  Create a simple short link with custom slug
                </span>
              </div>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                handleAction(
                  () => console.log("Create smart link"),
                  "smart-link",
                )
              }
            >
              <Sparkles className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>New Smart Link</span>
                <span className="text-muted-foreground text-xs">
                  Create intelligent links with device and geo-targeting
                </span>
              </div>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Templates">
            <CommandItem
              onSelect={() =>
                handleAction(() => console.log("Create campaign"), "campaign")
              }
            >
              <Megaphone className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>New Campaign</span>
                <span className="text-muted-foreground text-xs">
                  Set up a marketing campaign with tracking
                </span>
              </div>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                handleAction(() => console.log("Create UTM template"), "utm")
              }
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>New UTM Template</span>
                <span className="text-muted-foreground text-xs">
                  Create reusable UTM parameter templates
                </span>
              </div>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Organization">
            <CommandItem
              onSelect={() =>
                handleAction(() => console.log("Create group"), "group")
              }
            >
              <FolderTree className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Create Group</span>
                <span className="text-muted-foreground text-xs">
                  Organize links into custom groups
                </span>
              </div>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                handleAction(() => console.log("Create tag"), "tag")
              }
            >
              <Tag className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Create Tag</span>
                <span className="text-muted-foreground text-xs">
                  Add tags to categorize and filter links
                </span>
              </div>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default CommandMenuDemo;
