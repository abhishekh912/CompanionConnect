import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Message } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import ChatInterface from "@/components/chat-interface";
import SettingsDialog from "@/components/settings-dialog";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { data: messages = [] } = useQuery<Message[]>({ 
    queryKey: ["/api/messages"] 
  });

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">AI Companion</h1>
          <span className="text-muted-foreground">
            Chatting with {user?.aiName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SettingsDialog />
          <Button
            variant="outline"
            size="icon"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      
      <ChatInterface messages={messages} />
    </div>
  );
}
