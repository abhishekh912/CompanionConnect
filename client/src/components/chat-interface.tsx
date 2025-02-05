import { useEffect, useRef } from "react";
import { Message } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatInterfaceProps {
  messages: Message[];
}

export default function ChatInterface({ messages }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const form = useForm<{ content: string }>();
  const { toast } = useToast();

  const messageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/messages", { content });
      return res.json();
    },
    onSuccess: async () => {
      try {
        await generateAIResponse();
      } catch (error) {
        console.error("Failed to generate AI response:", error);
        toast({
          title: "AI Response Failed",
          description: "Unable to get a response from the AI. Please try again.",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      form.reset();
    },
  });

  const generateAIResponse = async () => {
    const res = await apiRequest("POST", "/api/generate-message", {
      type: "conversation",
    });

    // Check if it's a rate limit error
    if (res.status === 429) {
      toast({
        title: "Service Temporarily Unavailable",
        description: "The AI service is currently experiencing high demand. Please try again in a few moments.",
        variant: "destructive",
      });
      return;
    }

    // Check for other errors
    if (!res.ok) {
      const error = await res.json();
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
      return;
    }

    return res.json();
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function onSubmit({ content }: { content: string }) {
    if (!content.trim()) return;

    try {
      await messageMutation.mutateAsync(content);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex-1 flex flex-col p-4">
      <ScrollArea ref={scrollRef} className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <Card
              key={message.id}
              className={`p-4 max-w-[80%] ${
                message.isAi ? "ml-0" : "ml-auto"
              }`}
            >
              <p className="leading-relaxed">{message.content}</p>
              <time className="text-xs text-muted-foreground">
                {new Date(message.timestamp || Date.now()).toLocaleTimeString()}
              </time>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-4 flex items-center gap-2"
      >
        <Input
          placeholder="Type a message..."
          {...form.register("content", { required: true })}
          disabled={messageMutation.isPending}
        />
        <Button
          type="submit"
          size="icon"
          disabled={messageMutation.isPending}
        >
          {messageMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}